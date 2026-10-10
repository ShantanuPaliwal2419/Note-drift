import { App, Modal, Setting } from 'obsidian';

export interface DeadLinkCandidate {
  originalUrl: string;
  linkText: string;
  statusText: string;
  candidates: Array<{ url: string; authority: string; title: string }>;
}

export class DeadLinksModal extends Modal {
  private selectedReplacements: Map<string, string> = new Map(); // originalUrl -> replacementUrl

  constructor(
    app: App,
    private notePath: string,
    private deadLinks: DeadLinkCandidate[],
    private onApply: (replacements: Map<string, string>) => void
  ) {
    super(app);
  }

  public onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: `Dead links in ${this.notePath}` });
    contentEl.createEl('p', {
      text: `${this.deadLinks.length} dead link(s) found. Pick a replacement (nothing changes automatically):`,
      cls: 'notedrift-explanation',
    });

    if (this.deadLinks.length === 0) {
      contentEl.createEl('p', { text: 'All checked links are responding normally (200 OK).' });
      return;
    }

    const container = contentEl.createDiv({ cls: 'notedrift-deadlink-list' });

    for (let i = 0; i < this.deadLinks.length; i++) {
      const item = this.deadLinks[i]!;
      const box = container.createDiv({ cls: 'notedrift-evidence-card' });

      box.createEl('div', {
        text: `${i + 1}. ${item.originalUrl} (${item.statusText})`,
        cls: 'notedrift-claim-text',
      });
      if (item.linkText) {
        box.createEl('div', {
          text: `Link text: "${item.linkText}"`,
          cls: 'notedrift-explanation',
        });
      }

      const options = item.candidates.map((c) => ({
        label: `${c.url} [${c.authority}] - ${c.title}`,
        value: c.url,
      }));

      new Setting(box)
        .setName('Replacement')
        .addDropdown((dd) => {
          dd.addOption('skip', 'Skip (keep unchanged)');
          for (const opt of options) {
            dd.addOption(opt.value, opt.label);
          }
          dd.setValue('skip');
          dd.onChange((val) => {
            if (val === 'skip') {
              this.selectedReplacements.delete(item.originalUrl);
            } else {
              this.selectedReplacements.set(item.originalUrl, val);
            }
          });
        });
    }

    const btnContainer = contentEl.createDiv({ cls: 'notedrift-card-footer' });
    const closeBtn = btnContainer.createEl('button', { text: 'Close' });
    closeBtn.onclick = () => this.close();

    const applyBtn = btnContainer.createEl('button', {
      text: 'Apply selected',
      cls: 'mod-cta',
    });
    applyBtn.onclick = () => {
      this.close();
      this.onApply(this.selectedReplacements);
    };
  }

  public onClose(): void {
    this.contentEl.empty();
  }
}
