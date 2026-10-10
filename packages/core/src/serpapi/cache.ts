import type { SerpApiResponse, StorageAdapter } from '../types.js';

export interface CacheEntry {
  response: SerpApiResponse;
  timestamp: number; // Date.now()
  ttlMs: number;
}

export class SerpApiCache {
  private memoryCache = new Map<string, CacheEntry>();
  private inScanSeen = new Set<string>();

  constructor(
    private ttlDays = 7,
    private storage?: StorageAdapter
  ) {}

  public getCacheKey(engine: string, query: string): string {
    return `${engine.toLowerCase()}:${query.trim().toLowerCase()}`;
  }

  public resetInScanDedupe(): void {
    this.inScanSeen.clear();
  }

  public markInScanSeen(engine: string, query: string): boolean {
    const key = this.getCacheKey(engine, query);
    if (this.inScanSeen.has(key)) {
      return true; // Already seen in this scan
    }
    this.inScanSeen.add(key);
    return false;
  }

  public async get(engine: string, query: string): Promise<SerpApiResponse | null> {
    const key = this.getCacheKey(engine, query);

    // 1. Check memory cache
    let entry = this.memoryCache.get(key);

    // 2. Fall back to injected storage adapter
    if (!entry && this.storage) {
      try {
        const raw = await this.storage.getItem(`notedrift_cache_${key}`);
        if (raw) {
          entry = JSON.parse(raw) as CacheEntry;
          this.memoryCache.set(key, entry);
        }
      } catch {
        // Storage read error ignored
      }
    }

    if (!entry) return null;

    // Check expiration
    if (Date.now() - entry.timestamp > entry.ttlMs) {
      this.memoryCache.delete(key);
      if (this.storage) {
        await this.storage.removeItem(`notedrift_cache_${key}`);
      }
      return null;
    }

    return entry.response;
  }

  public async set(engine: string, query: string, response: SerpApiResponse): Promise<void> {
    const key = this.getCacheKey(engine, query);
    const ttlMs = this.ttlDays * 24 * 60 * 60 * 1000;
    const entry: CacheEntry = {
      response,
      timestamp: Date.now(),
      ttlMs,
    };

    this.memoryCache.set(key, entry);

    if (this.storage) {
      try {
        await this.storage.setItem(`notedrift_cache_${key}`, JSON.stringify(entry));
      } catch {
        // Storage write error ignored
      }
    }
  }

  public updateTtlDays(days: number): void {
    this.ttlDays = days;
  }
}
