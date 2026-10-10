export class DemoModeService {
  public static renderDemoBanner(
    parentEl: HTMLElement,
    onDisable: () => void
  ): HTMLElement {
    const banner = parentEl.createDiv({ cls: 'notedrift-banner-demo' });

    banner.createEl('span', {
      text: 'SAMPLE DATA: Demo mode: recorded results, not live.',
    });

    const offBtn = banner.createEl('button', {
      text: 'Turn off',
      cls: 'mod-warning',
    });
    offBtn.onclick = () => onDisable();

    return banner;
  }
}
