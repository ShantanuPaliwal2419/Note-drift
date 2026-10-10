import semver from 'semver';

/**
 * Normalizes a version string (e.g., '1.5' -> '1.5.0', 'v2.0' -> '2.0.0') for semver parsing.
 */
export function normalizeVersion(v: string): string | null {
  const cleaned = v.trim().replace(/^[vV]/, '');

  if (semver.valid(cleaned)) {
    return cleaned;
  }

  // Handle 2-digit versions like 1.5 or 2.0
  const twoDigitMatch = cleaned.match(/^([0-9]+)\.([0-9]+)$/);
  if (twoDigitMatch) {
    const full = `${twoDigitMatch[1]}.${twoDigitMatch[2]}.0`;
    if (semver.valid(full)) {
      return full;
    }
  }

  // Handle single-digit integer versions like 16 or 18
  const singleDigitMatch = cleaned.match(/^([0-9]+)$/);
  if (singleDigitMatch) {
    const full = `${singleDigitMatch[1]}.0.0`;
    if (semver.valid(full)) {
      return full;
    }
  }

  // Coerce if possible
  const coerced = semver.coerce(cleaned);
  return coerced ? coerced.version : null;
}

/**
 * Compares two version strings.
 * Returns:
 *   1 if v1 > v2 (v1 is newer)
 *  -1 if v1 < v2 (v2 is newer)
 *   0 if v1 === v2
 *   null if either cannot be safely parsed as semver
 */
export function compareVersions(v1: string, v2: string): number | null {
  const norm1 = normalizeVersion(v1);
  const norm2 = normalizeVersion(v2);

  if (!norm1 || !norm2) {
    return null; // Non-semver or unrecognized -> null
  }

  if (semver.gt(norm1, norm2)) return 1;
  if (semver.lt(norm1, norm2)) return -1;
  return 0;
}

/**
 * Extracts candidate version numbers from arbitrary text (title, snippet).
 */
export function extractVersionFromText(text: string): string | undefined {
  // Look for patterns like v2.0, version 2.0.1, 2.0 released, etc.
  const regexes = [
    /(?:version\s*|v)([0-9]+\.[0-9]+(?:\.[0-9]+)?(?:-[a-zA-Z0-9.]+)?)/i,
    /\b([0-9]+\.[0-9]+(?:\.[0-9]+)?)\s+(?:released|release|is out|available|upgrade)\b/i,
    /(?:release\s+notes\s+for\s+v?)([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i,
    /\bv?([0-9]+\.[0-9]+(?:\.[0-9]+)?)\b/i,
  ];

  for (const regex of regexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const candidate = match[1];
      if (normalizeVersion(candidate)) {
        return candidate;
      }
    }
  }

  return undefined;
}
