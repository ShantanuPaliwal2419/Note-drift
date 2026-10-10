import { App, Modal, Setting } from 'obsidian';
import type { PlannedQuery } from '@notedrift/core';

export class QueryPreviewModal extends Modal {
  private selectedQueries: Set<string>;
  private dontShowAgain = false;

  constructor(
    app: App,
    private queries: PlannedQuery[],
    private budgetEstimate: { liveCount: number; cachedCount: number; maxPerScan: number },
    private onConfirm: (approved: PlannedQuery[], dontShowAgain: boolean) => void
  ) {
    super(app);
    this.selectedQueries = new Set(queries.map((q) => q.query));
  }

  public onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Preview queries before searching' });
    contentEl.createEl('p', {
      text: 'These exact queries go to SerpApi. Note text is never sent. Only query strings are transmitted.',
      cls: 'notedrift-explanation',
    });

    const queryListContainer = contentEl.createDiv({ cls: 'notedrift-query-preview-list' });

    for (const q of this.queries) {
      new Setting(queryListContainer)
        .setName(q.query)
        .setDesc(`Engine: ${q.engine}${q.isEscalation ? ' (escalation only)' : ''}`)
        .addToggle((toggle) => {
          toggle.setValue(this.selectedQueries.has(q.query)).onChange((val) => {
            if (val) {
              this.selectedQueries.add(q.query);
            } else {
              this.selectedQueries.delete(q.query);
            }
          });
        });
    }

    // Budget summary info
    const metaBox = contentEl.createDiv({ cls: 'notedrift-meta-footer' });
    metaBox.createEl('span', {
      text: `Live searches: ${this.budgetEstimate.liveCount} (${this.budgetEstimate.cachedCount} cached)  |  Budget: ${this.budgetEstimate.maxPerScan} per scan`,
    });

    // Don't show again toggle
    new Setting(contentEl)
      .setName("Don't show this again")
      .setDesc('Skip preview on future scans and run automatically within budget')
      .addToggle((toggle) => {
        toggle.setValue(this.dontShowAgain).onChange((val) => {
          this.dontShowAgain = val;
        });
      });

    // Action buttons
    const btnContainer = contentEl.createDiv({ cls: 'notedrift-card-footer' });
    const cancelBtn = btnContainer.createEl('button', { text: 'Cancel' });
    cancelBtn.onclick = () => this.close();

    const searchBtn = btnContainer.createEl('button', {
      text: 'Search now',
      cls: 'mod-cta',
    });
    searchBtn.onclick = () => {
      const approved = this.queries.filter((q) => this.selectedQueries.has(q.query));
      this.close();
      this.onConfirm(approved, this.dontShowAgain);
    };
  }

  public onClose(): void {
    this.contentEl.empty();
  }
}
