import type NoteDriftPlugin from './main.js';

export function registerPluginCommands(plugin: NoteDriftPlugin): void {
  plugin.addCommand({
    id: 'scan-current-note',
    name: 'Scan current note',
    callback: () => plugin.scanActiveNote(),
  });

  plugin.addCommand({
    id: 'scan-vault-prioritized',
    name: 'Scan vault (prioritized)',
    callback: () => plugin.scanVaultPrioritized(),
  });

  plugin.addCommand({
    id: 'check-links-current-note',
    name: 'Check links in current note',
    callback: () => plugin.checkLinksInActiveNote(),
  });

  plugin.addCommand({
    id: 'open-drift-panel',
    name: 'Open drift panel',
    callback: () => plugin.activateView(),
  });

  plugin.addCommand({
    id: 'toggle-demo-mode',
    name: 'Toggle demo mode',
    callback: () => plugin.toggleDemoMode(),
  });

  plugin.addCommand({
    id: 'generate-drift-report',
    name: 'Generate drift report',
    callback: () => plugin.generateDriftReport(),
  });
}
