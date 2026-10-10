import { App, TFile, Notice } from 'obsidian';
import { extractClaims } from '@notedrift/core';
import type { Verdict } from '@notedrift/core';

export interface NoteScanScore {
  file: TFile;
  claimCount: number;
  daysSinceEdit: number;
  backlinkCount: number;
  priorityScore: number;
}

export interface NoteDriftReportItem {
  notePath: string;
  flagCount: number;
  worstVerdict: Verdict;
  lastChecked: string;
  status: 'Checked' | 'Skipped' | 'Over budget';
}

export class VaultScannerService {
  constructor(private app: App) {}

  public async prioritizeNotes(scope: 'all' | 'flagged' | 'folders'): Promise<NoteScanScore[]> {
    const files = this.app.vault.getMarkdownFiles();
    const scored: NoteScanScore[] = [];
    const now = Date.now();
    const resolvedLinks = this.app.metadataCache.resolvedLinks;

    for (const file of files) {
      const content = await this.app.vault.read(file);
      const claims = extractClaims(content, { notePath: file.path });

      if (scope === 'flagged' && claims.length === 0) {
        continue;
      }

      const daysSinceEdit = Math.max(0, Math.floor((now - file.stat.mtime) / (1000 * 60 * 60 * 24)));
      
      let backlinks = 0;
      if (resolvedLinks) {
        for (const source in resolvedLinks) {
          if (resolvedLinks[source]?.[file.path]) {
            backlinks++;
          }
        }
      }

      // Scoring formula: claims * 3 + daysSinceEdit * 0.5 + backlinks * 1
      const priorityScore = claims.length * 3 + daysSinceEdit * 0.5 + backlinks * 1;

      scored.push({
        file,
        claimCount: claims.length,
        daysSinceEdit,
        backlinkCount: backlinks,
        priorityScore,
      });
    }

    return scored.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  public async generateReport(reportItems: NoteDriftReportItem[]): Promise<TFile> {
    const today = new Date().toISOString().slice(0, 10);
    const reportPath = 'NoteDrift Drift Report.md';

    let markdown = `# NoteDrift Vault Drift Report (${today})\n\n`;
    markdown += `Summary of time-sensitive claims and verification status across your vault.\n\n`;
    markdown += `| Note | Flagged Claims | Worst Verdict | Status | Last Checked |\n`;
    markdown += `|---|---|---|---|---|\n`;

    for (const item of reportItems) {
      markdown += `| [[${item.notePath}]] | ${item.flagCount} | ${item.worstVerdict} | ${item.status} | ${item.lastChecked} |\n`;
    }

    markdown += `\n\n> NoteDrift Indian Hackathon 2026. Only claim queries were sent to SerpApi. Note contents remain local.`;

    const file = this.app.vault.getAbstractFileByPath(reportPath);
    if (file instanceof TFile) {
      await this.app.vault.modify(file, markdown);
      new Notice(`Updated existing report: ${reportPath}`);
      return file;
    } else {
      const created = await this.app.vault.create(reportPath, markdown);
      new Notice(`Generated drift report: ${reportPath}`);
      return created;
    }
  }
}
