/**
 * Episode context pack — bounded facts, claims for an episode.
 */

import type { PoolClient } from 'pg';
import { getEpisodeById, getEpisodeEventIds } from '@/db/repositories/episode-repository';
import { getEventsByIds } from '@/db/repositories/event-repository';
import { getClaimsByEventIds } from '@/db/repositories/claim-repository';
import type { ContextPack } from '../context-pack';
import { formatCitation } from '../citations';

export async function buildEpisodeContext(
  client: PoolClient,
  episodeId: string
): Promise<ContextPack | null> {
  const episode = await getEpisodeById(client, episodeId);
  if (!episode) return null;

  const eventIds = await getEpisodeEventIds(client, episodeId);
  const events = eventIds.length > 0 ? await getEventsByIds(client, eventIds) : [];
  const claims = eventIds.length > 0 ? await getClaimsByEventIds(client, eventIds) : [];

  const facts: string[] = [
    `Épisode: ${episode.label ?? episodeId} (${episode.status ?? 'open'})`,
    `${episode.event_count ?? events.length} événements`,
    episode.summary ? `Résumé: ${episode.summary}` : '',
  ].filter(Boolean);
  const citations: string[] = [formatCitation('episode', episodeId)];

  for (const e of events) {
    facts.push(`${e.canonical_title} (${e.occurred_at.toISOString().slice(0, 10)})`);
    citations.push(formatCitation('event', e.id));
  }
  const claimTexts: string[] = [];
  for (const c of claims.slice(0, 20)) {
    claimTexts.push(c.text);
    citations.push(formatCitation('claim', c.id));
  }

  const uncertainInferences: string[] = [];
  const missingData: string[] = [];
  if (events.length === 0) missingData.push('Aucun événement lié à cet épisode.');

  return {
    facts,
    claims: claimTexts,
    contradictions: [],
    uncertainInferences,
    missingData,
    citations: [...new Set(citations)],
  };
}
