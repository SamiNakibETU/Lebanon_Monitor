import { NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';

export async function GET() {
  const fallback = {
    benzin95: 2_425_000,
    benzin98: 2_475_000,
    diesel: 1_850_000,
    currency: 'LBP',
    perLiters: 20,
    updated: '2026-03-01',
  };

  try {
    if (isDbConfigured()) {
      const result = await withClient(async (client) => {
        const res = await client.query(
          `SELECT payload FROM indicator_snapshot WHERE indicator_key = 'fuel' ORDER BY computed_at DESC LIMIT 1`
        );
        return res.rows[0]?.payload ?? null;
      });
      if (result) {
        return NextResponse.json(
          typeof result === 'string' ? JSON.parse(result) : result,
          { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' } }
        );
      }
    }
  } catch {
    // fall through to static data
  }

  return NextResponse.json(fallback, {
    headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
  });
}
