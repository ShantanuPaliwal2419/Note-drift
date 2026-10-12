import {
  extractClaims,
  planQueriesForClaims,
  SerpApiClient,
  AuthorityClassifier,
  determineVerdict,
  parseSerpApiResponse,
  extractVersionFromText,
} from '@notedrift/core';
import type { Claim, ClaimCheck, HttpFetch } from '@notedrift/core';
import { getServerEnv } from './env';
import {
  checkVisitorQuota,
  reserveVisitorQuota,
  commitVisitorQuota,
} from './quota';

export const nodeHttpFetch: HttpFetch = async (url, options) => {
  const res = await fetch(url, {
    method: options?.method ?? 'GET',
    headers: options?.headers,
    body: options?.body,
  });
  return {
    status: res.status,
    text: () => res.text(),
    json: () => res.json(),
  };
};

function sanitizeErrorMessage(msg: string, secret?: string): string {
  let clean = msg;
  if (secret && secret.length > 5) {
    clean = clean.split(secret).join('[REDACTED]');
  }
  clean = clean.replace(/api_key=[a-zA-Z0-9_\-]+/gi, 'api_key=[REDACTED]');
  return clean;
}

export interface ScanResult {
  claims: Claim[];
  checks: ClaimCheck[];
  isSampleData: boolean;
  remainingLiveScans?: number;
  message?: string;
}

export async function processMarkdownScan(
  markdown: string,
  forceLive = false,
  visitorId = 'default_visitor',
  customFetch?: HttpFetch
): Promise<ScanResult> {
  const env = getServerEnv();
  const claims = extractClaims(markdown, { notePath: 'playground.md' });

  const quota = checkVisitorQuota(visitorId);

  // If no claims are found in note
  if (claims.length === 0) {
    return {
      claims: [],
      checks: [],
      isSampleData: !forceLive,
      remainingLiveScans: quota.remaining,
      message: 'No time-sensitive claims found in the provided markdown note.',
    };
  }

  // 1. Live scan requested by user
  if (forceLive) {
    // Check if live demo is enabled on server
    if (!env.liveDemoEnabled) {
      throw new Error(
        'Live demo is disabled on the server. Set LIVE_DEMO_ENABLED=true in apps/web/.env.local to activate live search.'
      );
    }

    // Check if server API key is configured
    if (!env.serpApiKey) {
      throw new Error(
        'No SerpApi key configured on the server. Please set SERPAPI_API_KEY in apps/web/.env.local.'
      );
    }

    // Atomic reservation of one-scan allowance before making paid API call
    const reservation = await reserveVisitorQuota(visitorId);
    if (!reservation.success) {
      throw new Error(
        reservation.error ?? 'Live scan limit reached. You are permitted only 1 live scan session.'
      );
    }

    try {
      const client = new SerpApiClient({
        apiKey: env.serpApiKey,
        httpFetch: customFetch ?? nodeHttpFetch,
        demoMode: false,
        maxAttempts: 1, // Never automatically retry an ambiguous request
      });

      const classifier = new AuthorityClassifier();
      const planned = planQueriesForClaims(claims);
      const checks: ClaimCheck[] = [];

      // Execute live search for the extracted claims
      for (let i = 0; i < claims.length; i++) {
        const claim = claims[i];
        const claimQuery = planned.find((q) => q.claimId === claim.id) ?? {
          claimId: claim.id,
          engine: 'google' as const,
          query: `${claim.entity} release notes`,
        };

        const { response, isLive } = await client.search({
          engine: claimQuery.engine,
          q: claimQuery.query,
        });

        const { evidence } = parseSerpApiResponse(
          response,
          (url) => classifier.classify(url),
          (text) => extractVersionFromText(text)
        );

        const { verdict, reasons } = determineVerdict(claim, evidence);

        checks.push({
          claimId: claim.id,
          claimText: claim.text,
          verdict,
          reasons,
          evidence,
          engine: claimQuery.engine,
          query: claimQuery.query,
          retrievedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          isLive,
        });
      }

      // Mark quota as consumed
      await commitVisitorQuota(visitorId, {
        query: checks[0]?.query,
        claimText: checks[0]?.claimText,
      });

      return {
        claims,
        checks,
        isSampleData: false,
        remainingLiveScans: 0,
      };
    } catch (err: any) {
      const safeMsg = sanitizeErrorMessage(err?.message || 'Live SerpApi search failed', env.serpApiKey);
      throw new Error(safeMsg);
    }
  }

  // 2. Default Demo Mode: Run on recorded fixtures (0 credits spent)
  const client = new SerpApiClient({
    demoMode: true,
  });

  const classifier = new AuthorityClassifier();
  const planned = planQueriesForClaims(claims);
  const checks: ClaimCheck[] = [];

  for (const claim of claims) {
    const claimQuery = planned.find((q) => q.claimId === claim.id) ?? {
      claimId: claim.id,
      engine: 'google' as const,
      query: `${claim.entity} release notes`,
    };

    const { response, isLive } = await client.search({
      engine: claimQuery.engine,
      q: claimQuery.query,
    });

    const { evidence } = parseSerpApiResponse(
      response,
      (url) => classifier.classify(url),
      (text) => extractVersionFromText(text)
    );

    const { verdict, reasons } = determineVerdict(claim, evidence);

    checks.push({
      claimId: claim.id,
      claimText: claim.text,
      verdict,
      reasons,
      evidence,
      engine: claimQuery.engine,
      query: claimQuery.query,
      retrievedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      isLive,
    });
  }

  return {
    claims,
    checks,
    isSampleData: true,
    remainingLiveScans: quota.remaining,
  };
}
