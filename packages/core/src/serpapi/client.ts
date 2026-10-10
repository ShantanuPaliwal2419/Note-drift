import type {
  HttpFetch,
  SerpApiResponse,
  SerpApiSearchParams,
} from '../types.js';
import { SerpApiCache } from './cache.js';
import { BudgetManager } from './budget.js';
import { FixtureReplay } from './replay.js';

export interface SerpApiClientOptions {
  apiKey?: string;
  httpFetch?: HttpFetch;
  cache?: SerpApiCache;
  budget?: BudgetManager;
  demoMode?: boolean;
}

export class SerpApiClient {
  private apiKey: string;
  private httpFetch?: HttpFetch;
  private cache: SerpApiCache;
  private budget: BudgetManager;
  private demoMode: boolean;

  constructor(options: SerpApiClientOptions = {}) {
    this.apiKey = options.apiKey ?? '';
    this.httpFetch = options.httpFetch;
    this.cache = options.cache ?? new SerpApiCache();
    this.budget = options.budget ?? new BudgetManager();
    this.demoMode = options.demoMode ?? false;
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
  }

  public setDemoMode(enabled: boolean): void {
    this.demoMode = enabled;
  }

  public async search(params: SerpApiSearchParams): Promise<{ response: SerpApiResponse; isLive: boolean }> {
    // 1. Offline / Demo mode uses recorded fixtures
    if (this.demoMode) {
      const fixture = FixtureReplay.matchFixture(params.engine, params.q);
      return { response: fixture, isLive: false };
    }

    // 2. Check persistent TTL cache
    const cached = await this.cache.get(params.engine, params.q);
    if (cached) {
      return { response: cached, isLive: false };
    }

    // 3. In-scan query deduplication
    const isDuplicateInScan = this.cache.markInScanSeen(params.engine, params.q);
    if (isDuplicateInScan) {
      // Re-query cache if available, or fetch matching replay fixture
      const replay = FixtureReplay.matchFixture(params.engine, params.q);
      return { response: replay, isLive: false };
    }

    // 4. Verify API key is present for live calls
    if (!this.apiKey) {
      throw new Error('No SerpApi key configured. Set your key in settings or enable Demo mode.');
    }

    // 5. Check credit budget before spending
    const canSearch = this.budget.canExecuteSearch();
    if (!canSearch.allowed) {
      throw new Error(canSearch.reason ?? 'Search budget limit exceeded.');
    }

    if (!this.httpFetch) {
      throw new Error('No HTTP fetch function provided to SerpApiClient.');
    }

    // 6. Build official SerpApi query URL
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', params.engine);
    url.searchParams.set('q', params.q);
    url.searchParams.set('api_key', this.apiKey);

    if (params.num) url.searchParams.set('num', String(params.num));
    if (params.tbs) url.searchParams.set('tbs', params.tbs);
    if (params.as_ylo) url.searchParams.set('as_ylo', String(params.as_ylo));
    if (params.as_yhi) url.searchParams.set('as_yhi', String(params.as_yhi));
    if (params.gl) url.searchParams.set('gl', params.gl);
    if (params.hl) url.searchParams.set('hl', params.hl);

    // 7. Execute request with limited retry for 5xx errors
    let attempts = 0;
    const maxAttempts = 2;
    let lastError: Error | null = null;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const res = await this.httpFetch(url.toString(), {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (res.status === 401) {
          throw new Error('SerpApi key rejected (401). Open settings.');
        }

        if (res.status === 429) {
          throw new Error('Rate limit reached (429). Please wait before trying again.');
        }

        if (res.status >= 500) {
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue;
          }
          throw new Error(`SerpApi server error (${res.status}).`);
        }

        const json = (await res.json()) as SerpApiResponse;

        if (json.error) {
          throw new Error(`SerpApi response error: ${json.error}`);
        }

        // Record credit usage and store in cache
        this.budget.recordSearch(1);
        await this.cache.set(params.engine, params.q, json);

        return { response: json, isLive: true };
      } catch (err: any) {
        lastError = err;
        if (err.message?.includes('401') || err.message?.includes('429')) {
          throw err;
        }
      }
    }

    throw lastError ?? new Error('Failed to perform SerpApi search request.');
  }
}
