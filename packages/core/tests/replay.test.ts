import { describe, it, expect } from 'vitest';
import { SerpApiClient } from '../src/serpapi/client.js';
import { FixtureReplay } from '../src/serpapi/replay.js';

describe('Fixture Replay & Offline Demo Mode (FR-12)', () => {
  it('serves fixtures without live HTTP calls in demo mode', async () => {
    const client = new SerpApiClient({ demoMode: true });

    const result = await client.search({
      engine: 'google',
      q: 'libfoo release notes',
    });

    expect(result.isLive).toBe(false);
    expect(result.response.organic_results?.length).toBeGreaterThan(0);
    expect((result.response as any)._sample_data).toBe(true);
  });

  it('matches appropriate fixtures based on query semantics', () => {
    const outdated = FixtureReplay.matchFixture('google', 'libfoo 1.5 release notes');
    expect(outdated.organic_results?.[0]?.link).toContain('libfoo.dev/releases');

    const scholar = FixtureReplay.matchFixture('google_scholar', 'Attention Is All You Need');
    expect(scholar.scholar_results?.[0]?.title).toContain('Attention');
  });
});
