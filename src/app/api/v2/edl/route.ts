import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';

const URL = 'https://www.edl.gov.lb/feeding.php';

function estimateHours(html: string): number | null {
  const matches = [...html.matchAll(/(\d{1,2})\s*(?:h|heures|hours)/gi)].map((m) => Number(m[1]));
  if (matches.length === 0) return null;
  const avg = matches.reduce((a, b) => a + b, 0) / matches.length;
  return Math.max(0, Math.min(24, Math.round(avg)));
}

export async function GET() {
  try {
    const payload = await cachedFetch(
      'v2:edl',
      async () => {
        const res = await fetch(URL, {
          headers: { 'User-Agent': 'LebanonMonitor/1.0' },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) {
          return {
            source: 'fallback',
            availableHours: null,
            status: 'unavailable',
            updatedAt: new Date().toISOString(),
          };
        }
        const html = await res.text();
        const availableHours = estimateHours(html);
        return {
          source: 'edl.gov.lb',
          availableHours,
          status: availableHours == null ? 'partial' : 'ok',
          updatedAt: new Date().toISOString(),
        };
      },
      { ttl: 60 * 60 }
    );
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' },
    });
  } catch (err) {
    return NextResponse.json(
      {
        source: 'fallback',
        availableHours: null,
        status: 'unavailable',
        updatedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 200 }
    );
  }
}
