/**
 * Agent tools — searchEvents, getEpisode, getClaims, getEntities, getPlace, getVitality, runRetrieval.
 * All tools return bounded data with citations. No autonomous web actions.
 */

import { withClient, isDbConfigured } from '@/db/client';
import { searchEvents } from '@/db/repositories/event-repository';
import { getClaimsByEventIds } from '@/db/repositories/claim-repository';
import { getEntityById, getEntitiesByEventId } from '@/db/repositories/entity-repository';
import { getPlaceById } from '@/db/repositories/place-repository';
import { runRetrieval } from '@/lib/retrieval/search';
import { retrievalQuerySchema, type RetrievalQuery } from '@/lib/retrieval/query-schema';
import { buildPlaceContext } from '@/lib/retrieval/context-packs/place-context';
import { buildActorContext } from '@/lib/retrieval/context-packs/actor-context';
import { buildEpisodeContext } from '@/lib/retrieval/context-packs/episode-context';
import { buildVitalityContext } from '@/lib/retrieval/context-packs/vitality-context';

const MAX_EVENTS = 30;
const MAX_CLAIMS = 50;
const MAX_CONTEXT_CHARS = 50_000;

export interface ToolResult {
  data: unknown;
  citations: string[];
  truncated?: boolean;
}

export async function toolSearchEvents(q: string, limit = 20): Promise<ToolResult> {
  if (!isDbConfigured()) return { data: [], citations: [] };
  const cap = Math.min(limit, MAX_EVENTS);
  const { events } = await withClient((client) =>
    searchEvents(client, q.trim().slice(0, 200), cap)
  );
  const citations = events.map((e) => `[event:${e.id}]`);
  return {
    data: events.map((e) => ({
      id: e.id,
      title: e.canonical_title,
      occurredAt: e.occurred_at.toISOString(),
      eventType: e.event_type,
    })),
    citations,
    truncated: events.length >= cap,
  };
}

export async function toolGetEpisode(episodeId: string): Promise<ToolResult | null> {
  if (!isDbConfigured()) return null;
  const pack = await withClient((client) => buildEpisodeContext(client, episodeId));
  if (!pack) return null;
  return { data: pack.facts, citations: pack.citations };
}

export async function toolGetClaims(eventIds: string[]): Promise<ToolResult> {
  if (!isDbConfigured()) return { data: [], citations: [] };
  const ids = eventIds.slice(0, 20);
  const claims = await withClient((client) => getClaimsByEventIds(client, ids));
  const capped = claims.slice(0, MAX_CLAIMS);
  const citations = capped.map((c) => `[claim:${c.id}]`);
  return {
    data: capped.map((c) => ({ id: c.id, eventId: c.event_id, text: c.text })),
    citations,
    truncated: claims.length > MAX_CLAIMS,
  };
}

export async function toolGetEntities(eventId: string): Promise<ToolResult> {
  if (!isDbConfigured()) return { data: [], citations: [] };
  const entities = await withClient((client) => getEntitiesByEventId(client, eventId));
  const citations = entities.map((e) => `[actor:${e.id}]`);
  return {
    data: entities.map((e) => ({ id: e.id, name: e.name, entityType: e.entity_type })),
    citations,
  };
}

export async function toolGetPlace(placeId: string): Promise<ToolResult | null> {
  if (!isDbConfigured()) return null;
  const pack = await withClient((client) => buildPlaceContext(client, placeId));
  if (!pack) return null;
  const text = JSON.stringify(pack).length;
  return {
    data: pack.facts,
    citations: pack.citations,
    truncated: text > MAX_CONTEXT_CHARS,
  };
}

export async function toolGetVitality(placeId?: string): Promise<ToolResult> {
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const url = placeId
    ? `${BASE}/api/v2/places/${placeId}/vitality`
    : `${BASE}/api/v2/vitality`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) return { data: { summary: 'Vitality data unavailable' }, citations: [] };
  const vitality = (await res.json()) as Parameters<typeof buildVitalityContext>[0];
  const pack = buildVitalityContext(vitality);
  return { data: pack.facts, citations: pack.citations };
}

export async function toolRunRetrieval(query: RetrievalQuery): Promise<ToolResult> {
  if (!isDbConfigured()) return { data: { events: [], episodes: [], places: [], actors: [] }, citations: [] };
  const parsed = retrievalQuerySchema.safeParse({
    ...query,
    limit: Math.min(query.limit ?? 30, MAX_EVENTS),
  });
  const q = parsed.success
    ? { ...parsed.data, objectTypes: [...parsed.data.objectTypes] }
    : { ...query, limit: 30, offset: 0, objectTypes: ['events'] as ('events' | 'episodes' | 'places' | 'actors')[] };
  const result = await withClient((client) => runRetrieval(client, q));
  const citations: string[] = [];
  for (const e of result.events) citations.push(`[event:${e.id}]`);
  for (const ep of result.episodes) citations.push(`[episode:${ep.id}]`);
  for (const p of result.places) citations.push(`[place:${p.id}]`);
  for (const a of result.actors) citations.push(`[actor:${a.id}]`);
  return {
    data: {
      events: result.events.slice(0, 20),
      episodes: result.episodes.slice(0, 10),
      places: result.places.slice(0, 10),
      actors: result.actors.slice(0, 10),
    },
    citations: [...new Set(citations)],
  };
}
