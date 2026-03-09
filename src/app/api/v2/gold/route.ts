import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';

interface GoldData {
  usdPerOz: number;
  source: string;
  updated: string;
}

const FALLBACK: GoldData = {
  usdPerOz: 2900,
  source: 'fallback',
  updated: new Date().toISOString(),
};

const CACHE_HEADERS = {
  'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200',
};

export async function GET() {
  try {
    const data = await cachedFetch<GoldData>(
      'lm:gold',
      async () => {
        const res = await fetch('https://api.gold-api.com/price/XAU', {
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const json = await res.json();
          const usdPerOz =
            json.price ?? (json.price_gram_24k ? json.price_gram_24k * 31.1035 : null);

          if (usdPerOz) {
            return {
              usdPerOz: Math.round(usdPerOz * 100) / 100,
              source: 'gold-api',
              updated: new Date().toISOString(),
            };
          }
        }

        const res2 = await fetch(
          'https://metals-api.com/api/latest?base=USD&symbols=XAU',
          { signal: AbortSignal.timeout(8000) }
        );
        if (res2.ok) {
          const j2 = await res2.json();
          const rate = j2.rates?.XAU;
          if (rate) {
            return {
              usdPerOz: Math.round((1 / rate) * 100) / 100,
              source: 'metals-api',
              updated: new Date().toISOString(),
            };
          }
        }

        return FALLBACK;
      },
      { ttl: 3600 }
    );

    return NextResponse.json(data ?? FALLBACK, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json(FALLBACK, { headers: CACHE_HEADERS });
  }
}
