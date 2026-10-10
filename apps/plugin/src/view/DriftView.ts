import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import type { Claim, ClaimCheck } from '@notedrift/core';
import { VERDICT_BADGES } from '@notedrift/core';
import { EvidenceCard } from './EvidenceCard.js';
import { DemoModeService } from '../services/demo.js';
import type NoteDriftPlugin from '../main.js';

export const VIEW_TYPE_NOTEDRIFT = 'notedrift-view';

export class DriftView extends ItemView {
  private claims: Claim[] = [];
  private checks: Map<string, ClaimCheck> = new Map();
  private expandedClaims: Set<string> = new Set();
  private isScanning = false;
  private currentNoteName = '';
  private scanStats = { live: 0, cached: 0 };
  private errorMessage = '';

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: NoteDriftPlugin
  ) {
    super(leaf);
  }

  public getViewType(): string {
    return VIEW_TYPE_NOTEDRIFT;
  }

  public getDisplayText(): string {
    return 'NoteDrift';
  }

  public getIcon(): string {
    return 'activity';
  }

  public setScanning(scanning: boolean): void {
    this.isScanning = scanning;
    this.errorMessage = '';
    this.render();
  }

  public setError(msg: string): void {
    this.errorMessage = msg;
    this.isScanning = false;
    this.render();
  }

  public updateResults(
    noteName: string,
    claims: Claim[],
    checks: Map<string, ClaimCheck>,
    stats: { live: number; cached: number }
  ): void {
    this.currentNoteName = noteName;
    this.claims = claims;
    this.checks = checks;
    this.scanStats = stats;
    this.isScanning = false;
    this.errorMessage = '';
    this.render();
  }

  public async onOpen(): Promise<void> {
    this.render();
  }

  public render(): void {
    const container = this.contentEl;
    container.empty();
    container.addClass('notedrift-view-container');

    // 1. Header
    const header = container.createDiv({ cls: 'notedrift-header' });
    header.createEl('div', { text: 'NoteDrift', cls: 'notedrift-title' });

    const actionBox = header.createDiv({ cls: 'notedrift-actions' });
    const scanBtn = actionBox.createEl('button', { text: 'Scan' });
    scanBtn.onclick = () => this.plugin.scanActiveNote();

    const linksBtn = actionBox.createEl('button', { text: 'Links' });
    linksBtn.onclick = () => this.plugin.checkLinksInActiveNote();

    // 2. Demo Banner (if demo mode is ON)
    if (this.plugin.settings.demoMode) {
      DemoModeService.renderDemoBanner(container, async () => {
        this.plugin.settings.demoMode = false;
        await this.plugin.saveSettings();
        new Notice('Demo mode disabled.');
        this.render();
      });
    }

    // 3. Error state
    if (this.errorMessage) {
      const errBox = container.createDiv({ cls: 'notedrift-banner-demo' });
      errBox.style.borderLeftColor = 'var(--text-error)';
      errBox.createEl('span', { text: this.errorMessage });
      return;
    }

    // 4. Scanning state
    if (this.isScanning) {
      const scanBox = container.createDiv({ cls: 'notedrift-note-summary' });
      scanBox.createEl('span', { text: 'Scanning note claims against SerpApi...' });
      const cancelBtn = container.createEl('button', { text: 'Cancel' });
      cancelBtn.onclick = () => {
        this.isScanning = false;
        this.render();
      };
      return;
    }

    // 5. Note summary
    if (this.currentNoteName) {
      const summary = container.createDiv({ cls: 'notedrift-note-summary' });
      summary.createEl('span', { text: this.currentNoteName });
      summary.createEl('span', { text: `${this.claims.length} flagged` });
    }

    // 6. Empty state
    if (this.claims.length === 0) {
      const emptyBox = container.createDiv({ cls: 'notedrift-explanation' });
      emptyBox.createEl('p', {
        text: this.currentNoteName
          ? 'No time-sensitive claims found in this note.'
          : 'Open a markdown note and click [Scan] to check for outdated drift.',
      });
      return;
    }

    // 7. Evidence list
    const list = container.createDiv({ cls: 'notedrift-evidence-list' });

    for (const claim of this.claims) {
      const check = this.checks.get(claim.id);
      if (!check) continue;

      const isExpanded = this.expandedClaims.has(claim.id);

      if (isExpanded) {
        EvidenceCard.render(list, claim, check, {
          onApply: (c, chk) => this.plugin.promptApplyPreview(c, chk),
          onIgnore: (c) => {
            this.plugin.historyStore.ignoreClaim(c.id);
            new Notice(`Claim "${c.text}" ignored.`);
            this.plugin.scanActiveNote();
          },
          onSnooze: (c) => {
            this.plugin.historyStore.snoozeClaim(c.id, 30);
            new Notice(`Claim "${c.text}" snoozed for 30 days.`);
            this.plugin.scanActiveNote();
          },
          onRecheck: (c) => this.plugin.recheckClaim(c),
          onOpenSource: (url) => window.open(url, '_blank'),
        });
      } else {
        // Compact row
        const row = list.createDiv({ cls: 'notedrift-evidence-card' });
        const rowHeader = row.createDiv({ cls: 'notedrift-card-header' });

        const badgeInfo = VERDICT_BADGES[check.verdict];
        const badgeClass = `notedrift-badge notedrift-badge-${check.verdict.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const badge = rowHeader.createDiv({ cls: badgeClass });
        badge.createEl('span', { text: `${badgeInfo.symbol} ${badgeInfo.label}` });

        const toggleBtn = rowHeader.createEl('button', { text: '> details' });
        toggleBtn.onclick = () => {
          this.expandedClaims.add(claim.id);
          this.render();
        };

        const claimLine = row.createDiv({ cls: 'notedrift-claim-text' });
        claimLine.createEl('span', { text: `${claim.entity} ${claim.version ?? ''} (line ${claim.line})` });

        if (check.reasons[0]) {
          const reasonLine = row.createDiv({ cls: 'notedrift-explanation' });
          reasonLine.createEl('span', { text: check.reasons[0] });
        }
      }
    }

    // 8. Footer with stats
    const footer = container.createDiv({ cls: 'notedrift-meta-footer' });
    footer.createEl('span', {
      text: `Scan: ${this.scanStats.live} live searches, ${this.scanStats.cached} cached (est.)`,
    });
  }
}
