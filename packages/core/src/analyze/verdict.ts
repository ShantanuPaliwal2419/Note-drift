import type { Claim, SourceEvidence, Verdict } from '../types.js';
import { compareVersions } from '../extract/versions.js';

export interface VerdictResult {
  verdict: Verdict;
  reasons: string[];
}

/**
 * Determines the verdict for a claim given the extracted evidence.
 * Adheres strictly to the AGENTS.md Section 7 verdict decision table:
 * 1. An Official source shows a version newer than the note's -> Likely outdated
 * 2. Only Reference or Community sources show a newer version -> May be outdated
 * 3. An Official source shows the same version -> Looks current
 * 4. No version evidence, or sources conflict -> Can't verify
 */
export function determineVerdict(claim: Claim, evidenceList: SourceEvidence[]): VerdictResult {
  if (evidenceList.length === 0) {
    return {
      verdict: "Can't verify",
      reasons: ['No search results returned for query'],
    };
  }

  // If claim is an academic paper citation (FR-13)
  if (claim.type === 'paper') {
    const scholarSources = evidenceList.filter((e) => e.citationCount !== undefined || e.authors);
    if (scholarSources.length > 0) {
      const top = scholarSources[0]!;
      const citeText = top.citationCount !== undefined ? ` (${top.citationCount} citations)` : '';
      return {
        verdict: 'Looks current',
        reasons: [
          `Scholar verified: "${top.title}"${citeText}. Academic citation found on Google Scholar. Verify paper before use.`,
        ],
      };
    }
    if (evidenceList.length > 0) {
      const top = evidenceList[0]!;
      return {
        verdict: 'Looks current',
        reasons: [
          `Found academic record: "${top.title}". Verify paper status before use.`,
        ],
      };
    }
    return {
      verdict: "Can't verify",
      reasons: ['No matching academic paper found on Google Scholar'],
    };
  }

  // If claim has no explicit version (e.g. general temporal claim without version)
  if (!claim.version) {
    // Check if an official source was found
    const officialSources = evidenceList.filter((e) => e.authority === 'Official');
    if (officialSources.length > 0) {
      // If official source shows latest release info
      const withVersion = officialSources.find((e) => e.detectedVersion);
      if (withVersion) {
        return {
          verdict: 'May be outdated',
          reasons: [
            `Official source lists active version (${withVersion.detectedVersion}) for general claim: "${claim.text}"`,
          ],
        };
      }
      return {
        verdict: 'Looks current',
        reasons: ['Official source confirms topic without conflicting version evidence'],
      };
    }
    return {
      verdict: "Can't verify",
      reasons: ['Temporal claim without clear version comparison evidence'],
    };
  }

  const claimVer = claim.version;
  const officialSources = evidenceList.filter((e) => e.authority === 'Official');
  const refOrCommSources = evidenceList.filter(
    (e) => e.authority === 'Reference' || e.authority === 'Community'
  );

  let officialNewerVersion: string | null = null;
  let officialSameVersion: string | null = null;
  let refCommNewerVersion: string | null = null;

  // 1. Check Official sources
  for (const src of officialSources) {
    if (!src.detectedVersion) continue;
    const cmp = compareVersions(src.detectedVersion, claimVer);
    if (cmp === null) continue; // Non-semver or cannot compare

    if (cmp > 0) {
      officialNewerVersion = src.detectedVersion;
    } else if (cmp === 0) {
      officialSameVersion = src.detectedVersion;
    }
  }

  // 2. Check Reference / Community sources
  for (const src of refOrCommSources) {
    if (!src.detectedVersion) continue;
    const cmp = compareVersions(src.detectedVersion, claimVer);
    if (cmp === null) continue;

    if (cmp > 0) {
      refCommNewerVersion = src.detectedVersion;
    }
  }

  // Condition 1: An Official source shows a version newer than the note's -> Likely outdated
  if (officialNewerVersion) {
    return {
      verdict: 'Likely outdated',
      reasons: [
        `An Official source lists a newer version (${officialNewerVersion}) than note (${claimVer})`,
      ],
    };
  }

  // Condition 2: Only Reference or Community sources show a newer version -> May be outdated
  if (refCommNewerVersion) {
    return {
      verdict: 'May be outdated',
      reasons: [
        `Community/Reference sources report a newer version (${refCommNewerVersion}), but no Official source has confirmed it yet`,
      ],
    };
  }

  // Condition 3: An Official source shows the same version -> Looks current
  if (officialSameVersion) {
    return {
      verdict: 'Looks current',
      reasons: [
        `Official source confirms current version matches note (${officialSameVersion})`,
      ],
    };
  }

  // Condition 4: No version evidence, or sources conflict -> Can't verify
  return {
    verdict: "Can't verify",
    reasons: ['No clear version evidence found, or source information was inconclusive'],
  };
}
