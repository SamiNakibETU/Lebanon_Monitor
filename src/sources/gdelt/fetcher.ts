/**
 * GDELT DOC API fetcher.
 * Rate limit: 6s min interval, 15min cache, 30s backoff on 429.
 */

import { logger } from '@/lib/logger';
import type { GdeltResponse } from './types';
import { GDELT_CONFIG } from './config';

const SOURCE = 'gdelt';

let lastFetchAt = 0;
let backoffUntil = 0;
let cache: { data: GdeltResponse; cachedAt: number } | null = null;

async function fetchWithAbort(url: string, opts: { timeoutMs: number }): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);
    return res;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

/**
 * Fetches Lebanon-related articles from GDELT DOC API.
 */
export async function fetchGdelt(): Promise<
  { ok: true; data: GdeltResponse } | { ok: false; error: { source: string; message: string } }
> {
  const now = Date.now();

  if (now < backoffUntil) {
    if (cache) {
      logger.info('GDELT serving from cache (backoff)', { source: SOURCE });
      return { ok: true, data: cache.data };
    }
    return { ok: true, data: { articles: [] } };
  }

  if (cache && now - cache.cachedAt < GDELT_CONFIG.cacheTtlMs) {
    if (now - lastFetchAt < GDELT_CONFIG.minIntervalMs) {
      logger.info('GDELT serving from cache (interval)', { source: SOURCE });
      return { ok: true, data: cache.data };
    }
  }

  const elapsed = now - lastFetchAt;
  if (elapsed > 0 && elapsed < GDELT_CONFIG.minIntervalMs) {
    const wait = GDELT_CONFIG.minIntervalMs - elapsed;
    await new Promise((r) => setTimeout(r, wait));
  }

  const params = new URLSearchParams({
    query: GDELT_CONFIG.query,
    mode: GDELT_CONFIG.mode,
    maxrecords: String(GDELT_CONFIG.maxRecords),
    format: GDELT_CONFIG.format,
    sort: GDELT_CONFIG.sort,
    timespan: GDELT_CONFIG.timespan,
  });

  const url = `${GDELT_CONFIG.baseUrl}?${params.toString()}`;

  try {
    const response = await fetchWithAbort(url, { timeoutMs: 15_000 });
    lastFetchAt = Date.now();

    if (response.status === 429) {
      backoffUntil = Date.now() + GDELT_CONFIG.backoffMs;
      logger.warn('GDELT 429 rate limited, backing off 30s', { source: SOURCE });
      if (cache) return { ok: true, data: cache.data };
      return { ok: true, data: { articles: [] } };
    }

    if (!response.ok) {
      const text = (await response.text()).slice(0, 200);
      logger.error('GDELT fetch failed', { source: SOURCE, status: response.status });
      if (cache) return { ok: true, data: cache.data };
      return { ok: false, error: { source: SOURCE, message: `HTTP ${response.status}: ${text}` } };
    }

    const text = await response.text();
    const data = JSON.parse(text) as GdeltResponse;
    cache = { data, cachedAt: Date.now() };
    const count = data.articles?.length ?? 0;
    logger.info('GDELT fetch successful', { source: SOURCE, articleCount: count });
    return { ok: true, data };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      logger.warn('GDELT timeout', { source: SOURCE });
    } else {
      logger.warn('GDELT parse failed (non-JSON or error)', {
        source: SOURCE,
        message: e instanceof Error ? e.message : String(e),
      });
    }
    if (cache) return { ok: true, data: cache.data };
    return { ok: true, data: { articles: [] } };
  }
}
