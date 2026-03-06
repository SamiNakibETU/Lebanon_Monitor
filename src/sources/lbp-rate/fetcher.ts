/**
 * LBP/USD exchange rate scraper.
 */

import * as cheerio from 'cheerio';
import { fetchWithTimeout } from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import { LBP_RATE_CONFIG } from './config';

const SOURCE = 'lbp-rate';

/**
 * Extracts LBP/USD rate from HTML using common patterns.
 */
function extractRate(html: string): number | null {
  const $ = cheerio.load(html);
  const text = $('body').text();

  // Match patterns like "89,500" or "89500" or "89 500"
  const patterns = [
    /(\d{2}[,.\s]\d{3})\s*(?:LBP|LL|lbp)/i,
    /(?:rate|sell|buy)[:\s]*(\d{2}[,.\s]?\d{3})/i,
    /(\d{5,6})\s*(?:LBP|LL)/i,
  ];

  for (const re of patterns) {
    const match = text.match(re);
    if (match) {
      const num = parseFloat(match[1].replace(/[,.\s]/g, ''));
      if (num > 1000 && num < 1_000_000) return num;
    }
  }

  return null;
}

export async function fetchLbpRate(): Promise<
  | { ok: true; data: { rate: number } }
  | { ok: false; error: { source: string; message: string } }
> {
  for (const url of LBP_RATE_CONFIG.urls) {
    const result = await fetchWithTimeout(url, {}, {
      timeoutMs: 10_000,
      source: SOURCE,
    });

    if (!result.ok) continue;

    try {
      const html = await result.data.text();
      const rate = extractRate(html);
      if (rate !== null) {
        logger.info('LBP rate fetch successful', { source: SOURCE, rate });
        return { ok: true, data: { rate } };
      }
    } catch {
      // Try next URL
    }
  }

  logger.warn('LBP rate extraction failed from all URLs');
  return { ok: false, error: { source: SOURCE, message: 'Could not extract rate' } };
}
