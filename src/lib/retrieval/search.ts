/**
 * Structured retrieval — SQL + filters over events, episodes, places, entities.
 * Temporal, relational, light geo. No embeddings.
 */

import type { PoolClient } from 'pg';
import { listEvents } from '@/db/repositories/event-repository';
import { listEpisodes } from '@/db/repositories/episode-repository';
import { listPlaces } from '@/db/repositories/place-repository';
import { searchEntities } from '@/db/repositories/entity-repository';
import { searchEvents } from '@/db/repositories/event-repository';
import { getClaimsByEventIds } from '@/db/repositories/claim-repository';
import type { RetrievalQuery } from './query-schema';
import { rerankEvents } from './rerank';

export interface RetrievalResult {
  events: Array<{
    id: string;
    title: string;
    summary: string | null;
    occurredAt: string;
    eventType: string | null;
    polarity: string | null;
    placeId: string | null;
    sourceCount: number;
  }>;
  episodes: Array<{
    id: string;
    label: string | null;
    summary: string | null;
    firstEventAt: string | null;
    lastEventAt: string | null;
  }>;
  places: Array<{
    id: string;
    namePrimary: string;
    placeType: string | null;
    eventCount: number;
  }>;
  actors: Array<{
    id: string;
    name: string;
    entityType: string;
  }>;
  claims: Array<{
    id: string;
    eventId: string;
    text: string;
  }>;
  meta: {
    totalEvents: number;
    totalEpisodes: number;
    totalPlaces: number;
    totalActors: number;
  };
}

export async function runRetrieval(
  client: PoolClient,
  query: RetrievalQuery
): Promise<RetrievalResult> {
  const fromDate = query.fromDate ? new Date(query.fromDate) : undefined;
  const toDate = query.toDate ? new Date(query.toDate) : undefined;
  const limit = Math.min(query.limit, 50);
  const bbox =
    query.minLat != null && query.maxLat != null && query.minLng != null && query.maxLng != null
      ? { minLat: query.minLat, maxLat: query.maxLat, minLng: query.minLng, maxLng: query.maxLng }
      : undefined;

  const types = new Set(query.objectTypes);
  const result: RetrievalResult = {
    events: [],
    episodes: [],
    places: [],
    actors: [],
    claims: [],
    meta: { totalEvents: 0, totalEpisodes: 0, totalPlaces: 0, totalActors: 0 },
  };

  if (types.has('events')) {
    const eventFilter: Parameters<typeof listEvents>[1] = {
      from_date: fromDate,
      to_date: toDate,
      place_id: query.placeId,
      bbox,
      limit: query.q ? limit : limit,
      offset: query.offset,
    };
    const eventsOut = query.q
      ? await searchEvents(client, query.q, limit)
      : await listEvents(client, { ...eventFilter, limit });
    const events = eventsOut.events;
    if (events.length > 0) {
      const sourceCounts = await client.query<{ event_id: string; count: string }>(
        `SELECT event_id, COUNT(*)::int::text as count
         FROM event_observation WHERE event_id = ANY($1::uuid[])
         GROUP BY event_id`,
        [events.map((e) => e.id)]
      );
      const countMap = new Map(sourceCounts.rows.map((r) => [r.event_id, parseInt(r.count, 10)]));
      const withCounts = events.map((e) => ({
        ...e,
        sourceCount: countMap.get(e.id) ?? 1,
      }));
      const reranked = rerankEvents(
        withCounts.map((e) => ({ ...e, occurredAt: e.occurred_at, sourceCount: countMap.get(e.id) ?? 1 }))
      ).slice(0, limit);
      result.events = reranked.map((e) => ({
        id: e.id,
        title: e.canonical_title,
        summary: e.canonical_summary,
        occurredAt: e.occurred_at.toISOString(),
        eventType: e.event_type,
        polarity: e.polarity_ui,
        placeId: e.place_id,
        sourceCount: (countMap.get(e.id) ?? 1),
      }));
      result.meta.totalEvents = eventsOut.total;
    }
  }

  if (types.has('episodes')) {
    const { episodes, total } = await listEpisodes(client, {
      fromDate,
      limit: 20,
      offset: query.offset,
    });
    result.episodes = episodes.map((e) => ({
      id: e.id,
      label: e.label,
      summary: e.summary ?? null,
      firstEventAt: e.first_event_at?.toISOString() ?? null,
      lastEventAt: e.last_event_at?.toISOString() ?? null,
    }));
    result.meta.totalEpisodes = total;
  }

  if (types.has('places')) {
    const placeFilter: { q?: string; limit?: number; offset?: number } = {
      limit: 20,
      offset: query.offset,
    };
    if (query.q) placeFilter.q = query.q;
    const { places, total } = await listPlaces(client, placeFilter);
    const withCounts = await Promise.all(
      places.map(async (p) => {
        const r = await client.query<{ count: string }>(
          `SELECT COUNT(*)::int::text as count FROM event WHERE place_id = $1 AND is_active = true`,
          [p.id]
        );
        return { ...p, eventCount: parseInt(r.rows[0]?.count ?? '0', 10) };
      })
    );
    result.places = withCounts.map((p) => ({
      id: p.id,
      namePrimary: p.name_primary,
      placeType: p.place_type,
      eventCount: p.eventCount,
    }));
    result.meta.totalPlaces = total;
  }

  if (types.has('actors')) {
    const actorFilter: { q?: string; limit?: number } = { limit: 20 };
    if (query.q) actorFilter.q = query.q;
    const { entities, total } = await searchEntities(client, actorFilter);
    result.actors = entities.map((e) => ({
      id: e.id,
      name: e.name,
      entityType: e.entity_type ?? 'organization',
    }));
    result.meta.totalActors = total;
  }

  if (result.events.length > 0) {
    const claims = await getClaimsByEventIds(client, result.events.map((e) => e.id));
    result.claims = claims.slice(0, 50).map((c) => ({
      id: c.id,
      eventId: c.event_id,
      text: c.text,
    }));
  }

  return result;
}
