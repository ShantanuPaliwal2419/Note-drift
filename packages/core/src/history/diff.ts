import type { ClaimCheck, CheckDiff } from '../types.js';

export function computeCheckDiff(
  currentCheck: Omit<ClaimCheck, 'diff'>,
  previousCheck?: ClaimCheck
): CheckDiff {
  if (!previousCheck) {
    return {
      changed: false,
    };
  }

  const verdictChanged = currentCheck.verdict !== previousCheck.verdict;

  // Check if a new official source was discovered
  const prevHadOfficial = previousCheck.evidence.some((e) => e.authority === 'Official');
  const currHasOfficial = currentCheck.evidence.some((e) => e.authority === 'Official');
  const newOfficialSource = !prevHadOfficial && currHasOfficial;

  // Check if a newer version was detected
  const prevMaxVer = previousCheck.evidence.map((e) => e.detectedVersion).find(Boolean);
  const currMaxVer = currentCheck.evidence.map((e) => e.detectedVersion).find(Boolean);
  const newVersionFound = currMaxVer && currMaxVer !== prevMaxVer ? currMaxVer : undefined;

  const changed = verdictChanged || newOfficialSource || !!newVersionFound;

  let summary: string | undefined;
  if (changed) {
    const parts: string[] = [];
    if (verdictChanged) {
      parts.push(`verdict changed: ${previousCheck.verdict} -> ${currentCheck.verdict}`);
    }
    if (newOfficialSource) {
      parts.push('new official source found');
    }
    if (newVersionFound) {
      parts.push(`new version found (${newVersionFound})`);
    }
    summary = parts.join('; ');
  }

  return {
    changed,
    previousVerdict: previousCheck.verdict,
    newOfficialSource,
    newVersionFound,
    summary,
  };
}
