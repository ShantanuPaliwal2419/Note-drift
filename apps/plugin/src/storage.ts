import type { Plugin } from 'obsidian';
import type { StorageAdapter } from '@notedrift/core';

export class ObsidianStorageAdapter implements StorageAdapter {
  private inMemoryStore: Record<string, string> = {};

  constructor(private plugin: Plugin) {}

  public async init(): Promise<void> {
    const data = await this.plugin.loadData();
    if (data && typeof data === 'object') {
      if (data.storage && typeof data.storage === 'object') {
        this.inMemoryStore = { ...data.storage };
      }
    }
  }

  public getItem(key: string): string | null {
    return this.inMemoryStore[key] ?? null;
  }

  public async setItem(key: string, value: string): Promise<void> {
    this.inMemoryStore[key] = value;
    await this.persist();
  }

  public async removeItem(key: string): Promise<void> {
    delete this.inMemoryStore[key];
    await this.persist();
  }

  private async persist(): Promise<void> {
    const data = (await this.plugin.loadData()) || {};
    data.storage = this.inMemoryStore;
    await this.plugin.saveData(data);
  }
}
