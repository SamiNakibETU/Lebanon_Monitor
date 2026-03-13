/**
 * Context pack — bounded structure for agent consumption.
 * facts, claims, contradictions, uncertainInferences, missingData, citations.
 */

import type { RetrievalResult } from './search';
import { formatCitation } from './citations';

export interface ContextPack {
  facts: string[];
  claims: string[];
  contradictions: string[];
  uncertainInferences: string[];
  missingData: string[];
  citations: string[];
}

export function buildContextPackFromRetrieval(result: RetrievalResult): ContextPack {
  const facts: string[] = [];
  const claims: string[] = [];
  const citations: string[] = [];

  for (const e of result.events) {
    facts.push(`${e.title} (${e.occurredAt})`);
    citations.push(formatCitation('event', e.id));
  }
  for (const c of result.claims) {
    claims.push(c.text);
    citations.push(formatCitation('claim', c.id));
  }
  for (const ep of result.episodes) {
    facts.push(`Épisode: ${ep.label ?? ep.id} (${ep.lastEventAt ?? '—'}) — ${ep.summary ?? ''}`);
    citations.push(formatCitation('episode', ep.id));
  }
  for (const p of result.places) {
    facts.push(`Lieu: ${p.namePrimary} (${p.eventCount} événements)`);
    citations.push(formatCitation('place', p.id));
  }
  for (const a of result.actors) {
    facts.push(`Acteur: ${a.name} (${a.entityType})`);
    citations.push(formatCitation('actor', a.id));
  }

  const uncertainInferences: string[] = [];
  if (result.events.some((e) => e.sourceCount < 2)) {
    uncertainInferences.push('Certains événements reposent sur une seule source.');
  }
  const missingData: string[] = [];
  if (result.meta.totalEvents === 0 && result.meta.totalEpisodes === 0) {
    missingData.push('Aucun événement ni épisode trouvé pour cette requête.');
  }

  return {
    facts,
    claims,
    contradictions: [],
    uncertainInferences,
    missingData,
    citations: [...new Set(citations)],
  };
}
