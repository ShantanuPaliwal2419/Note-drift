import type { Claim, SearchEngine } from '../types.js';

export interface PlannedQuery {
  claimId: string;
  engine: SearchEngine;
  query: string;
  isEscalation?: boolean; // e.g. News escalation if no official source found
}

const DEFAULT_DOMAIN_MAP: Record<string, string> = {
  react: 'react.dev',
  node: 'nodejs.org',
  'node.js': 'nodejs.org',
  nodejs: 'nodejs.org',
  python: 'python.org',
  pandas: 'pandas.pydata.org',
  numpy: 'numpy.org',
  scipy: 'scipy.org',
  quantlib: 'quantlib.org',
  statsmodels: 'statsmodels.org',
  yfinance: 'pypi.org',
  polars: 'pola.rs',
  'scikit-learn': 'scikit-learn.org',
  pytorch: 'pytorch.org',
  cvxpy: 'cvxpy.org',
  'ta-lib': 'ta-lib.org',
  talib: 'ta-lib.org',
  'european central bank': 'ecb.europa.eu',
  ecb: 'ecb.europa.eu',
  'federal reserve': 'federalreserve.gov',
  sec: 'sec.gov',
  imf: 'imf.org',
  'world bank': 'worldbank.org',
  nextjs: 'nextjs.org',
  'next.js': 'nextjs.org',
  vue: 'vuejs.org',
  'vue.js': 'vuejs.org',
  angular: 'angular.dev',
  typescript: 'typescriptlang.org',
  vitest: 'vitest.dev',
  tailwindcss: 'tailwindcss.com',
  tailwind: 'tailwindcss.com',
  rust: 'rust-lang.org',
  go: 'go.dev',
  golang: 'go.dev',
  libfoo: 'libfoo.dev',
};

const INVALID_ENTITIES = new Set([
  'this', 'that', 'these', 'those', 'it', 'its', 'we', 'they', 'our', 'the',
  'topic', 'step', 'chapter', 'section', 'part', 'level', 'page'
]);

/**
 * Builds planned SerpApi queries for a list of claims.
 * Dedupes queries so that multiple claims about the same entity/topic reuse the same query.
 */
export function planQueriesForClaims(
  claims: Claim[],
  officialDomainsMap?: Record<string, string>
): PlannedQuery[] {
  const planned: PlannedQuery[] = [];
  const seenQueries = new Set<string>();

  const domainMap = { ...DEFAULT_DOMAIN_MAP, ...(officialDomainsMap ?? {}) };

  for (const claim of claims) {
    const rawEntity = claim.entity.trim();
    if (!rawEntity || INVALID_ENTITIES.has(rawEntity.toLowerCase())) {
      continue; // Skip invalid pronoun entities
    }

    if (claim.type === 'paper') {
      const q = claim.entity;
      const key = `google_scholar:${q.toLowerCase()}`;
      if (!seenQueries.has(key)) {
        seenQueries.add(key);
        planned.push({
          claimId: claim.id,
          engine: 'google_scholar',
          query: q,
        });
      }
      continue;
    }

    const domain = domainMap[rawEntity.toLowerCase()];

    // Temporal claims query current status or latest updates
    if (claim.type === 'temporal') {
      const q = domain
        ? `site:${domain} ${rawEntity} latest updates`
        : `${rawEntity} latest updates`;
      const qKey = `google:${q.toLowerCase()}`;
      if (!seenQueries.has(qKey)) {
        seenQueries.add(qKey);
        planned.push({
          claimId: claim.id,
          engine: 'google',
          query: q,
        });
      }
      continue;
    }

    // Version claims query release notes and version
    let primaryQ: string;
    if (domain) {
      primaryQ = `site:${domain} ${rawEntity} release notes`;
    } else {
      primaryQ = `${rawEntity} release notes`;
    }

    const primaryKey = `google:${primaryQ.toLowerCase()}`;
    if (!seenQueries.has(primaryKey)) {
      seenQueries.add(primaryKey);
      planned.push({
        claimId: claim.id,
        engine: 'google',
        query: primaryQ,
      });
    }

    // Secondary query only if no site-restricted domain was found
    if (!domain) {
      const secondaryQ = `${rawEntity} latest version`;
      const secondaryKey = `google:${secondaryQ.toLowerCase()}`;
      if (!seenQueries.has(secondaryKey)) {
        seenQueries.add(secondaryKey);
        planned.push({
          claimId: claim.id,
          engine: 'google',
          query: secondaryQ,
        });
      }
    }
  }

  return planned;
}
