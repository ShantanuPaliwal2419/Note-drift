import type { Claim, ClaimCheck } from '@notedrift/core';
import { VERDICT_BADGES } from '@notedrift/core';

export interface EvidenceCardCallbacks {
  onApply: (claim: Claim, check: ClaimCheck) => void;
  onIgnore: (claim: Claim) => void;
  onSnooze: (claim: Claim) => void;
  onRecheck: (claim: Claim) => void;
  onOpenSource: (url: string) => void;
}

export class EvidenceCard {
  public static render(
    containerEl: HTMLElement,
    claim: Claim,
    check: ClaimCheck,
    callbacks: EvidenceCardCallbacks
  ): HTMLElement {
    const card = containerEl.createDiv({ cls: 'notedrift-evidence-card' });

    // 1. Header with Claim & Line info
    const header = card.createDiv({ cls: 'notedrift-card-header' });
    const claimTitle = header.createEl('div', {
      text: `Claim (line ${claim.line}): ${claim.text}`,
      cls: 'notedrift-claim-text',
    });
    claimTitle.tabIndex = 0;

    // 2. Verdict Badge
    const badgeInfo = VERDICT_BADGES[check.verdict];
    const badgeClass = `notedrift-badge notedrift-badge-${check.verdict.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const badge = header.createDiv({ cls: badgeClass });
    badge.createEl('span', { text: `${badgeInfo.symbol} ${badgeInfo.label}` });

    // 3. Explanation reasons
    if (check.reasons.length > 0) {
      const whyBox = card.createDiv({ cls: 'notedrift-explanation' });
      whyBox.createEl('span', { text: `Why: ${check.reasons.join('; ')}` });
    }

    // 4. Sources list
    if (check.evidence.length > 0) {
      const sourcesBox = card.createDiv({ cls: 'notedrift-sources' });
      sourcesBox.createEl('strong', { text: 'Sources:' });

      for (const ev of check.evidence) {
        const item = sourcesBox.createDiv({ cls: 'notedrift-source-item' });

        const titleRow = item.createDiv({ cls: 'notedrift-source-meta' });
        titleRow.createEl('span', { text: `[${ev.authority}]` });

        const linkEl = item.createEl('a', {
          text: ev.title,
          href: ev.link,
          cls: 'notedrift-source-title',
        });
        linkEl.onclick = (e) => {
          e.preventDefault();
          callbacks.onOpenSource(ev.link);
        };

        const metaRow = item.createDiv({ cls: 'notedrift-source-meta' });
        metaRow.createEl('span', { text: ev.link });
        metaRow.createEl('span', { text: `date: ${ev.date}` });
      }
    }

    // 5. Verification metadata (query, engine, timestamp)
    const metaBox = card.createDiv({ cls: 'notedrift-meta-footer' });
    metaBox.createEl('div', {
      text: `Checked via: ${check.engine} | Query: "${check.query}"`,
    });
    metaBox.createEl('div', {
      text: `Retrieved: ${check.retrievedAt} (${check.isLive ? 'live' : 'cached/fixture'})`,
    });

    // 6. Diff since last check
    if (check.diff && check.diff.changed) {
      const diffBox = card.createDiv({ cls: 'notedrift-explanation' });
      diffBox.createEl('strong', { text: `Since last check: ${check.diff.summary}` });
    }

    // 7. Action buttons
    const actions = card.createDiv({ cls: 'notedrift-card-footer' });

    const applyBtn = actions.createEl('button', { text: 'Apply...', cls: 'mod-cta' });
    applyBtn.onclick = () => callbacks.onApply(claim, check);

    const ignoreBtn = actions.createEl('button', { text: 'Ignore' });
    ignoreBtn.onclick = () => callbacks.onIgnore(claim);

    const snoozeBtn = actions.createEl('button', { text: 'Snooze 30d' });
    snoozeBtn.onclick = () => callbacks.onSnooze(claim);

    const recheckBtn = actions.createEl('button', { text: 'Re-check' });
    recheckBtn.onclick = () => callbacks.onRecheck(claim);

    if (check.evidence[0]?.link) {
      const openBtn = actions.createEl('button', { text: 'Open source' });
      openBtn.onclick = () => callbacks.onOpenSource(check.evidence[0]!.link);
    }

    return card;
  }
}
