/**
 * Actor context pack — bounded facts, claims, contradictions for an entity.
 */

import type { PoolClient } from 'pg';
import { getEntityById, getEventsByEntity, getEpisodesByEntity } from '@/db/repositories/entity-repository';
import { getEventsByIds } from '@/db/repositories/event-repository';
import { getEpisodeById } from '@/db/repositories/episode-repository';
import { getClaimsByEventIds } from '@/db/repositories/claim-repository';
import { getContradictionsByEventId } from '@/db/repositories/claim-contradiction-repository';
import type { ContextPack } from '../context-pack';
import { formatCitation } from '../citations';

export async function buildActorContext(
  client: PoolClient,
  entityId: string
): Promise<ContextPack | null> {
  const entity = await getEntityById(client, entityId);
  if (!entity) return null;

  const { eventIds, total: eventTotal } = await getEventsByEntity(client, entityId, { limit: 30, offset: 0 });
  const episodes = await getEpisodesByEntity(client, entityId, { limit: 10 });
  const events = eventIds.length > 0 ? await getEventsByIds(client, eventIds) : [];
  const claims = eventIds.length > 0 ? await getClaimsByEventIds(client, eventIds) : [];

  const contradictions: string[] = [];
  for (const eid of eventIds.slice(0, 10)) {
    const contras = await getContradictionsByEventId(client, eid);
    for (const c of contras) {
      contradictions.push(`Contradiction entre claim ${c.claim_id_a} et ${c.claim_id_b}`);
    }
  }

  const facts: string[] = [
    `Acteur: ${entity.name} (${entity.entity_type ?? 'organization'})`,
    `${eventTotal} événements, ${episodes.length} épisodes liés`,
  ];
  const citations: string[] = [formatCitation('actor', entityId)];

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
  if (eventTotal === 0) missingData.push('Aucun événement lié à cet acteur.');

  return {
    facts,
    claims: claimTexts,
    contradictions,
    uncertainInferences,
    missingData,
    citations: [...new Set(citations)],
  };
}
