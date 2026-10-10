import type { Claim } from '../types.js';
import { loadDefaultRules } from './rules.js';
import { normalizeVersion } from './versions.js';

const STOP_WORDS = new Set([
  'this', 'that', 'these', 'those', 'it', 'its', 'we', 'they', 'our', 'the',
  'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'as', 'is',
  'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
  'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may',
  'might', 'must', 'and', 'but', 'or', 'so', 'yet', 'if', 'because', 'since',
  'while', 'when', 'where', 'how', 'why', 'what', 'who', 'which', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just'
]);

const NON_SOFTWARE_ENTITIES = new Set([
  'step', 'chapter', 'section', 'part', 'level', 'page', 'rule', 'item', 'rts',
  'article', 'clause', 'figure', 'table', 'autumn', 'spring', 'summer', 'winter',
  'fall', 'january', 'february', 'march', 'april', 'may', 'june', 'july',
  'august', 'september', 'october', 'november', 'december', 'equal', 'equals',
  'approx', 'approximately'
]);

export interface ExtractionOptions {
  notePath?: string;
  snoozedIds?: Record<string, string>; // claimId -> snoozedUntil (ISO date)
}

function generateClaimId(notePath: string, line: number, text: string): string {
  // Simple deterministic hash
  const str = `${notePath}:${line}:${text.trim()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `claim_${Math.abs(hash).toString(36)}`;
}

/**
 * Extracts time-sensitive claims from Markdown note text.
 * Preserves original text byte-for-byte and records 1-indexed line numbers.
 */
export function extractClaims(markdown: string, options: ExtractionOptions = {}): Claim[] {
  const notePath = options.notePath ?? 'note.md';
  const claims: Claim[] = [];
  const rules = loadDefaultRules();

  const lines = markdown.split(/\r?\n/);
  let inFrontmatter = false;
  let inCodeBlock = false;

  // Check if note has 'notedrift: skip' in frontmatter
  if (lines.length > 0 && lines[0]?.trim() === '---') {
    let fmEnd = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i]?.trim() === '---') {
        fmEnd = i;
        break;
      }
    }
    if (fmEnd !== -1) {
      const fmContent = lines.slice(1, fmEnd).join('\n');
      if (/notedrift:\s*skip/i.test(fmContent)) {
        return []; // Whole note skipped
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!;
    const lineNum = i + 1; // 1-indexed
    const trimmed = rawLine.trim();

    // 1. Handle frontmatter
    if (i === 0 && trimmed === '---') {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (trimmed === '---') {
        inFrontmatter = false;
      }
      continue;
    }

    // 2. Handle fenced code blocks
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) {
      continue;
    }

    // 3. Skip ignored lines
    let isIgnored = false;
    for (const marker of rules.ignoreMarkers) {
      if (rawLine.includes(marker)) {
        isIgnored = true;
        break;
      }
    }
    if (isIgnored) {
      continue;
    }

    // 4. Extract Software Version claims (e.g. "libfoo 1.5", "React 18.2", "Node.js 20.0")
    for (const patternStr of rules.versionPatterns) {
      const regex = new RegExp(patternStr, 'g');
      let match: RegExpExecArray | null;
      while ((match = regex.exec(rawLine)) !== null) {
        const entity = match[1]?.trim();
        const ver = match[2]?.trim();

        if (entity && ver && normalizeVersion(ver)) {
          const lowerEntity = entity.toLowerCase();
          // Filter out stopwords, grammatical particles, and non-software words
          if (STOP_WORDS.has(lowerEntity) || NON_SOFTWARE_ENTITIES.has(lowerEntity)) {
            continue;
          }

          // If version looks like a 4-digit calendar year (e.g. 1990-2099)
          if (/^(?:19|20)[0-9]{2}$/.test(ver)) {
            continue;
          }

          const claimText = rawLine.trim();
          const id = generateClaimId(notePath, lineNum, claimText);
          const snoozedUntil = options.snoozedIds?.[id];

          // Check if currently snoozed
          let isSnoozed = false;
          if (snoozedUntil && new Date(snoozedUntil).getTime() > Date.now()) {
            isSnoozed = true;
          }

          if (!isSnoozed && !claims.some((c) => c.line === lineNum && c.entity === entity)) {
            claims.push({
              id,
              notePath,
              line: lineNum,
              text: claimText,
              type: 'version',
              entity,
              version: ver,
            });
          }
        }
      }
    }

    // 5. Extract Temporal claims (sentences with "latest", "current", "newest", "as of <date>", "now supports")

    for (const kw of rules.temporalKeywords) {
      const kwRegex = new RegExp(`\\b${kw}\\b`, 'i');
      if (kwRegex.test(rawLine)) {
        const claimText = rawLine.trim();
        const id = generateClaimId(notePath, lineNum, claimText);

        // Find candidate entity: check previous claims in note first (e.g. "React 17.0" on line above)
        let entity = '';
        const prevClaim = claims.slice().reverse().find((c) => Math.abs(c.line - lineNum) <= 3 && c.entity);
        
        const words = claimText.replace(/[^a-zA-Z0-9\s_-]/g, ' ').split(/\s+/).filter(Boolean);
        // Look for capitalized or non-stopword tokens in this line
        const candidateWords = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()) && w.toLowerCase() !== kw.toLowerCase());

        if (prevClaim && (words.length > 0 && STOP_WORDS.has(words[0]!.toLowerCase()))) {
          // Sentence begins with pronoun like "This is the latest..." -> refers to previous entity!
          entity = prevClaim.entity;
        } else {
          // Check for consecutive capitalized words in candidateWords (e.g. "Federal Reserve", "Goldman Sachs")
          const capWords: string[] = [];
          for (const w of candidateWords) {
            if (/^[A-Z]/.test(w)) {
              capWords.push(w);
              if (capWords.length >= 3) break;
            } else if (capWords.length > 0) {
              break;
            }
          }
          if (capWords.length > 0) {
            entity = capWords.join(' ');
          } else if (candidateWords.length > 0 && candidateWords[0]) {
            entity = candidateWords[0];
          } else if (prevClaim) {
            entity = prevClaim.entity;
          }
        }

        // Only create a temporal claim if we have a real meaningful entity (not a stop word or empty)
        if (entity && !STOP_WORDS.has(entity.toLowerCase())) {
          const snoozedUntil = options.snoozedIds?.[id];
          let isSnoozed = false;
          if (snoozedUntil && new Date(snoozedUntil).getTime() > Date.now()) {
            isSnoozed = true;
          }

          if (!isSnoozed && !claims.some((c) => c.line === lineNum && c.type === 'temporal')) {
            claims.push({
              id,
              notePath,
              line: lineNum,
              text: claimText,
              type: 'temporal',
              entity,
              temporalPhrase: kw,
            });
          }
        }
      }
    }

    // 6. Extract Paper Citation claims (e.g. "[1] Vaswani et al., 2017", "[1] Fama and French, 1993", or "Markowitz (1952)")
    for (const pStr of rules.paperPatterns) {
      const pRegex = new RegExp(pStr, 'g');
      let pMatch: RegExpExecArray | null;
      while ((pMatch = pRegex.exec(rawLine)) !== null) {
        let citation = pMatch[1]?.trim();
        if (pMatch[2]) {
          citation = `${pMatch[1]?.trim()} (${pMatch[2].trim()})`;
        }
        if (citation) {
          const claimText = rawLine.trim();
          const id = generateClaimId(notePath, lineNum, claimText);

          if (!claims.some((c) => c.line === lineNum && c.type === 'paper')) {
            claims.push({
              id,
              notePath,
              line: lineNum,
              text: claimText,
              type: 'paper',
              entity: citation,
            });
          }
        }
      }
    }
  }

  return claims;
}
