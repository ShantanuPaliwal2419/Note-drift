import { requestUrl } from 'obsidian';
import type { RequestUrlParam } from 'obsidian';
import type { HttpFetch, HttpResponse } from '@notedrift/core';

/**
 * Obsidian HTTP adapter wrapping requestUrl for @notedrift/core.
 * Adheres strictly to Obsidian developer policy: requestUrl must be used instead of window.fetch.
 */
export function createObsidianHttpFetch(): HttpFetch {
  return async (
    url: string,
    options?: {
      headers?: Record<string, string>;
      method?: string;
      body?: string;
    }
  ): Promise<HttpResponse> => {
    const param: RequestUrlParam = {
      url,
      method: options?.method ?? 'GET',
      headers: options?.headers,
      body: options?.body,
      throw: false, // Prevent Obsidian from throwing on 4xx/5xx so core can inspect status codes
    };

    const res = await requestUrl(param);

    return {
      status: res.status,
      text: () => res.text,
      json: () => res.json,
    };
  };
}
