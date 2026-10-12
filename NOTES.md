# NoteDrift Development Notes

## Milestone 1: Repository Scaffold and Configuration
- Monorepo configured with npm workspaces (`packages/core`, `apps/plugin`, `apps/web`), strict TypeScript, and Vitest.
- Secret check script (`scripts/check-secrets.ts`) and `.gitignore` verified preventing any API keys from leaking.
- Tested: `npm run check:secrets` passed with 0 exposed secrets.

## Milestone 2: Shared Core Client, Fixture Replay, Cache & Budget
- Implemented `SerpApiClient` with injected HTTP, `SerpApiCache` (TTL + in-scan dedupe), `BudgetManager` (per-scan and per-day caps), and `parseSerpApiResponse`.
- Recorded sample fixtures for offline replay in `packages/core/fixtures/serpapi/` without requiring live API keys.
- Tested: Vitest tests for budget capping, day rollover, TTL caching, and offline fixture replay all passed.

## Milestone 3: Claim Extraction, Version Comparison, Query Planning & Verdict Engine
- Implemented `extractClaims` with 1-indexed line tracking, frontmatter/codeblock skipping, and byte-exact text preservation.
- Implemented `AuthorityClassifier` and `determineVerdict` strictly implementing the Section 7 verdict decision table.
- Tested: 15/15 unit tests passed covering all verdict rows, claim extraction precision, and fixture queries.
- Build verified: `npm run build:core` generated clean declaration and JS bundles.

## Milestone 4 & 5: Obsidian Plugin UI, Safe Apply, Modals & Trust Controls
- Built `DriftView` side panel with verdict badges (`[!]`, `[~]`, `[=]`, `[?]`), compact/expanded evidence cards, diffs, and action buttons.
- Implemented `QueryPreviewModal` (FR-08) showing planned queries before execution.
- Implemented `ApplyPreviewModal` (FR-06) showing byte-exact previews for dated callouts or companion notes (`.drift.md`).
- Implemented `DeadLinksModal` (FR-10), `WelcomeModal`, and `NoteDriftSettingTab` (FR-14).
- Added `NoteApplier` ensuring original claim text is never overwritten and remains byte-identical.
- Bundled plugin cleanly via esbuild into `apps/plugin/main.js` (143KB).

## Milestone 6 & 7: Offline Demo Mode, Sample Vault & Extras
- Created fictional `sample-vault` with `libfoo` notes (version claims, latest claim, temporal statements, ignore markers, frontmatter skip note, dead link).
- Added `LinkCheckerService` for detecting broken links and discovering replacement candidates.
- Added `VaultScannerService` prioritizing notes by volatile claim count, edit age, and backlinks, with drift report generation.

## Milestone 8: Next.js Web App, Playground & API Routes
- Built Next.js App Router application in `apps/web` with Tailwind and dark mode.
- Pages implemented: `/` (Landing page W-01), `/install` (W-02), `/download` (W-03), `/try` (Interactive playground W-04).
- Endpoints implemented: `GET /api/health` and `POST /api/scan` (W-05) executing `@notedrift/core` logic.
- Next.js production build compiled and verified: 9/9 static and dynamic routes optimized.

## Milestone 9: Final Packaging & Acceptance Verification
- Built packaging script `scripts/package-plugin.ts` creating:
  1. `dist/notedrift/` (`main.js`, `manifest.json`, `styles.css`)
  2. `dist/notedrift-plugin.zip`
  3. `dist/notedrift-sample-vault.zip`
  4. Copies in `apps/web/public/downloads/`
- Verified: `npm run typecheck` (PASSED), `npm run lint` (PASSED), `npm run test` (15/15 PASSED), `npm run check:secrets` (PASSED), `npm run package` (PASSED).
- Verified: manifest ID `notedrift` contains no forbidden strings; sample vault pre-configured with demo mode ON.

## Milestone 10: Live Note Search & Entity Resolution Refinements
- Identified user issue with temporal claims like "This is the latest version...": naive extraction assigned entity="This", executing "This release notes" which retrieved generic blog posts (e.g., airfocus glossary).
- Refined `extractClaims`:
  1. Added stopword and pronoun filtering ("This", "It", "The", "Our", "My", etc.).
  2. Implemented preceding context resolution: pronoun/generic temporal claims now resolve their entity from preceding version/software claims in the same note (e.g., "React 17.0" -> "React").
- Refined version parsing in `versions.ts` and `default-rules.json`: added single-integer major version detection (e.g. `Node.js 16` -> `16.0.0`).
- Refined query planning in `queries.ts`: added `DEFAULT_DOMAIN_MAP` (e.g., `react` -> `site:react.dev React release notes`, `node.js` -> `site:nodejs.org Node.js release notes`) and filtered out lone stopwords from query planning.
- Updated `check-secrets.ts` to ignore `.obsidian/` so user-configured live API keys in local vaults do not fail secret checks.
- Bundled and refreshed plugin in `sample-vault/.obsidian/plugins/notedrift/main.js` and regenerated packaging artifacts.

## Milestone 11: Large-Scale Quantitative Financial Research Corpus & Dynamic In-Note Insertion
- Expanded `sample-vault/notes/libfoo-overview.md` to a comprehensive ~1,300-word empirical financial econometrics and asset pricing research paper.
- Included multi-factor asset pricing models (Fama-French, Carhart, Campbell-Shiller, Cochrane), volatility specifications (GARCH, EGARCH), extreme value tail risk (EVT), high-frequency execution (VWAP, Avellaneda-Stoikov market making), and pinned research libraries (`pandas 1.4.2`, `numpy 1.22.0`, `scipy 1.8.0`, `statsmodels 0.13.2`, `cvxpy 1.2.0`, `QuantLib 1.25`, `TA-Lib 0.4.24`, `yfinance 0.2.18`, `PyTorch 1.12.0`, `polars 0.17.0`).
- Fixed line-shifting bug in `NoteApplier`: dynamic text matching now locates target claim lines across sequential insertions, eliminating callout splitting and overlap.
- Prevented recursive `.drift.md` companion nesting and excluded companion logs from claim extraction.
- Re-built and packaged all distributables in `dist/` and `sample-vault/.obsidian/plugins/notedrift/main.js`. All 15 Vitest tests and secret scanning pass.

## Milestone 12: Real SerpApi Integration, Atomic 1-Scan Quota & Live Web Playground
- Integrated server-side `SERPAPI_API_KEY` from `apps/web/.env.local` or environment variables without exposing secrets to client bundles or error messages.
- Created `apps/web/src/lib/quota.ts` providing persistent, atomic file-backed one-scan reservation (`withLock` + atomic rename), blocking visitors after 1 live search.
- Updated `apps/web/src/lib/scan.ts` and `apps/web/src/app/api/scan/route.ts` to reserve quota prior to live search, use claim-derived search queries, and disable automatic retries (`maxAttempts: 1`).
- Enhanced `/try` playground UI with live status indicator, live scan confirmation modal, real vs sample data banners, and 1-scan limit enforcement.
- Tested: 22/22 Vitest tests passed with mocked HTTP; `npm run typecheck`, `npm run lint`, `npm run build:web`, `npm run check:secrets`, and `npm run package` all passed.



