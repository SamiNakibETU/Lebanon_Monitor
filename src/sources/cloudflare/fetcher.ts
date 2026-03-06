/**
 * Cloudflare Radar outages fetcher.
 */

import { fetchWithTimeout } from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import type { CloudflareOutage } from './types';
import { CLOUDFLARE_CONFIG } from './config';

const SOURCE = 'cloudflare';

export async function fetchCloudflare(): Promise<
  | { ok: true; data: CloudflareOutage[] }
  | { ok: false; error: { source: string; message: string } }
> {
  const token = process.env.CF_API_TOKEN;
  if (!token) {
    logger.warn('CF_API_TOKEN not set, skipping fetch');
    return { ok: false, error: { source: SOURCE, message: 'CF_API_TOKEN not configured' } };
  }

  const params = new URLSearchParams(CLOUDFLARE_CONFIG.params);
  const url = `${CLOUDFLARE_CONFIG.baseUrl}?${params.toString()}`;

  const result = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${token}` },
  }, {
    timeoutMs: 15_000,
    source: SOURCE,
  });

  if (!result.ok) {
    logger.error('Cloudflare fetch failed', { source: SOURCE, message: result.error.message });
    return { ok: false, error: result.error };
  }

  try {
    const json = await result.data.json();
    const data = (Array.isArray(json) ? json : json.result?.annotations ?? []) as CloudflareOutage[];
    logger.info('Cloudflare fetch successful', { source: SOURCE, outageCount: data.length });
    return { ok: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error('Cloudflare parse failed', { source: SOURCE, message });
    return { ok: false, error: { source: SOURCE, message } };
  }
}
