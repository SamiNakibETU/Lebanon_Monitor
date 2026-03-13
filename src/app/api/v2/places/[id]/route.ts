/**
 * API v2 place by ID — detail for lieu/place analyst page.
 * Phase 6 — identity, evidence, linked events/episodes, map block.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withClient, isDbConfigured } from '@/db/client';
import {
  getPlaceById,
  getEventsByPlace,
  getEpisodesByPlace,
} from '@/db/repositories/place-repository';
import { getEventsByIds } from '@/db/repositories/event-repository';
import { getEpisodeById } from '@/db/repositories/episode-repository';
import { getSourceDiversityForEventIds } from '@/db/repositories/event-observation-repository';
import { buildPlaceReadModel } from '@/lib/read-models/place';

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
    return NextResponse.json({ error: 'Invalid place ID format' }, { status: 400 });
  }

  try {
    const place = await withClient((client) => getPlaceById(client, id));
    if (!place) {
      return NextResponse.json({ error: 'Place not found', code: 404 }, { status: 404 });
    }

    const {
      eventIds,
      episodeLinks,
      events,
      eventTotal,
      episodeTotal,
      sourceDiversity,
    } = await withClient(async (client) => {
      const { eventIds: ids, total: evTotal } = await getEventsByPlace(client, id, {
        limit: 30,
        offset: 0,
      });
      const episodes = await getEpisodesByPlace(client, id, { limit: 10 });
      const srcDiv =
        ids.length > 0 ? await getSourceDiversityForEventIds(client, ids) : 0;
      const evs = ids.length > 0 ? await getEventsByIds(client, ids) : [];

      const episodeCountRes = await client.query<{ count: string }>(
        `SELECT COUNT(DISTINCT ee.episode_id)::int as count
         FROM episode_event ee
         JOIN event e ON e.id = ee.event_id AND e.is_active = true
         WHERE e.place_id = $1`,
        [id]
      );
      const epTotal = parseInt(episodeCountRes.rows[0]?.count ?? '0', 10);

      const episodeDetails = await Promise.all(
        episodes.map((ep) => getEpisodeById(client, ep.episodeId))
      );

      return {
        eventIds: ids,
        episodeLinks: episodes.map((ep, i) => ({
          episodeId: ep.episodeId,
          eventCount: ep.eventCount,
          episode: episodeDetails[i]
            ? {
                id: episodeDetails[i]!.id,
                label: episodeDetails[i]!.label,
                status: (episodeDetails[i] as { status?: string })?.status ?? 'open',
                firstEventAt: episodeDetails[i]!.first_event_at,
                lastEventAt: episodeDetails[i]!.last_event_at,
              }
            : null,
        })),
        events: evs,
        eventTotal: evTotal,
        episodeTotal: epTotal,
        sourceDiversity: srcDiv,
      };
    });

    const readModel = buildPlaceReadModel(place, {
      eventCount: eventTotal,
      episodeCount: episodeTotal,
      sourceDiversity,
    });

    const mapBlock = {
      centroid:
        place.lat != null && place.lng != null
          ? { lat: place.lat, lng: place.lng }
          : null,
      footprintGeojson: null as unknown,
    };

    const recentEvents = events.map((e) => ({
      id: e.id,
      title: e.canonical_title,
      occurredAt: e.occurred_at,
      eventType: e.event_type,
      polarity: e.polarity_ui,
    }));

    return NextResponse.json(
      {
        ...readModel,
        mapBlock,
        recentEvents,
        linkedEpisodes: episodeLinks,
      },
      {
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
      }
    );
  } catch (err) {
    console.error('API v2 place by id error', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 500 },
      { status: 500 }
    );
  }
}
