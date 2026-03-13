/**
 * API v2 places — list places from gazetteer.
 * Phase 6 — lieu/place analyst surfaces.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import { listPlaces, getEventsByPlace } from '@/db/repositories/place-repository';
import { getSourceDiversityForEventIds } from '@/db/repositories/event-observation-repository';
import { buildPlaceReadModel } from '@/lib/read-models/place';

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
    const placeType = req.nextUrl.searchParams.get('placeType') ?? undefined;
    const q = req.nextUrl.searchParams.get('q') ?? undefined;

    const { places, total } = await withClient((client) =>
      listPlaces(client, { place_type: placeType || undefined, q: q?.trim() || undefined, limit, offset })
    );

    const items = await withClient(async (client) => {
      const result = [];
      for (const p of places) {
        const { eventIds, total: eventTotal } = await getEventsByPlace(client, p.id, { limit: 1, offset: 0 });
        const episodeCountRes = await client.query<{ count: number }>(
          `SELECT COUNT(DISTINCT ee.episode_id)::int as count
           FROM episode_event ee
           JOIN event e ON e.id = ee.event_id AND e.is_active = true
           WHERE e.place_id = $1`,
          [p.id]
        );
        const episodeCount = episodeCountRes.rows[0]?.count ?? 0;
        const sourceDiversity = eventIds.length > 0
          ? await getSourceDiversityForEventIds(client, eventIds)
          : 0;
        result.push(
          buildPlaceReadModel(p, {
            eventCount: eventTotal,
            episodeCount,
            sourceDiversity,
          })
        );
      }
      return result;
    });

    return NextResponse.json(
      { items, total },
      {
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
      }
    );
  } catch (err) {
    console.error('API v2 places error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
