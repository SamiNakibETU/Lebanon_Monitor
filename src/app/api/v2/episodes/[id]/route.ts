/**
 * API v2 episode by ID — detail with event ids.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { getEpisodeById, getEpisodeEventIds } from '@/db/repositories/episode-repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured', code: 500 },
      { status: 500 }
    );
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid episode ID format' }, { status: 400 });
  }

  try {
    const { episode, eventIds } = await withClient(async (client) => {
      const episode = await getEpisodeById(client, id);
      if (!episode) return { episode: null, eventIds: [] };
      const eventIds = await getEpisodeEventIds(client, id);
      return { episode, eventIds };
    });

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found', code: 404 }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: episode.id,
        label: episode.label,
        summary: episode.summary,
        status: (episode as { status?: string }).status ?? 'open',
        firstEventAt: episode.first_event_at,
        lastEventAt: episode.last_event_at,
        eventCount: episode.event_count,
        footprintGeojson: episode.footprint_geojson,
        metadata: episode.metadata,
        eventIds,
      },
      {
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
      }
    );
  } catch (err) {
    console.error('API v2 episode by id error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
