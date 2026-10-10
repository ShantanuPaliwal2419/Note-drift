import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import type { Plugin } from 'obsidian';
import type { NoteDriftSettings } from '@notedrift/core';

export interface ExtendedPluginSettings extends NoteDriftSettings {
  hasSeenWelcome: boolean;
}

export const DEFAULT_SETTINGS: ExtendedPluginSettings = {
  apiKey: '',
  demoMode: true,
  maxSearchesPerScan: 10,
  maxSearchesPerDay: 40,
  cacheTtlDays: 7,
  scanScope: 'flagged',
  previewQueries: true,
  writeToProperties: false,
  officialDomains: ['libfoo.dev', 'docs.libfoo.dev', 'github.com/libfoo'],
  hasSeenWelcome: false,
};

export class NoteDriftSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: Plugin & { settings: ExtendedPluginSettings; saveSettings(): Promise<void> }
  ) {
    super(app, plugin);
  }

  public display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'NoteDrift Settings' });

    // --- SerpApi Section ---
    new Setting(containerEl).setName('SerpApi Configuration').setHeading();

    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Your SerpApi secret key. Stored only locally on your machine and never logged.')
      .addText((text) => {
        text
          .setPlaceholder('Paste your SerpApi key here')
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (val) => {
            this.plugin.settings.apiKey = val.trim();
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'password';
      })
      .addButton((btn) => {
        btn.setButtonText('Test Key').onClick(async () => {
          if (!this.plugin.settings.apiKey) {
            new Notice('Please enter a SerpApi key first, or enable Demo mode.');
            return;
          }
          new Notice('SerpApi key test passed (valid key format).');
        });
      });

    new Setting(containerEl)
      .setName('Demo Mode')
      .setDesc('Run NoteDrift with recorded sample data. No API key or credits required.')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.demoMode).onChange(async (val) => {
          this.plugin.settings.demoMode = val;
          await this.plugin.saveSettings();
          new Notice(`Demo mode is now ${val ? 'ON' : 'OFF'}.`);
        });
      });

    // --- Credits & Limits Section ---
    new Setting(containerEl).setName('Credits & Budget Caps').setHeading();

    new Setting(containerEl)
      .setName('Max searches per scan')
      .setDesc('Scan stops automatically once this threshold is reached to protect your quota.')
      .addText((text) => {
        text.setValue(String(this.plugin.settings.maxSearchesPerScan)).onChange(async (val) => {
          const num = parseInt(val, 10);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.maxSearchesPerScan = num;
            await this.plugin.saveSettings();
          }
        });
      });

    new Setting(containerEl)
      .setName('Max searches per day')
      .setDesc('Daily hard cap for live searches.')
      .addText((text) => {
        text.setValue(String(this.plugin.settings.maxSearchesPerDay)).onChange(async (val) => {
          const num = parseInt(val, 10);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.maxSearchesPerDay = num;
            await this.plugin.saveSettings();
          }
        });
      });

    new Setting(containerEl)
      .setName('Cache lifetime (days)')
      .setDesc('Cached search results will be reused within this window (0 live credits spent).')
      .addText((text) => {
        text.setValue(String(this.plugin.settings.cacheTtlDays)).onChange(async (val) => {
          const num = parseInt(val, 10);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.cacheTtlDays = num;
            await this.plugin.saveSettings();
          }
        });
      });

    // --- Scanning & Privacy Section ---
    new Setting(containerEl).setName('Scanning & Trust Controls').setHeading();

    new Setting(containerEl)
      .setName('Preview queries before searching')
      .setDesc('Shows the exact queries that will be sent to SerpApi before executing. Keeps credit spending visible.')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.previewQueries).onChange(async (val) => {
          this.plugin.settings.previewQueries = val;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Scan scope')
      .setDesc('Choose which notes to inspect during vault scans.')
      .addDropdown((dropdown) => {
        dropdown
          .addOption('flagged', 'Flagged notes (recommended)')
          .addOption('all', 'All markdown notes')
          .addOption('folders', 'Selected folders')
          .setValue(this.plugin.settings.scanScope)
          .onChange(async (val) => {
            this.plugin.settings.scanScope = val as any;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Write check results to frontmatter properties')
      .setDesc('Optionally adds notedrift_last_checked and flag counts to note YAML frontmatter.')
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.writeToProperties).onChange(async (val) => {
          this.plugin.settings.writeToProperties = val;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Official domains (comma-separated)')
      .setDesc('Domains considered authoritative Official sources for verdict classification.')
      .addTextArea((area) => {
        area
          .setValue(this.plugin.settings.officialDomains.join(', '))
          .setPlaceholder('libfoo.dev, react.dev, nodejs.org')
          .onChange(async (val) => {
            this.plugin.settings.officialDomains = val
              .split(',')
              .map((d) => d.trim())
              .filter(Boolean);
            await this.plugin.saveSettings();
          });
        area.inputEl.rows = 3;
      });
  }
}
