import type { SourceEvidence, SearchEngine } from '../types.js';

export class EngineRouter {
  public static selectInitialEngine(claimType: string): SearchEngine {
    if (claimType === 'paper') {
      return 'google_scholar';
    }
    return 'google';
  }

  public static shouldEscalateToNews(evidenceList: SourceEvidence[]): boolean {
    // Escalate to Google News ONLY if no Official source was found in initial web results
    const hasOfficial = evidenceList.some((e) => e.authority === 'Official');
    return !hasOfficial;
  }

  public static buildNewsQuery(entity: string): string {
    return `${entity} new release announcement`;
  }
}
