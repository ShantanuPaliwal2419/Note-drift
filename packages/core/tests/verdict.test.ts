import { describe, it, expect } from 'vitest';
import { determineVerdict } from '../src/analyze/verdict.js';
import type { Claim, SourceEvidence } from '../src/types.js';

describe('Verdict Decision Logic (FR-04, Section 7)', () => {
  const baseClaim: Claim = {
    id: 'test-1',
    notePath: 'notes/test.md',
    line: 5,
    text: 'libfoo 1.5 is installed',
    type: 'version',
    entity: 'libfoo',
    version: '1.5',
  };

  it('row 1: An Official source shows a version newer than note -> Likely outdated', () => {
    const evidence: SourceEvidence[] = [
      {
        title: 'libfoo releases',
        link: 'https://libfoo.dev/releases',
        snippet: 'libfoo 2.0 released',
        date: '2026-09-01',
        authority: 'Official',
        detectedVersion: '2.0',
      },
    ];

    const result = determineVerdict(baseClaim, evidence);
    expect(result.verdict).toBe('Likely outdated');
    expect(result.reasons[0]).toContain('Official source lists a newer version');
  });

  it('row 2: Only Reference or Community sources show a newer version -> May be outdated', () => {
    const evidence: SourceEvidence[] = [
      {
        title: 'Community Blog',
        link: 'https://example.com/blog',
        snippet: 'Upgrading to libfoo 2.0',
        date: '2026-08-15',
        authority: 'Community',
        detectedVersion: '2.0',
      },
    ];

    const result = determineVerdict(baseClaim, evidence);
    expect(result.verdict).toBe('May be outdated');
    expect(result.reasons[0]).toContain('Community/Reference sources report a newer version');
  });

  it('row 3: An Official source shows the same version -> Looks current', () => {
    const evidence: SourceEvidence[] = [
      {
        title: 'libfoo Documentation',
        link: 'https://libfoo.dev/docs',
        snippet: 'Current version is libfoo 1.5.0',
        date: '2026-05-10',
        authority: 'Official',
        detectedVersion: '1.5',
      },
    ];

    const result = determineVerdict(baseClaim, evidence);
    expect(result.verdict).toBe('Looks current');
    expect(result.reasons[0]).toContain('Official source confirms current version matches note');
  });

  it('row 4: No version evidence -> Can\'t verify', () => {
    const evidence: SourceEvidence[] = [
      {
        title: 'libfoo Overview',
        link: 'https://libfoo.dev/about',
        snippet: 'An overview of features',
        date: 'date: unknown',
        authority: 'Official',
      },
    ];

    const result = determineVerdict(baseClaim, evidence);
    expect(result.verdict).toBe("Can't verify");
  });

  it('never outputs Likely outdated without an Official-class source', () => {
    const evidence: SourceEvidence[] = [
      {
        title: 'Tech Forum post',
        link: 'https://reddit.com/r/libfoo',
        snippet: 'libfoo 3.0 announced on forum',
        date: '2026-10-01',
        authority: 'Community',
        detectedVersion: '3.0',
      },
    ];

    const result = determineVerdict(baseClaim, evidence);
    expect(result.verdict).not.toBe('Likely outdated');
    expect(result.verdict).toBe('May be outdated');
  });
});
