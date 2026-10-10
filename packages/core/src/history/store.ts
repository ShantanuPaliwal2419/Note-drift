import type { ClaimCheck, StorageAdapter } from '../types.js';

export interface HistoryData {
  checks: Record<string, ClaimCheck>; // claimId -> latest ClaimCheck
  ignoredClaims: Record<string, boolean>; // claimId -> boolean
  snoozedClaims: Record<string, string>; // claimId -> ISO date string
}

export class HistoryStore {
  private data: HistoryData;

  constructor(
    initialData?: Partial<HistoryData>,
    private storage?: StorageAdapter
  ) {
    this.data = {
      checks: initialData?.checks ?? {},
      ignoredClaims: initialData?.ignoredClaims ?? {},
      snoozedClaims: initialData?.snoozedClaims ?? {},
    };
  }

  public getCheck(claimId: string): ClaimCheck | undefined {
    return this.data.checks[claimId];
  }

  public saveCheck(check: ClaimCheck): void {
    this.data.checks[check.claimId] = check;
    this.persist();
  }

  public ignoreClaim(claimId: string): void {
    this.data.ignoredClaims[claimId] = true;
    this.persist();
  }

  public unignoreClaim(claimId: string): void {
    delete this.data.ignoredClaims[claimId];
    this.persist();
  }

  public isIgnored(claimId: string): boolean {
    return !!this.data.ignoredClaims[claimId];
  }

  public snoozeClaim(claimId: string, days = 30): void {
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    this.data.snoozedClaims[claimId] = until;
    this.persist();
  }

  public unsnoozeClaim(claimId: string): void {
    delete this.data.snoozedClaims[claimId];
    this.persist();
  }

  public isSnoozed(claimId: string): boolean {
    const until = this.data.snoozedClaims[claimId];
    if (!until) return false;
    return new Date(until).getTime() > Date.now();
  }

  public getAllData(): HistoryData {
    return {
      checks: { ...this.data.checks },
      ignoredClaims: { ...this.data.ignoredClaims },
      snoozedClaims: { ...this.data.snoozedClaims },
    };
  }

  private async persist(): Promise<void> {
    if (this.storage) {
      try {
        await this.storage.setItem('notedrift_history', JSON.stringify(this.data));
      } catch {
        // Storage write error ignored
      }
    }
  }
}
