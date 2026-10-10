import { App, Modal, Setting } from 'obsidian';
import type { ClaimCheck } from '@notedrift/core';

export interface ApplyDecision {
  destination: 'below-claim' | 'companion-note';
  calloutText: string;
}

export class ApplyPreviewModal extends Modal {
  private destination: 'below-claim' | 'companion-note' = 'below-claim';
  private calloutText: string;

  constructor(
    app: App,
    private notePath: string,
    private line: number,
    check: ClaimCheck,
    private onApply: (decision: ApplyDecision) => void
  ) {
    super(app);
    const today = new Date().toISOString().slice(0, 10);
    const sourceLink = check.evidence[0]?.link ?? 'Source unknown';
    const reasonText = check.reasons[0] ?? 'Time-sensitive drift detected.';

    this.calloutText = [
      `> [!warning] NoteDrift check (${today})`,
      `> ${reasonText}`,
      `> Source: ${sourceLink}`,
      `> Found via Google web search. Verify before use.`,
    ].join('\n');
  }

  public onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: `Apply check to ${this.notePath}?` });
    contentEl.createEl('p', {
      text: `Your text is not changed. This callout is inserted below line ${this.line}:`,
      cls: 'notedrift-explanation',
    });

    const previewBlock = contentEl.createEl('pre', {
      text: this.calloutText,
      cls: 'notedrift-apply-preview-code',
    });
    previewBlock.style.backgroundColor = 'var(--background-secondary)';
    previewBlock.style.padding = '10px';
    previewBlock.style.borderRadius = '4px';

    new Setting(contentEl)
      .setName('Destination')
      .setDesc('Where to attach this verification record')
      .addDropdown((dd) => {
        dd.addOption('below-claim', 'Below the claim');
        dd.addOption('companion-note', 'Companion note (.drift.md)');
        dd.setValue(this.destination);
        dd.onChange((val) => {
          this.destination = val as 'below-claim' | 'companion-note';
        });
      });

    const btnContainer = contentEl.createDiv({ cls: 'notedrift-card-footer' });
    const cancelBtn = btnContainer.createEl('button', { text: 'Cancel' });
    cancelBtn.onclick = () => this.close();

    const applyBtn = btnContainer.createEl('button', {
      text: 'Apply',
      cls: 'mod-cta',
    });
    applyBtn.onclick = () => {
      this.close();
      this.onApply({
        destination: this.destination,
        calloutText: this.calloutText,
      });
    };
  }

  public onClose(): void {
    this.contentEl.empty();
  }
}
