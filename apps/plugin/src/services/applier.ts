import { App, TFile, Notice } from 'obsidian';
import type { Claim } from '@notedrift/core';

export class NoteApplier {
  constructor(private app: App) {}

  public async applyCalloutBelowClaim(
    file: TFile,
    claim: Claim,
    calloutText: string
  ): Promise<void> {
    const content = await this.app.vault.read(file);
    const lines = content.split(/\r?\n/);

    // Find the claim line by matching exact claim text (handles shifted line numbers after prior inserts)
    let targetLineIdx = -1;
    let minDistance = Infinity;
    const targetText = claim.text.trim();

    for (let i = 0; i < lines.length; i++) {
      if (lines[i]?.trim() === targetText) {
        const dist = Math.abs(i - (claim.line - 1));
        if (dist < minDistance) {
          minDistance = dist;
          targetLineIdx = i;
        }
      }
    }

    if (targetLineIdx === -1) {
      // Fallback: search for entity in line
      for (let i = 0; i < lines.length; i++) {
        if (lines[i]?.includes(claim.entity) && (claim.version ? lines[i]?.includes(claim.version) : true)) {
          const dist = Math.abs(i - (claim.line - 1));
          if (dist < minDistance) {
            minDistance = dist;
            targetLineIdx = i;
          }
        }
      }
    }

    if (targetLineIdx === -1) {
      targetLineIdx = Math.min(Math.max(claim.line - 1, 0), lines.length - 1);
    }

    // Check if callout is already present below line (idempotency check)
    let calloutAlreadyExists = false;
    for (let j = targetLineIdx + 1; j < Math.min(targetLineIdx + 6, lines.length); j++) {
      if (lines[j]?.includes('NoteDrift check')) {
        calloutAlreadyExists = true;
        break;
      }
    }

    if (calloutAlreadyExists) {
      new Notice('Verification callout already present below this claim.');
      return;
    }

    // Insert callout directly below claim line, preserving original claim byte-for-byte
    const calloutLines = calloutText.split(/\r?\n/);
    lines.splice(targetLineIdx + 1, 0, '', ...calloutLines);
    const newContent = lines.join('\n');

    await this.app.vault.modify(file, newContent);
    new Notice('Verification callout safely applied below claim.');
  }

  public async appendToCompanionNote(
    file: TFile,
    claim: Claim,
    calloutText: string
  ): Promise<void> {
    const basePath = file.path.replace(/(\.drift)*\.md$/, '');
    const companionPath = `${basePath}.drift.md`;
    const companionFile = this.app.vault.getAbstractFileByPath(companionPath);

    const header = `### Check for line ${claim.line}: "${claim.text}"\n\n${calloutText}\n\n`;

    if (companionFile instanceof TFile) {
      const existing = await this.app.vault.read(companionFile);
      if (existing.includes(`Check for line ${claim.line}`)) {
        new Notice('Verification already recorded in companion note.');
        return;
      }
      await this.app.vault.modify(companionFile, existing + '\n\n' + header);
    } else {
      await this.app.vault.create(companionPath, `# Drift Verification Log: ${file.basename}\n\n${header}`);
    }

    new Notice(`Verification recorded in companion note: ${companionPath}`);
  }

  public async updateFrontmatter(file: TFile, flagsCount: number): Promise<void> {
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      fm['notedrift_last_checked'] = new Date().toISOString().slice(0, 10);
      fm['notedrift_flagged'] = flagsCount;
    });
  }
}
