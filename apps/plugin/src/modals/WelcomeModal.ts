import { App, Modal } from 'obsidian';

export class WelcomeModal extends Modal {
  constructor(
    app: App,
    private onTryDemo: () => void,
    private onOpenSettings: () => void
  ) {
    super(app);
  }

  public onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'Welcome to NoteDrift!' });
    contentEl.createEl('p', {
      text: 'Find time-sensitive drift and outdated software versions in your notes using SerpApi, without silent edits.',
      cls: 'notedrift-explanation',
    });

    const steps = contentEl.createEl('ol');
    steps.createEl('li', { text: 'Get a free SerpApi key at serpapi.com.' });
    steps.createEl('li', { text: 'Paste your key in NoteDrift settings.' });
    steps.createEl('li', { text: 'Open any note and run "Scan current note".' });

    contentEl.createEl('p', {
      text: 'Privacy notice: NoteDrift sends only short, claim-derived search queries to SerpApi. Note contents are never uploaded.',
      cls: 'notedrift-explanation',
    });

    const btnContainer = contentEl.createDiv({ cls: 'notedrift-card-footer' });

    const demoBtn = btnContainer.createEl('button', {
      text: 'Try demo mode (Offline)',
      cls: 'mod-cta',
    });
    demoBtn.onclick = () => {
      this.close();
      this.onTryDemo();
    };

    const settingsBtn = btnContainer.createEl('button', { text: 'Open Settings' });
    settingsBtn.onclick = () => {
      this.close();
      this.onOpenSettings();
    };

    const closeBtn = btnContainer.createEl('button', { text: 'Get started' });
    closeBtn.onclick = () => this.close();
  }

  public onClose(): void {
    this.contentEl.empty();
  }
}
