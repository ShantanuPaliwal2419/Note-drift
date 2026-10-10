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

const nodeHttpFetch: HttpFetch = async (url, options) => {
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

export async function processMarkdownScan(
  markdown: string,
  forceLive = false
): Promise<{ claims: Claim[]; checks: ClaimCheck[]; isSampleData: boolean }> {
  const env = getServerEnv();
  const claims = extractClaims(markdown, { notePath: 'playground.md' });

  if (claims.length === 0) {
    return { claims: [], checks: [], isSampleData: true };
  }

  // Live searches require live demo enabled and valid server key
  const useLive = forceLive && env.liveDemoEnabled && !!env.serpApiKey;

  const client = new SerpApiClient({
    apiKey: useLive ? env.serpApiKey : undefined,
    httpFetch: nodeHttpFetch,
    demoMode: !useLive,
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
    isSampleData: !useLive,
  };
}
