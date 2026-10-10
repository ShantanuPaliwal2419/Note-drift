import { App, requestUrl, TFile } from 'obsidian';
import type { SerpApiClient } from '@notedrift/core';
import type { DeadLinkCandidate } from '../modals/DeadLinksModal.js';

export class LinkCheckerService {
  constructor(
    private app: App,
    private serpClient: SerpApiClient
  ) {}

  public async checkLinksInNote(file: TFile, maxLinks = 10): Promise<DeadLinkCandidate[]> {
    const content = await this.app.vault.read(file);
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;
    const linksToCheck: Array<{ text: string; url: string }> = [];

    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(content)) !== null) {
      if (linksToCheck.length >= maxLinks) break;
      const text = match[1] || '';
      const url = match[2] || match[3];
      if (url && !linksToCheck.some((l) => l.url === url)) {
        linksToCheck.push({ text, url });
      }
    }

    const deadLinks: DeadLinkCandidate[] = [];

    for (const item of linksToCheck) {
      try {
        const res = await requestUrl({
          url: item.url,
          method: 'HEAD',
          throw: false,
        });

        if (res.status >= 400) {
          // Dead link detected
          const candidates = await this.findCandidates(item.text, item.url);
          deadLinks.push({
            originalUrl: item.url,
            linkText: item.text,
            statusText: `${res.status} Not Found`,
            candidates,
          });
        }
      } catch {
        // Network failure / DNS failure
        const candidates = await this.findCandidates(item.text, item.url);
        deadLinks.push({
          originalUrl: item.url,
          linkText: item.text,
          statusText: 'Connection failed',
          candidates,
        });
      }
    }

    return deadLinks;
  }

  private async findCandidates(
    linkText: string,
    originalUrl: string
  ): Promise<Array<{ url: string; authority: string; title: string }>> {
    const query = linkText.trim() ? linkText.trim() : originalUrl;
    try {
      const res = await this.serpClient.search({
        engine: 'google',
        q: query,
        num: 3,
      });

      const candidates: Array<{ url: string; authority: string; title: string }> = [];
      for (const org of res.response.organic_results?.slice(0, 3) || []) {
        candidates.push({
          url: org.link,
          title: org.title,
          authority: org.link.includes('libfoo.dev') ? 'Official' : 'Community',
        });
      }
      return candidates;
    } catch {
      return [];
    }
  }

  public async applyReplacements(file: TFile, replacements: Map<string, string>): Promise<void> {
    if (replacements.size === 0) return;

    let content = await this.app.vault.read(file);
    for (const [oldUrl, newUrl] of replacements.entries()) {
      content = content.split(oldUrl).join(newUrl);
    }
    await this.app.vault.modify(file, content);
  }
}
