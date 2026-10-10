/**
 * Core type definitions for NoteDrift.
 * Pure TypeScript with no Obsidian or Next.js dependencies.
 */

export type ClaimType = 'version' | 'temporal' | 'paper' | 'link';

export interface Claim {
  id: string;
  notePath: string;
  line: number; // 1-indexed line number in Markdown note
  lineEnd?: number;
  text: string; // Exact text of the claim statement
  type: ClaimType;
  entity: string; // Subject / library / tool (e.g., 'libfoo')
  version?: string; // Stated version (e.g., '1.5')
  temporalPhrase?: string; // e.g. 'latest', 'current', 'as of 2024'
  ignored?: boolean;
  snoozedUntil?: string; // ISO date string
}

export type SourceAuthority = 'Official' | 'Reference' | 'Community' | 'Unknown';

export type Verdict = 'Likely outdated' | 'May be outdated' | 'Looks current' | "Can't verify";

export const VERDICT_BADGES: Record<Verdict, { symbol: string; label: string }> = {
  'Likely outdated': { symbol: '[!]', label: 'LIKELY OUTDATED' },
  'May be outdated': { symbol: '[~]', label: 'MAY BE OUTDATED' },
  'Looks current': { symbol: '[=]', label: 'LOOKS CURRENT' },
  "Can't verify": { symbol: '[?]', label: "CAN'T VERIFY" },
};

export type SearchEngine = 'google' | 'google_news' | 'google_scholar';

export interface SourceEvidence {
  title: string;
  link: string;
  snippet: string;
  date: string; // Published date if provided, otherwise 'date: unknown'
  authority: SourceAuthority;
  detectedVersion?: string;
  authors?: string;
  citationCount?: number;
}

export interface CheckDiff {
  changed: boolean;
  previousVerdict?: Verdict;
  newOfficialSource?: boolean;
  newVersionFound?: string;
  summary?: string;
}

export interface ClaimCheck {
  claimId: string;
  claimText: string;
  verdict: Verdict;
  reasons: string[];
  evidence: SourceEvidence[];
  engine: SearchEngine;
  query: string;
  retrievedAt: string; // ISO timestamp
  isLive: boolean; // true if live SerpApi, false if cached or fixture
  diff?: CheckDiff;
}

export interface SerpApiSearchParams {
  engine: SearchEngine;
  q: string;
  num?: number;
  tbs?: string;
  as_ylo?: number;
  as_yhi?: number;
  gl?: string;
  hl?: string;
}

export interface SerpApiOrganicResult {
  position?: number;
  title: string;
  link: string;
  snippet?: string;
  date?: string;
  displayed_link?: string;
}

export interface SerpApiNewsResult {
  position?: number;
  title: string;
  link: string;
  snippet?: string;
  date?: string;
  source?: { name?: string };
}

export interface SerpApiScholarResult {
  position?: number;
  title: string;
  link: string;
  snippet?: string;
  publication_info?: {
    summary?: string;
    authors?: Array<{ name: string }>;
  };
  inline_links?: {
    cited_by?: {
      total?: number;
      link?: string;
    };
  };
}

export interface SerpApiResponse {
  search_metadata?: {
    id?: string;
    status?: string;
    created_at?: string;
    processed_at?: string;
    total_time_taken?: number;
  };
  organic_results?: SerpApiOrganicResult[];
  news_results?: SerpApiNewsResult[];
  scholar_results?: SerpApiScholarResult[];
  error?: string;
}

export interface HttpResponse {
  status: number;
  text(): Promise<string> | string;
  json(): Promise<any> | any;
}

export type HttpFetch = (
  url: string,
  options?: {
    headers?: Record<string, string>;
    method?: string;
    body?: string;
  }
) => Promise<HttpResponse>;

export interface NoteDriftSettings {
  apiKey: string;
  demoMode: boolean;
  maxSearchesPerScan: number;
  maxSearchesPerDay: number;
  cacheTtlDays: number;
  scanScope: 'all' | 'flagged' | 'folders';
  previewQueries: boolean;
  writeToProperties: boolean;
  officialDomains: string[];
  ignoredFolders?: string[];
}

export interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}
