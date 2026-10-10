import { describe, it, expect } from 'vitest';
import { BudgetManager } from '../src/serpapi/budget.js';
import { SerpApiCache } from '../src/serpapi/cache.js';

describe('Credit Budget & Cache (FR-09)', () => {
  it('enforces per-scan cap', () => {
    const budget = new BudgetManager({ maxSearchesPerScan: 2, maxSearchesPerDay: 10 });
    expect(budget.canExecuteSearch().allowed).toBe(true);

    budget.recordSearch(1);
    expect(budget.canExecuteSearch().allowed).toBe(true);

    budget.recordSearch(1);
    const check = budget.canExecuteSearch();
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Scan limit reached');

    budget.resetScan();
    expect(budget.canExecuteSearch().allowed).toBe(true);
  });

  it('enforces daily cap and records usage', () => {
    const budget = new BudgetManager({ maxSearchesPerScan: 10, maxSearchesPerDay: 2 });
    budget.recordSearch(2);

    const check = budget.canExecuteSearch();
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Daily credit limit reached');
  });

  it('handles TTL cache correctly', async () => {
    const cache = new SerpApiCache(7);
    const mockResponse: any = { organic_results: [{ title: 'Cached result', link: 'https://libfoo.dev' }] };

    await cache.set('google', 'libfoo version', mockResponse);

    const retrieved = await cache.get('google', 'libfoo version');
    expect(retrieved).toEqual(mockResponse);

    const miss = await cache.get('google', 'unknown query');
    expect(miss).toBeNull();
  });
});
