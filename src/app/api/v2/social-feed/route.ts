import { NextResponse } from 'next/server';
import { cachedFetch } from '@/lib/cache';
import { runSocialMediaIngest } from '@/worker/social-media-ingest';

export async function GET() {
  try {
    const payload = await cachedFetch(
      'lm:social-feed:v1',
      async () => {
        const items = await runSocialMediaIngest();
        return {
          generatedAt: new Date().toISOString(),
          count: items.length,
          items: items.slice(0, 60),
        };
      },
      { ttl: 300 }
    );
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=900' },
    });
  } catch (err) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      count: 0,
      items: [],
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

