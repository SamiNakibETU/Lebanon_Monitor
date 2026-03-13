/**
 * Place context pack — bounded facts, claims, citations for a place.
 */

import type { PoolClient } from 'pg';
import { getPlaceById, getEventsByPlace, getEpisodesByPlace } from '@/db/repositories/place-repository';
import { getEventsByIds } from '@/db/repositories/event-repository';
import { getEpisodeById } from '@/db/repositories/episode-repository';
import { getClaimsByEventIds } from '@/db/repositories/claim-repository';
import type { ContextPack } from '../context-pack';
import { formatCitation } from '../citations';

export async function buildPlaceContext(
  client: PoolClient,
  placeId: string
): Promise<ContextPack | null> {
  const place = await getPlaceById(client, placeId);
  if (!place) return null;

  const { eventIds, total: eventTotal } = await getEventsByPlace(client, placeId, { limit: 30, offset: 0 });
  const episodes = await getEpisodesByPlace(client, placeId, { limit: 10 });
  const events = eventIds.length > 0 ? await getEventsByIds(client, eventIds) : [];
  const claims = eventIds.length > 0 ? await getClaimsByEventIds(client, eventIds) : [];

  const facts: string[] = [
    `Lieu: ${place.name_primary} (${place.place_type ?? 'lieu'})`,
    `${eventTotal} événements, ${episodes.length} épisodes liés`,
  ];
  const citations: string[] = [formatCitation('place', placeId)];

  for (const e of events.slice(0, 15)) {
    facts.push(`${e.canonical_title} (${e.occurred_at.toISOString().slice(0, 10)})`);
    citations.push(formatCitation('event', e.id));
  }
  for (const ep of episodes) {
    const epDetail = await getEpisodeById(client, ep.episodeId);
    if (epDetail) {
      facts.push(`Épisode: ${epDetail.label ?? ep.episodeId} — ${ep.eventCount} événements`);
      citations.push(formatCitation('episode', ep.episodeId));
    }
  }
  const claimTexts: string[] = [];
  for (const c of claims.slice(0, 20)) {
    claimTexts.push(c.text);
    citations.push(formatCitation('claim', c.id));
  }

  const uncertainInferences: string[] = [];
  const missingData: string[] = [];
  if (eventTotal === 0) missingData.push('Aucun événement lié par place_id — données en backfill.');

  return {
    facts,
    claims: claimTexts,
    contradictions: [],
    uncertainInferences,
    missingData,
    citations: [...new Set(citations)],
  };
}
