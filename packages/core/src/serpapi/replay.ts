import type { SerpApiResponse } from '../types.js';
import outdatedFixture from '../../fixtures/serpapi/libfoo-outdated.json' with { type: 'json' };
import currentFixture from '../../fixtures/serpapi/libfoo-current.json' with { type: 'json' };
import communityFixture from '../../fixtures/serpapi/libfoo-community-only.json' with { type: 'json' };
import noVersionFixture from '../../fixtures/serpapi/libfoo-no-version.json' with { type: 'json' };
import deadLinkFixture from '../../fixtures/serpapi/dead-link-rescue.json' with { type: 'json' };
import scholarFixture from '../../fixtures/serpapi/google-scholar-sample.json' with { type: 'json' };

/**
 * Replay manager for serving recorded SerpApi fixtures.
 * Used in demo mode and automated tests without requiring live API credits or network access.
 */
export class FixtureReplay {
  public static matchFixture(engine: string, query: string): SerpApiResponse {
    const q = query.toLowerCase();

    if (engine === 'google_scholar' || q.includes('attention') || q.includes('vaswani')) {
      return scholarFixture as unknown as SerpApiResponse;
    }

    if (q.includes('getting started') || q.includes('guide') || q.includes('404')) {
      return deadLinkFixture as unknown as SerpApiResponse;
    }

    if (q.includes('release notes') || q.includes('2.0') || q.includes('libfoo 1.5')) {
      return outdatedFixture as unknown as SerpApiResponse;
    }

    if (q.includes('latest version') || q.includes('current')) {
      return currentFixture as unknown as SerpApiResponse;
    }

    if (q.includes('announcement') || q.includes('community')) {
      return communityFixture as unknown as SerpApiResponse;
    }

    if (q.includes('async')) {
      return noVersionFixture as unknown as SerpApiResponse;
    }

    // Default fallback to outdatedFixture for fictional libfoo queries
    return outdatedFixture as unknown as SerpApiResponse;
  }
}
