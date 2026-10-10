import type { SourceAuthority } from '../types.js';
import officialDomainsJson from '../../rules/official-domains.json' with { type: 'json' };

export class AuthorityClassifier {
  private officialDomains: Set<string>;
  private referenceDomains: Set<string>;
  private communityDomains: Set<string>;

  constructor(customOfficialDomains: string[] = []) {
    this.officialDomains = new Set([
      ...officialDomainsJson.official.map((d) => d.toLowerCase()),
      ...customOfficialDomains.map((d) => d.toLowerCase()),
    ]);
    this.referenceDomains = new Set(officialDomainsJson.reference.map((d) => d.toLowerCase()));
    this.communityDomains = new Set(officialDomainsJson.community.map((d) => d.toLowerCase()));
  }

  public updateCustomOfficialDomains(domains: string[]): void {
    for (const d of domains) {
      this.officialDomains.add(d.toLowerCase());
    }
  }

  public classify(rawUrl: string): SourceAuthority {
    try {
      const url = new URL(rawUrl);
      const hostname = url.hostname.toLowerCase();
      const hostAndPath = `${hostname}${url.pathname}`.toLowerCase();

      // Check official domains
      for (const domain of this.officialDomains) {
        if (hostname === domain || hostname.endsWith(`.${domain}`) || hostAndPath.startsWith(domain)) {
          return 'Official';
        }
      }

      // Check reference domains
      for (const domain of this.referenceDomains) {
        if (hostname === domain || hostname.endsWith(`.${domain}`)) {
          return 'Reference';
        }
      }

      // Check community domains
      for (const domain of this.communityDomains) {
        if (hostname === domain || hostname.endsWith(`.${domain}`)) {
          return 'Community';
        }
      }

      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  }
}
