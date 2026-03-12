/**
 * API v2 episodes — list analytic episodes (type + place + time clusters).
 */

import { NextRequest, NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { listEpisodes } from '@/db/repositories/episode-repository';

export async function GET(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured', code: 500 },
      { status: 500 }
    );
  }

  try {
    const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 50)));
    const offset = Math.max(0, Number(req.nextUrl.searchParams.get('offset') ?? 0));
    const fromDateParam = req.nextUrl.searchParams.get('from');
    const fromDate = fromDateParam ? new Date(fromDateParam) : undefined;

    const { episodes, total } = await withClient((client) =>
      listEpisodes(client, { limit, offset, fromDate })
    );

    return NextResponse.json(
      {
        items: episodes.map((ep) => ({
          id: ep.id,
          label: ep.label,
          summary: ep.summary,
          status: (ep as { status?: string }).status ?? 'open',
          firstEventAt: ep.first_event_at,
          lastEventAt: ep.last_event_at,
          eventCount: ep.event_count,
          footprintGeojson: ep.footprint_geojson,
        })),
        total,
      },
      {
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
      }
    );
  } catch (err) {
    console.error('API v2 episodes error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
