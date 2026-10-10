export interface BudgetStats {
  searchesThisScan: number;
  searchesThisSession: number;
  searchesToday: number;
  maxSearchesPerScan: number;
  maxSearchesPerDay: number;
  lastResetDate: string; // YYYY-MM-DD
}

export class BudgetManager {
  private stats: BudgetStats;

  constructor(
    initialStats?: Partial<BudgetStats>,
    private onSave?: (stats: BudgetStats) => void
  ) {
    const today = new Date().toISOString().slice(0, 10);
    this.stats = {
      searchesThisScan: 0,
      searchesThisSession: 0,
      searchesToday: initialStats?.lastResetDate === today ? (initialStats.searchesToday ?? 0) : 0,
      maxSearchesPerScan: initialStats?.maxSearchesPerScan ?? 10,
      maxSearchesPerDay: initialStats?.maxSearchesPerDay ?? 40,
      lastResetDate: today,
    };
  }

  public resetScan(): void {
    this.stats.searchesThisScan = 0;
  }

  public canExecuteSearch(): { allowed: boolean; reason?: string } {
    this.checkDayRollover();

    if (this.stats.searchesThisScan >= this.stats.maxSearchesPerScan) {
      return {
        allowed: false,
        reason: `Scan limit reached (${this.stats.maxSearchesPerScan} searches/scan). Remaining claims not checked.`,
      };
    }

    if (this.stats.searchesToday >= this.stats.maxSearchesPerDay) {
      return {
        allowed: false,
        reason: `Daily credit limit reached (${this.stats.maxSearchesPerDay} searches/day). Scan stopped.`,
      };
    }

    return { allowed: true };
  }

  public recordSearch(count = 1): void {
    this.checkDayRollover();
    this.stats.searchesThisScan += count;
    this.stats.searchesThisSession += count;
    this.stats.searchesToday += count;
    this.onSave?.(this.getStats());
  }

  public getStats(): BudgetStats {
    this.checkDayRollover();
    return { ...this.stats };
  }

  public updateLimits(maxPerScan: number, maxPerDay: number): void {
    this.stats.maxSearchesPerScan = maxPerScan;
    this.stats.maxSearchesPerDay = maxPerDay;
    this.onSave?.(this.getStats());
  }

  private checkDayRollover(): void {
    const today = new Date().toISOString().slice(0, 10);
    if (this.stats.lastResetDate !== today) {
      this.stats.searchesToday = 0;
      this.stats.lastResetDate = today;
      this.onSave?.(this.getStats());
    }
  }
}
