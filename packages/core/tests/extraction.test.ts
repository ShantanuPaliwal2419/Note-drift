import { describe, it, expect } from 'vitest';
import { extractClaims } from '../src/extract/claims.js';

describe('Claim Extraction (FR-01)', () => {
  it('extracts software version claims with exact byte preservation and 1-indexed lines', () => {
    const md = `# Project Documentation
We are currently running libfoo 1.5 in production.
Database layer uses PostgreSQL 16.1 for storage.`;

    const claims = extractClaims(md, { notePath: 'notes/doc.md' });

    expect(claims.length).toBeGreaterThanOrEqual(2);
    const libfooClaim = claims.find((c) => c.entity === 'libfoo');
    expect(libfooClaim).toBeDefined();
    expect(libfooClaim?.version).toBe('1.5');
    expect(libfooClaim?.line).toBe(2);
    expect(libfooClaim?.text).toBe('We are currently running libfoo 1.5 in production.');
  });

  it('extracts temporal statements like latest, current, as of', () => {
    const md = `The latest version of the client library is recommended.
As of 2024, async mode is supported.`;

    const claims = extractClaims(md);
    expect(claims.some((c) => c.temporalPhrase === 'latest')).toBe(true);
    expect(claims.some((c) => c.temporalPhrase === 'as of')).toBe(true);
  });

  it('skips frontmatter and code blocks', () => {
    const md = `---
title: Guide
tags: [libfoo 1.5]
---

\`\`\`bash
npm install libfoo@1.5
\`\`\`

Here is text with libfoo 1.5 outside code.`;

    const claims = extractClaims(md);
    expect(claims.length).toBe(1);
    expect(claims[0]?.line).toBe(10);
  });

  it('skips claims flagged with %% notedrift:ignore %%', () => {
    const md = `libfoo 1.5 is used here %% notedrift:ignore %%
libbar 2.0 is used here`;

    const claims = extractClaims(md);
    expect(claims.length).toBe(1);
    expect(claims[0]?.entity).toBe('libbar');
  });

  it('skips entire note if frontmatter specifies notedrift: skip', () => {
    const md = `---
notedrift: skip
---
libfoo 1.5 is here`;

    const claims = extractClaims(md);
    expect(claims.length).toBe(0);
  });
});
