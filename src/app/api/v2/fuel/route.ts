import { NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { cachedFetch } from '@/lib/cache';
import { fetchFuelPrices } from '@/sources/fuel/fetcher';

const FALLBACK = {
  benzin95: 2_425_000,
  benzin98: 2_475_000,
  diesel: 1_850_000,
  currency: 'LBP' as const,
  perLiters: 20 as const,
  updated: '2026-03-01',
  source: 'fallback' as const,
};

const CACHE_HEADERS = {
  'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
};

export async function GET() {
  try {
    const data = await cachedFetch(
      'lm:fuel',
      async () => {
        const scraped = await fetchFuelPrices();
        if (scraped.ok) {
          return {
            ...scraped.data,
            currency: 'LBP' as const,
            perLiters: 20 as const,
            source: 'scraper' as const,
          };
        }

        if (isDbConfigured()) {
          const row = await withClient(async (client) => {
            const res = await client.query(
              `SELECT payload FROM indicator_snapshot WHERE indicator_key = 'fuel' ORDER BY computed_at DESC LIMIT 1`
            );
            return res.rows[0]?.payload ?? null;
          });
          if (row) {
            const parsed = typeof row === 'string' ? JSON.parse(row) : row;
            return { ...parsed, source: 'db' };
          }
        }

        return null;
      },
      { ttl: 3600 }
    );

    return NextResponse.json(data ?? FALLBACK, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json(FALLBACK, { headers: CACHE_HEADERS });
  }
}
