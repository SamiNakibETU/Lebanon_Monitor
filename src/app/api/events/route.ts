import { NextResponse } from 'next/server';
import { fetchAll } from '@/sources/registry';
import { z } from 'zod';

const querySchema = z.object({
  source: z.enum(['all', 'gdelt', 'usgs', 'firms', 'rss', 'gdacs', 'reliefweb', 'weather', 'cloudflare', 'lbp-rate', 'openaq', 'twitter', 'ucdp']).optional().default('all'),
  classification: z.enum(['all', 'lumiere', 'ombre', 'neutre']).optional().default('all'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      source: searchParams.get('source') ?? 'all',
      classification: searchParams.get('classification') ?? 'all',
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query params', details: parsed.error.flatten() }, { status: 400 });
    }

    const { source, classification } = parsed.data;
    const { events, statuses, indicators } = await fetchAll();

    let filtered = events;
    if (source !== 'all') {
      filtered = filtered.filter((e) => e.source === source);
    }
    if (classification !== 'all') {
      filtered = filtered.filter((e) => e.classification === classification);
    }

    return NextResponse.json(
      {
        events: filtered.map((e) => ({
          ...e,
          timestamp: e.timestamp.toISOString(),
          metadata: {
            ...e.metadata,
            fetchedAt: e.metadata.fetchedAt.toISOString(),
          },
        })),
        total: filtered.length,
        statuses,
        indicators,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
