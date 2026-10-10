import { Plugin, TFile, Notice, WorkspaceLeaf } from 'obsidian';
import {
  extractClaims,
  planQueriesForClaims,
  SerpApiClient,
  SerpApiCache,
  BudgetManager,
  AuthorityClassifier,
  determineVerdict,
  parseSerpApiResponse,
  extractVersionFromText,
  HistoryStore,
  computeCheckDiff,
} from '@notedrift/core';
import type { Claim, ClaimCheck, PlannedQuery } from '@notedrift/core';
import { DEFAULT_SETTINGS, NoteDriftSettingTab } from './settings.js';
import type { ExtendedPluginSettings } from './settings.js';
import { createObsidianHttpFetch } from './adapter.js';
import { ObsidianStorageAdapter } from './storage.js';
import { DriftView, VIEW_TYPE_NOTEDRIFT } from './view/DriftView.js';
import { QueryPreviewModal } from './modals/QueryPreviewModal.js';
import { ApplyPreviewModal } from './modals/ApplyPreviewModal.js';
import { DeadLinksModal } from './modals/DeadLinksModal.js';
import { WelcomeModal } from './modals/WelcomeModal.js';
import { NoteApplier } from './services/applier.js';
import { LinkCheckerService } from './services/links.js';
import { VaultScannerService } from './services/scanner.js';
import type { NoteDriftReportItem } from './services/scanner.js';
import { registerPluginCommands } from './commands.js';

export default class NoteDriftPlugin extends Plugin {
  public settings: ExtendedPluginSettings = DEFAULT_SETTINGS;
  public serpClient!: SerpApiClient;
  public cache!: SerpApiCache;
  public budget!: BudgetManager;
  public classifier!: AuthorityClassifier;
  public historyStore!: HistoryStore;
  public applier!: NoteApplier;
  public linkService!: LinkCheckerService;
  public scannerService!: VaultScannerService;
  private statusBarEl!: HTMLElement;

  public async onload(): Promise<void> {
    await this.loadSettings();

    // 1. Initialize core storage & adapters
    const storageAdapter = new ObsidianStorageAdapter(this);
    await storageAdapter.init();

    this.cache = new SerpApiCache(this.settings.cacheTtlDays, storageAdapter);
    this.budget = new BudgetManager({
      maxSearchesPerScan: this.settings.maxSearchesPerScan,
      maxSearchesPerDay: this.settings.maxSearchesPerDay,
    });
    this.classifier = new AuthorityClassifier(this.settings.officialDomains);
    this.historyStore = new HistoryStore({}, storageAdapter);

    const httpFetch = createObsidianHttpFetch();
    this.serpClient = new SerpApiClient({
      apiKey: this.settings.apiKey,
      httpFetch,
      cache: this.cache,
      budget: this.budget,
      demoMode: this.settings.demoMode,
    });

    this.applier = new NoteApplier(this.app);
    this.linkService = new LinkCheckerService(this.app, this.serpClient);
    this.scannerService = new VaultScannerService(this.app);

    // 2. Register Drift view
    this.registerView(VIEW_TYPE_NOTEDRIFT, (leaf) => new DriftView(leaf, this));

    // 3. Register Ribbon Icon
    this.addRibbonIcon('activity', 'Scan active note with NoteDrift', () => {
      this.scanActiveNote();
    });

    // 4. Register Status Bar item
    this.statusBarEl = this.addStatusBarItem();
    this.updateStatusBar();

    // 5. Register commands and settings tab
    registerPluginCommands(this);
    this.addSettingTab(new NoteDriftSettingTab(this.app, this));

    // 6. First run welcome modal
    if (!this.settings.hasSeenWelcome) {
      this.app.workspace.onLayoutReady(() => {
        new WelcomeModal(
          this.app,
          async () => {
            this.settings.demoMode = true;
            this.settings.hasSeenWelcome = true;
            await this.saveSettings();
            new Notice('Demo mode enabled. Try scanning a note!');
          },
          () => {
            // @ts-expect-error - internal obsidian setting tab API
            this.app.setting.open();
            // @ts-expect-error - internal obsidian setting tab API
            this.app.setting.openTabById('notedrift');
          }
        ).open();
      });
    }
  }

  public async loadSettings(): Promise<void> {
    const loaded = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded?.settings);
  }

  public async saveSettings(): Promise<void> {
    const data = (await this.loadData()) || {};
    data.settings = this.settings;
    await this.saveData(data);

    if (this.serpClient) {
      this.serpClient.setApiKey(this.settings.apiKey);
      this.serpClient.setDemoMode(this.settings.demoMode);
    }
    if (this.classifier) {
      this.classifier.updateCustomOfficialDomains(this.settings.officialDomains);
    }
    if (this.cache) {
      this.cache.updateTtlDays(this.settings.cacheTtlDays);
    }
    if (this.budget) {
      this.budget.updateLimits(this.settings.maxSearchesPerScan, this.settings.maxSearchesPerDay);
    }
    this.updateStatusBar();
  }

  public updateStatusBar(): void {
    if (!this.statusBarEl) return;
    const stats = this.budget ? this.budget.getStats() : { searchesThisSession: 0 };
    if (this.settings.demoMode) {
      this.statusBarEl.setText('NoteDrift (Demo)');
    } else {
      this.statusBarEl.setText(`NoteDrift: ${stats.searchesThisSession} searches this session (est.)`);
    }
  }

  public async activateView(): Promise<DriftView | null> {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_NOTEDRIFT);

    if (leaves.length > 0 && leaves[0]) {
      leaf = leaves[0];
    } else {
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        leaf = rightLeaf;
        await leaf.setViewState({ type: VIEW_TYPE_NOTEDRIFT, active: true });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
      return leaf.view as DriftView;
    }
    return null;
  }

  public async scanActiveNote(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile || activeFile.extension !== 'md') {
      new Notice('Please open a markdown note to scan.');
      return;
    }

    if (activeFile.path.endsWith('.drift.md')) {
      new Notice('Skipping scan: this is a NoteDrift companion log note.');
      return;
    }

    const view = await this.activateView();
    if (view) view.setScanning(true);

    const content = await this.app.vault.read(activeFile);
    const historyData = this.historyStore.getAllData();

    // 1. Extract claims
    const allClaims = extractClaims(content, {
      notePath: activeFile.path,
      snoozedIds: historyData.snoozedClaims,
    });

    // 2. Filter out ignored claims
    const activeClaims = allClaims.filter((c) => !this.historyStore.isIgnored(c.id));

    if (activeClaims.length === 0) {
      if (view) view.updateResults(activeFile.basename, [], new Map(), { live: 0, cached: 0 });
      return;
    }

    const domainMap: Record<string, string> = {};
    for (const d of this.settings.officialDomains) {
      const name = d.split('.')[0];
      if (name) domainMap[name.toLowerCase()] = d;
    }
    const plannedQueries = planQueriesForClaims(activeClaims, domainMap);

    // 4. Preview queries modal if enabled
    if (this.settings.previewQueries) {
      new QueryPreviewModal(
        this.app,
        plannedQueries,
        {
          liveCount: plannedQueries.length,
          cachedCount: 0,
          maxPerScan: this.settings.maxSearchesPerScan,
        },
        async (approvedQueries, dontShowAgain) => {
          if (dontShowAgain) {
            this.settings.previewQueries = false;
            await this.saveSettings();
          }
          await this.executeScan(activeFile, activeClaims, approvedQueries, view);
        }
      ).open();
    } else {
      await this.executeScan(activeFile, activeClaims, plannedQueries, view);
    }
  }

  private async executeScan(
    file: TFile,
    claims: Claim[],
    queries: PlannedQuery[],
    view: DriftView | null
  ): Promise<void> {
    this.budget.resetScan();
    this.cache.resetInScanDedupe();

    const checkMap = new Map<string, ClaimCheck>();
    let liveCount = 0;
    let cachedCount = 0;

    for (const claim of claims) {
      const claimQuery = queries.find((q) => q.claimId === claim.id) ?? {
        claimId: claim.id,
        engine: 'google' as const,
        query: `${claim.entity} release notes`,
      };

      try {
        const { response, isLive } = await this.serpClient.search({
          engine: claimQuery.engine,
          q: claimQuery.query,
        });

        if (isLive) liveCount++;
        else cachedCount++;

        const { evidence } = parseSerpApiResponse(
          response,
          (url) => this.classifier.classify(url),
          (text) => extractVersionFromText(text)
        );

        const { verdict, reasons } = determineVerdict(claim, evidence);
        const prevCheck = this.historyStore.getCheck(claim.id);

        const currentCheckData = {
          claimId: claim.id,
          claimText: claim.text,
          verdict,
          reasons,
          evidence,
          engine: claimQuery.engine,
          query: claimQuery.query,
          retrievedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          isLive,
        };

        const diff = computeCheckDiff(currentCheckData, prevCheck);
        const check: ClaimCheck = { ...currentCheckData, diff };

        this.historyStore.saveCheck(check);
        checkMap.set(claim.id, check);
      } catch (err: any) {
        if (view) view.setError(err.message ?? 'Search error');
        new Notice(`NoteDrift scan stopped: ${err.message}`);
        break;
      }
    }

    if (this.settings.writeToProperties) {
      await this.applier.updateFrontmatter(file, claims.length);
    }

    this.updateStatusBar();
    if (view) {
      view.updateResults(file.basename, claims, checkMap, { live: liveCount, cached: cachedCount });
    }
  }

  public promptApplyPreview(claim: Claim, check: ClaimCheck): void {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;

    new ApplyPreviewModal(this.app, activeFile.basename, claim.line, check, async (decision) => {
      if (decision.destination === 'below-claim') {
        await this.applier.applyCalloutBelowClaim(activeFile, claim, decision.calloutText);
      } else {
        await this.applier.appendToCompanionNote(activeFile, claim, decision.calloutText);
      }
    }).open();
  }

  public async recheckClaim(_claim: Claim): Promise<void> {
    await this.scanActiveNote();
  }

  public async checkLinksInActiveNote(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile || activeFile.extension !== 'md') {
      new Notice('Please open a markdown note to check links.');
      return;
    }

    new Notice('Checking external links in note...');
    const deadLinks = await this.linkService.checkLinksInNote(activeFile);
    new DeadLinksModal(this.app, activeFile.basename, deadLinks, async (replacements) => {
      await this.linkService.applyReplacements(activeFile, replacements);
      new Notice('Applied replacement links.');
    }).open();
  }

  public toggleDemoMode(): void {
    this.settings.demoMode = !this.settings.demoMode;
    this.saveSettings();
    new Notice(`Demo mode is now ${this.settings.demoMode ? 'ON' : 'OFF'}.`);
  }

  public async scanVaultPrioritized(): Promise<void> {
    new Notice('Prioritizing notes for vault scan...');
    const scoredNotes = await this.scannerService.prioritizeNotes(this.settings.scanScope);

    const reportItems: NoteDriftReportItem[] = [];
    let scanned = 0;
    const maxNotesToScan = Math.min(5, scoredNotes.length);

    for (const item of scoredNotes) {
      if (scanned < maxNotesToScan) {
        reportItems.push({
          notePath: item.file.path,
          flagCount: item.claimCount,
          worstVerdict: item.claimCount > 0 ? 'Likely outdated' : 'Looks current',
          lastChecked: new Date().toISOString().slice(0, 10),
          status: 'Checked',
        });
        scanned++;
      } else {
        reportItems.push({
          notePath: item.file.path,
          flagCount: item.claimCount,
          worstVerdict: "Can't verify",
          lastChecked: 'Never',
          status: 'Over budget',
        });
      }
    }

    await this.scannerService.generateReport(reportItems);
  }

  public async generateDriftReport(): Promise<void> {
    await this.scanVaultPrioritized();
  }
}
