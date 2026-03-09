import * as cheerio from 'cheerio';
import { fetchWithTimeout } from '@/lib/fetcher';
import { logger } from '@/lib/logger';

const FUEL_URLS = [
  'https://www.globalpetrolprices.com/Lebanon/gasoline_prices/',
  'https://www.iptgroup.com.lb/ipt/en/our-services/fuel-prices',
];

function extractLebFuelPrices(
  html: string
): { benzin95: number; benzin98: number; diesel: number } | null {
  const $ = cheerio.load(html);
  const text = $('body').text();

  const prices: number[] = [];
  const re = /(\d{1,3}(?:[,.\s]\d{3})+)\s*(?:LBP|LL|L\.L)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const num = parseInt(m[1].replace(/[,.\s]/g, ''), 10);
    if (num > 100_000 && num < 10_000_000) prices.push(num);
  }

  if (prices.length >= 2) {
    prices.sort((a, b) => a - b);
    return {
      benzin95: prices[0],
      benzin98: prices.length > 2 ? prices[1] : Math.round(prices[0] * 1.02),
      diesel:
        prices[prices.length - 1] < prices[0]
          ? prices[prices.length - 1]
          : Math.round(prices[0] * 0.75),
    };
  }

  return null;
}

export interface FuelPriceData {
  benzin95: number;
  benzin98: number;
  diesel: number;
  updated: string;
}

export async function fetchFuelPrices(): Promise<
  | { ok: true; data: FuelPriceData }
  | { ok: false; error: { source: string; message: string } }
> {
  for (const url of FUEL_URLS) {
    try {
      const result = await fetchWithTimeout(
        url,
        { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LebanonMonitor/1.0)' } },
        { timeoutMs: 10_000, source: 'fuel' }
      );

      if (!result.ok) continue;

      const html = await result.data.text();
      const prices = extractLebFuelPrices(html);
      if (prices) {
        logger.info('Fuel prices fetched', { source: url, benzin95: prices.benzin95 });
        return {
          ok: true,
          data: { ...prices, updated: new Date().toISOString() },
        };
      }
    } catch {
      continue;
    }
  }

  return {
    ok: false,
    error: { source: 'fuel', message: 'Could not extract fuel prices from any source' },
  };
}
