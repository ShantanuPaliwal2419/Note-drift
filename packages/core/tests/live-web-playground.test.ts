import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SerpApiClient } from '../src/serpapi/client.js';
import type { HttpFetch, SerpApiResponse } from '../src/types.js';
import {
  checkVisitorQuota,
  reserveVisitorQuota,
  commitVisitorQuota,
  resetVisitorQuotaForTesting,
} from '../../../apps/web/src/lib/quota.js';
import { processMarkdownScan } from '../../../apps/web/src/lib/scan.js';

describe('Live Web Playground & Quota Integration', () => {
  const TEST_VISITOR = 'test_visitor_uuid_12345';
  const MOCK_API_KEY = 'mock_secret_serpapi_key_abcdef1234567890';

  beforeEach(async () => {
    await resetVisitorQuotaForTesting(TEST_VISITOR);
    delete process.env.LIVE_DEMO_ENABLED;
    delete process.env.SERPAPI_API_KEY;
  });

  describe('Persistent Atomic Quota Manager', () => {
    it('allows exactly 1 scan per visitor and blocks subsequent attempts', async () => {
      // 1. Initial status: 1 scan remaining
      const status1 = checkVisitorQuota(TEST_VISITOR);
      expect(status1.allowed).toBe(true);
      expect(status1.remaining).toBe(1);

      // 2. Reserve quota
      const reservation = await reserveVisitorQuota(TEST_VISITOR);
      expect(reservation.success).toBe(true);

      // 3. Status after reservation: 0 scans remaining
      const status2 = checkVisitorQuota(TEST_VISITOR);
      expect(status2.allowed).toBe(false);
      expect(status2.remaining).toBe(0);

      // 4. Second reservation must be blocked
      const secondReservation = await reserveVisitorQuota(TEST_VISITOR);
      expect(secondReservation.success).toBe(false);
      expect(secondReservation.error).toContain('limit reached');

      // 5. Commit quota
      await commitVisitorQuota(TEST_VISITOR, { query: 'test query' });
      const status3 = checkVisitorQuota(TEST_VISITOR);
      expect(status3.allowed).toBe(false);
      expect(status3.remaining).toBe(0);
    });
  });

  describe('SerpApiClient Security & Retry Guarantees', () => {
    it('does not retry ambiguous 500 requests when maxAttempts is 1', async () => {
      let callCount = 0;
      const mockFetch: HttpFetch = async () => {
        callCount++;
        return {
          status: 500,
          text: async () => 'Internal Server Error',
          json: async () => ({ error: 'Google backend failure' }),
        };
      };

      const client = new SerpApiClient({
        apiKey: MOCK_API_KEY,
        httpFetch: mockFetch,
        maxAttempts: 1, // Web live demo config
      });

      await expect(
        client.search({ engine: 'google', q: 'libfoo release notes' })
      ).rejects.toThrow(/SerpApi server error \(500\)/);

      expect(callCount).toBe(1); // Never automatically retried!
    });

    it('redacts secret API key from error messages on 401 rejection', async () => {
      const mockFetch: HttpFetch = async (url) => {
        expect(url).toContain(MOCK_API_KEY);
        return {
          status: 401,
          text: async () => 'Unauthorized',
          json: async () => ({ error: 'Invalid API key provided' }),
        };
      };

      const client = new SerpApiClient({
        apiKey: MOCK_API_KEY,
        httpFetch: mockFetch,
        maxAttempts: 1,
      });

      try {
        await client.search({ engine: 'google', q: 'libfoo release notes' });
        expect.unreachable('Should have thrown on 401');
      } catch (err: any) {
        expect(err.message).toContain('401');
        expect(err.message).not.toContain(MOCK_API_KEY); // Secret must NEVER leak
      }
    });
  });

  describe('processMarkdownScan Live Workflow', () => {
    const testMarkdown = '# Test Note\nWe use libfoo 1.5 in production.';

    it('rejects live scan if LIVE_DEMO_ENABLED is false without making API calls', async () => {
      process.env.LIVE_DEMO_ENABLED = 'false';
      process.env.SERPAPI_API_KEY = MOCK_API_KEY;

      const mockFetch = vi.fn();

      await expect(
        processMarkdownScan(testMarkdown, true, TEST_VISITOR, mockFetch as any)
      ).rejects.toThrow(/Live demo is disabled on the server/);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects live scan if SERPAPI_API_KEY is empty without making API calls', async () => {
      process.env.LIVE_DEMO_ENABLED = 'true';
      process.env.SERPAPI_API_KEY = '';

      const mockFetch = vi.fn();

      await expect(
        processMarkdownScan(testMarkdown, true, TEST_VISITOR, mockFetch as any)
      ).rejects.toThrow(/No SerpApi key configured/);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('executes real live scan using mocked HTTP response and enforces 1-scan allowance', async () => {
      process.env.LIVE_DEMO_ENABLED = 'true';
      process.env.SERPAPI_API_KEY = MOCK_API_KEY;

      const mockSerpApiResponse: SerpApiResponse = {
        organic_results: [
          {
            title: 'libfoo 2.0 Released - Official Documentation',
            link: 'https://libfoo.dev/releases/2.0',
            snippet: 'libfoo 2.0 is now the current stable version released today.',
            date: '2026-10-10',
          },
        ],
      };

      let requestedUrl = '';
      const mockFetch: HttpFetch = async (url) => {
        requestedUrl = url;
        return {
          status: 200,
          text: async () => JSON.stringify(mockSerpApiResponse),
          json: async () => mockSerpApiResponse,
        };
      };

      // 1. First live scan: succeeds and consumes the 1-scan allowance
      const result = await processMarkdownScan(testMarkdown, true, TEST_VISITOR, mockFetch);

      expect(result.isSampleData).toBe(false);
      expect(result.claims.length).toBe(1);
      expect(result.checks.length).toBe(1);
      expect(result.checks[0]!.isLive).toBe(true);
      expect(result.checks[0]!.verdict).toBe('Likely outdated');
      expect(result.remainingLiveScans).toBe(0);

      // Verify the query was derived from the extracted claim
      expect(requestedUrl).toContain('engine=google');
      expect(requestedUrl).toContain('libfoo');
      expect(requestedUrl).toContain(`api_key=${MOCK_API_KEY}`);

      // 2. Second live scan attempt by same visitor: must be blocked by quota!
      const mockFetch2 = vi.fn();
      await expect(
        processMarkdownScan(testMarkdown, true, TEST_VISITOR, mockFetch2 as any)
      ).rejects.toThrow(/Live scan limit reached/);

      expect(mockFetch2).not.toHaveBeenCalled(); // No second API call permitted!
    });

    it('offline demo mode runs on fixtures without consuming live allowance', async () => {
      const mockFetch = vi.fn();

      const result = await processMarkdownScan(testMarkdown, false, TEST_VISITOR, mockFetch as any);

      expect(result.isSampleData).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.remainingLiveScans).toBe(1); // Still has 1 live scan available!
    });
  });
});
