# NoteDrift Software Requirements Specification (SRS)

## 1. Product Overview
NoteDrift is an Obsidian plugin and web verification platform designed for the SerpApi India Hackathon 2026.
It monitors time-sensitive claims in notes (software versions, 'latest' claims, paper citations, and external links), checks them against SerpApi Google search results, and presents evidence-backed verdicts without making silent edits.

## 2. Core Functional Requirements
- **FR-01: Claim Extraction**: Finds software names + versions, 'latest/current' phrases, and paper citations. Skips frontmatter, code blocks, and ignored text. Line numbers are 1-indexed.
- **FR-02: Query Planning**: 1-2 targeted queries per claim. Dedupes queries across the scan. Restricts to known official domains when available.
- **FR-03: Engine Routing**: Google Web Search primary; Google News escalation only when no official source is found; Google Scholar for research citations.
- **FR-04: Evidence & Verdicts**: Classifies authority (Official, Reference, Community, Unknown). Implements strict verdict decision table (Likely outdated, May be outdated, Looks current, Can't verify).
- **FR-05: Side Review Panel**: Obsidian item view with verdict badges, compact/expanded evidence cards, diffs, and action buttons.
- **FR-06: Safe Application**: Requires user preview before applying. Inserts dated callout below claim or appends to companion note. Preserves original claim byte-for-byte.
- **FR-07: History & Diff Tracking**: Saves check records locally. Highlights verdict changes, new versions, and newly discovered official sources on re-check.
- **FR-08: False-Positive & Privacy Controls**: Inline `%% notedrift:ignore %%`, frontmatter `notedrift: skip`, snooze N days, query preview modal.
- **FR-09: Credit & Budget Management**: Persistent TTL cache, in-scan query deduplication, per-scan caps, daily caps, session/daily counters.
- **FR-10: Dead-Link Rescue**: Tests note URLs for 404s/connection failures and offers candidate replacements from search results.
- **FR-11: Prioritized Vault Scan**: Scores notes by volatile-claim count, edit age, and backlinks to prioritize scanning within budget caps. Generates drift report note.
- **FR-12: Offline Demo Mode**: Runs on recorded SerpApi fixtures without an API key or credit spend. Persistent sample data banner.
- **FR-14: Settings Configuration**: Manages API key, caps, TTL, official domains, and preview preferences.

## 3. Web Application Requirements
- **W-01: Landing Page**: Feature overview, 'Try it in 2 minutes' quickstart, and terminal mockups.
- **W-02: Installation Guide**: 3 install paths (Sample Vault ZIP, BRAT, manual 3-file copy).
- **W-03: Downloads**: Direct access to `notedrift-plugin.zip` and `notedrift-sample-vault.zip`.
- **W-04: Interactive Playground**: Live testing of Markdown claims against SerpApi fixtures.
- **W-05: API Endpoints**: `POST /api/scan` and `GET /api/health`.
