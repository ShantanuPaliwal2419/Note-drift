# 🌊 NoteDrift

<p align="center">
  <strong>Never let your notes silently drift out of date.</strong><br>
  An intelligent verification engine for Obsidian that detects time-sensitive software versions, economic claims, and research citations in your notes, verifies them against live web results via <strong>SerpApi</strong>, and delivers evidence-backed verdicts without ever touching your text without permission.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Obsidian-Community%20Plugin-7C3AED?logo=obsidian&logoColor=white" alt="Obsidian Plugin" />
  <img src="https://img.shields.io/badge/SerpApi-India%20Hackathon%202026-blue?logo=google&logoColor=white" alt="SerpApi Hackathon" />
  <img src="https://img.shields.io/badge/TypeScript-Strict%20Mode-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tests-15%2F15%20Passing-success?logo=vitest&logoColor=white" alt="Tests" />
  <img src="https://img.shields.io/badge/Privacy-Zero%20Telemetry-059669?logo=shield&logoColor=white" alt="Privacy" />
  <img src="https://img.shields.io/badge/License-MIT-amber" alt="License" />
</p>

---


---

## 💡 The Problem: Why Notes "Drift"

You spend hours curating technical documentation, architectural decisions, and empirical research notes. Everything is accurate the day you write it.

**Then time happens:**
- 📦 A library releases a major breaking change (`React 17` → `React 19`, `pandas 1.4` → `pandas 2.2`).
- ⚠️ A feature you noted as *"currently supported"* gets deprecated.
- 📉 A macroeconomic policy rate or benchmark changes.
- 🔗 Crucial external links rot into `404 Not Found` pages.

**The pain points today:**
1. **Silent Stagnation:** You don't know your notes are stale until a project fails to compile, a colleague points out bad documentation, or your research is undermined.
2. **Fact-Checking Burnout:** Manually searching release notes for dozens of packages across dozens of notes is tedious and never gets done.
3. **The "AI Ghostwriter" Fear:** Many AI tools rewrite your notes behind your back, silently hallucinating dates, mangling prose, and destroying personal formatting.

---

## ✨ Enter NoteDrift

**NoteDrift acts as an automated fact-checking companion for your vault.**

It extracts time-sensitive claims, checks official web sources using **SerpApi**, shows you evidence cards with source links, and lets you attach dated update callouts with **one click** — keeping your original prose **100% byte-identical**.

```
+------------------------------------------------------+
| Claim (line 7): Core manipulation relies on pandas 1.4.2
| Verdict: [!] LIKELY OUTDATED                         |
| Why: An Official source lists a newer version (3.0.2)|
|                                                      |
| Sources                                              |
|  [Official]  pandas documentation - Installation    |
|              pandas.pydata.org/docs   date: unknown  |
|                                                      |
| Checked via: Google web search                       |
| Query: site:pandas.pydata.org pandas release notes   |
+------------------------------------------------------+
| [Apply...] [Ignore] [Snooze 30d] [Re-check] [Open]   |
+------------------------------------------------------+
```

---

## 🎯 Key Features & Guarantees

### 🛡️ 1. The Byte-Exact Safety Guarantee
NoteDrift will **never edit your notes silently**.
- Original claim text remains byte-identical.
- When you click **Apply**, NoteDrift adds a dated callout *below* the claim or logs it into a companion note (`<note>.drift.md`).
- Every single update shows a full visual diff before you confirm.

### 🧠 2. Intelligent Claim Extraction
Understands your Markdown context naturally:
- **Software Versions:** Detects library declarations like `React 18.2`, `numpy 1.22.0`, `QuantLib 1.25`, and single-number versions like `Node.js 16`.
- **Temporal Statements:** Flags claims containing *"latest version"*, *"currently supported"*, *"as of 2023"*, or *"now supports"*.
- **Academic Citations:** Detects academic literature (e.g. `[1] Fama and French, 1993` or `Markowitz (1952)`) and routes them directly to **Google Scholar**.
- **Context-Aware Pronoun Resolution:** Recognizes that *"This is the latest version..."* refers to the library on the previous line.
- **Smart Skips:** Automatically ignores frontmatter, code blocks, and lines tagged with `%% notedrift:ignore %%`.

### 🧭 3. Authoritative Verdict Engine
NoteDrift classifies source credibility to prevent rumors from being presented as fact:
- **`[!] Likely Outdated`** — An **Official** source (e.g., `react.dev`, `pandas.pydata.org`, `nodejs.org`, or project GitHub repo) confirms a newer version.
- **`[~] May Be Outdated`** — Only Reference or Community sources (blogs, StackOverflow) report a newer version.
- **`[=] Looks Current`** — An Official source confirms the note's version matches current releases.
- **`[?] Can't Verify`** — Conflicting data or no conclusive version evidence found.

### 💰 4. Strict Credit Capping & Privacy
SerpApi credits are precious. NoteDrift treats them with extreme care:
- **In-Scan Deduplication:** Multiple claims about the same entity share a single query.
- **Persistent 7-Day TTL Cache:** Scanning the same note twice makes **0 live searches**.
- **Hard Budget Caps:** Configurable limits per scan and per day stop runaway searches.
- **Query Preview Modal:** See every planned query *before* a single network call is made.
- **Zero Note Leakage:** Note bodies are **never** transmitted. Only short 2-to-4 word queries (like `site:numpy.org numpy release notes`) go to the search engine.

### 🔗 5. Dead-Link Rescue (FR-10)
Scans external links in your note. If a URL returns a 404, NoteDrift searches the web for the page title and suggests up to 3 candidate replacements. Nothing is replaced until you review and select a link.

---

## 🚀 Quick Start: 3 Ways to Install

### Option A: Try the Sample Vault in 60 Seconds (Fastest & No API Key Needed!)

The sample vault comes with pre-configured research notes and **Demo Mode** enabled (operates offline using pre-recorded fixtures):

1. Download [`notedrift-sample-vault.zip`](https://github.com/notedrift/notedrift/releases/latest/download/notedrift-sample-vault.zip) (also in `dist/` and `apps/web/public/downloads/`).
2. Unzip it to any folder on your computer.
3. Open **Obsidian** → click **Open folder as vault** → select the extracted folder.
4. Click **Trust author and enable plugins**.
5. Open `notes/libfoo-overview.md` and click the **NoteDrift icon** in the left ribbon!

---

### Option B: Install via BRAT (Beta Reviewer's Auto-update Tool)

If you already use Obsidian:
1. In Obsidian, open **Settings → Community plugins** and install **BRAT**.
2. Press `Ctrl + P` (or `Cmd + P`) and run:  
   `BRAT: Add a beta plugin for testing`
3. Enter the repository URL: `https://github.com/notedrift/notedrift`
4. Turn on **NoteDrift** in your Community plugins list.

---

### Option C: Manual Installation (3 Files)

1. Download the latest [`notedrift-plugin.zip`](https://github.com/notedrift/notedrift/releases/latest/download/notedrift-plugin.zip).
2. Extract the 3 files:
   - `main.js`
   - `manifest.json`
   - `styles.css`
3. In your Obsidian vault, navigate to `.obsidian/plugins/` (create the folder if it doesn't exist).
4. Create a folder named `notedrift` and paste the 3 files into it:  
   `<your-vault>/.obsidian/plugins/notedrift/`
5. In Obsidian, open **Settings → Community plugins**, click the reload icon, and toggle **NoteDrift** ON.

---

## ⚙️ Configuration & Live Mode

### Adding Your SerpApi Key
1. Get a free API key at [serpapi.com](https://serpapi.com/) (100 free searches/month).
2. In Obsidian, open **Settings → NoteDrift**.
3. Paste your key in the **SerpApi API Key** field and click **Test Key**.
4. Turn **Demo Mode** OFF to enable live searches.

### Key Settings
- **Max searches per scan:** Default `10` (prevents unexpected credit usage).
- **Max searches per day:** Default `40`.
- **Cache lifetime:** Default `7 days` (re-scanning cached notes is instant and free).
- **Preview queries before search:** ON by default.
- **Custom Official Domains:** Add any internal or project-specific official domains.

---

## ⌨️ Command Palette Shortcuts

| Command | Action |
| :--- | :--- |
| `NoteDrift: Scan current note` | Scans the active note for version, temporal, and paper drift |
| `NoteDrift: Check links in current note` | Scans external URLs and suggests replacements for 404 links |
| `NoteDrift: Open drift panel` | Opens the NoteDrift review sidebar |
| `NoteDrift: Scan vault (prioritized)` | Ranks and scans notes by drift volatility within your budget |
| `NoteDrift: Generate drift report` | Creates a comprehensive summary report note for your vault |
| `NoteDrift: Toggle demo mode` | Quickly switches between offline fixtures and live search |

---

## 🧑‍💻 Who Is NoteDrift For?

### 💻 Software Developers & Technical Writers
- Track dependencies, runtime versions, and CLI tools mentioned across architecture docs.
- Ensure onboarding guides don't reference retired framework versions.

### 📊 Financial Analysts & Quantitative Researchers
- Keep econometric models, Python data science libraries (`pandas`, `numpy`, `QuantLib`, `PyTorch`), and monetary policy references up to date.

### 🔬 Academics, Students & Researchers
- Verify that seminal paper citations remain properly linked via Google Scholar.
- Avoid citing retracted papers or outdated software packages.

---

## 🔒 Privacy & Network Transparency

We believe your notes are personal and sacred. NoteDrift was engineered from day one with a strict privacy boundary:

- 🚫 **No Note Uploads:** NoteDrift **never** uploads your note contents, notes lists, or vault metadata.
- 🔍 **Minimal Queries:** The only text sent to SerpApi is a brief 2-4 word query (e.g. `site:react.dev React release notes`).
- 🛑 **No Analytics or Telemetry:** No tracking pixels, analytics beacons, or remote telemetry scripts.
- 💾 **Vault-Local Storage:** All check histories, diff logs, and cache data are saved strictly inside your vault's `data.json`.

---

## 📁 Monorepo Folder Structure Explained

NoteDrift is organized as an **npm workspaces monorepo** with clean separation between shared business logic, the Obsidian desktop plugin, and the companion web app:

```text
notedrift/
├── demo.mp4.mp4                   # 🎥 Full live walkthrough video demonstration
├── packages/
│   └── core/                      # 🧠 Shared pure TypeScript core library (platform-agnostic)
│       ├── src/
│       │   ├── types.ts           # Central TypeScript interfaces (Claim, Verdict, Evidence, Settings)
│       │   ├── extract/           # Markdown parsing & claim detection
│       │   │   ├── claims.ts      # Finds version, temporal, and academic paper claims
│       │   │   ├── versions.ts    # Semver & integer version normalization and comparison
│       │   │   └── rules.ts       # Extraction pattern and rule-pack loader
│       │   ├── plan/              # Search query generation
│       │   │   ├── queries.ts     # Generates & dedupes site-restricted search queries
│       │   │   └── router.ts      # Routes queries (Google Search vs. News vs. Scholar)
│       │   ├── analyze/           # Evidence evaluation & verdicts
│       │   │   ├── authority.ts   # Classifies source trust (Official, Reference, Community)
│       │   │   └── verdict.ts     # 4-state verdict decision table implementation
│       │   ├── serpapi/           # SerpApi communication layer
│       │   │   ├── client.ts      # HTTP-injected SerpApi client (requestUrl / fetch)
│       │   │   ├── cache.ts       # 7-day persistent TTL cache & in-scan deduplication
│       │   │   ├── budget.ts      # Per-scan and daily credit caps and usage counters
│       │   │   ├── parse.ts       # Untrusted snippet sanitizer and version extractor
│       │   │   └── replay.ts      # Offline fixture replay engine for zero-credit testing
│       │   └── history/           # History, snoozing & diff detection
│       │       ├── store.ts       # Local storage for past checks, snoozes, and ignores
│       │       └── diff.ts        # Computes what changed since previous verification
│       ├── rules/                 # Configurable JSON rule packs
│       │   ├── default-rules.json # Regex extraction patterns and ignore markers
│       │   └── official-domains.json # Known authoritative domains (PyData, GitHub, etc.)
│       ├── fixtures/serpapi/      # Pre-recorded offline SerpApi search responses
│       └── tests/                 # 15 Vitest unit tests covering budget, cache, and verdicts
│
├── apps/
│   ├── plugin/                    # 🔌 The Obsidian Community Plugin (The Main Product)
│   │   ├── manifest.json          # Obsidian plugin metadata (id: notedrift)
│   │   ├── versions.json          # Obsidian version compatibility mapping
│   │   ├── esbuild.config.mjs     # Production bundler compiling TypeScript into main.js
│   │   ├── styles.css             # Theme-aware CSS using Obsidian design tokens
│   │   └── src/
│   │       ├── main.ts            # Plugin entrypoint: commands, ribbon icons, and scan lifecycle
│   │       ├── settings.ts        # NoteDrift settings tab UI (API key, caps, demo toggle)
│   │       ├── adapter.ts         # Obsidian requestUrl wrapper injected into core
│   │       ├── storage.ts         # Persistent data.json and cache file storage
│   │       ├── view/              # Sidebar user interface
│   │       │   ├── DriftView.ts   # Interactive side panel displaying badges and claims
│   │       │   └── EvidenceCard.ts# Expandable evidence card with sources and action buttons
│   │       ├── modals/            # User interaction modals
│   │       │   ├── QueryPreviewModal.ts # Shows queries before spending SerpApi credits
│   │       │   ├── ApplyPreviewModal.ts # Byte-exact visual diff modal for callout insertion
│   │       │   ├── DeadLinksModal.ts    # 404 external link replacement picker
│   │       │   └── WelcomeModal.ts      # First-run onboarding wizard
│   │       └── services/          # Plugin background services
│   │           ├── applier.ts     # Safe, dynamic-line callout and companion note writer
│   │           ├── links.ts       # Dead external link health checker (FR-10)
│   │           ├── scanner.ts     # Prioritized multi-note vault scanner & report builder
│   │           └── demo.ts        # Offline demo mode banner and warning indicator
│   │
│   └── web/                       # 🌐 Next.js Companion Web Application
│       ├── src/app/
│       │   ├── page.tsx           # Product landing page and feature highlights
│       │   ├── install/page.tsx   # Visual 3-step installation walkthrough
│       │   ├── download/page.tsx  # Direct release download links
│       │   ├── try/page.tsx       # Live interactive browser playground (/try)
│       │   └── api/
│       │       ├── scan/route.ts  # Server-side scan API executing @notedrift/core
│       │       └── health/route.ts# API health-check endpoint
│       └── public/downloads/      # Pre-packaged plugin and sample-vault ZIP archives
│
├── sample-vault/                  # 📚 Turnkey Obsidian Sample Vault
│   ├── .obsidian/plugins/         # Pre-installed and pre-enabled NoteDrift plugin
│   └── notes/                     # Rich demo notes (finance, macro research, libfoo)
│
├── dist/                          # 📦 Packaged build artifacts (ZIPs and release bundles)
│   ├── notedrift/                 # Ready-to-copy main.js, manifest.json, styles.css
│   ├── notedrift-plugin.zip       # Standalone plugin installation ZIP
│   └── notedrift-sample-vault.zip # Complete demo vault ready for immediate exploration
│
└── scripts/                       # ⚙️ Automation Scripts
    ├── package-plugin.ts          # Bundles, validates, and packages ZIP release archives
    ├── check-secrets.ts           # Security scanner ensuring zero API keys leak into git
    └── record-fixtures.ts         # Records live SerpApi search queries into test fixtures
```

### Architectural Design Highlights
- **Platform-Agnostic Core:** `@notedrift/core` contains zero Obsidian or DOM dependencies. It runs identically in Node.js, in browser environments, and inside Obsidian's Electron sandbox.
- **Dependency Injected Networking:** The core engine takes an HTTP fetcher function as an argument. The Obsidian plugin passes `requestUrl` (bypassing browser CORS restrictions), while the Next.js web application passes native server-side `fetch`.
- **Zero-Credit Offline Testing:** Vitest tests inject an offline replay function reading from `packages/core/fixtures/serpapi/`, ensuring full test coverage without spending a single SerpApi credit.

---

## 🧪 Developer Commands

```bash
# Run unit and fixture replay tests
npm run test

# Run strict TypeScript typecheck
npm run typecheck

# Run linter
npm run lint

# Build the Obsidian plugin bundle
npm run build:plugin

# Run security secret scanner (ensures 0 leaked keys)
npm run check:secrets

# Package release ZIPs into dist/ and web public downloads
npm run package

# Launch Next.js web application
npm run dev:web
```

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ for the <strong>SerpApi India Hackathon 2026</strong>.
</p>
