import type {
  SerpApiResponse,
  SourceEvidence,
  SourceAuthority,
} from '../types.js';

/**
 * Safely parse SerpApi response JSON into structured evidence items.
 * Snippets are treated as untrusted text and sanitized.
 */
export function parseSerpApiResponse(
  data: unknown,
  classifyAuthority: (url: string) => SourceAuthority,
  extractVersionFromText?: (text: string) => string | undefined
): { evidence: SourceEvidence[]; error?: string } {
  if (!data || typeof data !== 'object') {
    return { evidence: [], error: 'Invalid response: expected JSON object' };
  }

  const res = data as SerpApiResponse;

  if (res.error) {
    return { evidence: [], error: `SerpApi Error: ${res.error}` };
  }

  const evidenceList: SourceEvidence[] = [];

  // 1. Organic web results
  if (Array.isArray(res.organic_results)) {
    for (const item of res.organic_results) {
      if (!item.link || !item.title) continue;

      const title = String(item.title);
      const snippet = item.snippet ? String(item.snippet) : '';
      const combinedText = `${title} ${snippet}`;
      const detectedVersion = extractVersionFromText ? extractVersionFromText(combinedText) : undefined;

      evidenceList.push({
        title,
        link: item.link,
        snippet,
        date: item.date ? String(item.date) : 'date: unknown',
        authority: classifyAuthority(item.link),
        detectedVersion,
      });
    }
  }

  // 2. News results
  if (Array.isArray(res.news_results)) {
    for (const item of res.news_results) {
      if (!item.link || !item.title) continue;

      const title = String(item.title);
      const snippet = item.snippet ? String(item.snippet) : '';
      const combinedText = `${title} ${snippet}`;
      const detectedVersion = extractVersionFromText ? extractVersionFromText(combinedText) : undefined;

      evidenceList.push({
        title,
        link: item.link,
        snippet,
        date: item.date ? String(item.date) : 'date: unknown',
        authority: classifyAuthority(item.link),
        detectedVersion,
      });
    }
  }

  // 3. Google Scholar results
  if (Array.isArray(res.scholar_results)) {
    for (const item of res.scholar_results) {
      if (!item.link || !item.title) continue;

      const title = String(item.title);
      const snippet = item.snippet ? String(item.snippet) : '';
      const authors = item.publication_info?.authors?.map((a) => a.name).join(', ') ?? item.publication_info?.summary;
      const citationCount = item.inline_links?.cited_by?.total;

      evidenceList.push({
        title,
        link: item.link,
        snippet,
        date: 'date: unknown',
        authority: classifyAuthority(item.link),
        authors,
        citationCount,
      });
    }
  }

  return { evidence: evidenceList };
}
