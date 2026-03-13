/**
 * Vitality context pack — bounded facts from vitality read model.
 * Global or place-scoped. No embeddings.
 */

import type { VitalityReadModel } from '@/lib/read-models/vitality';
import type { ContextPack } from '../context-pack';

export function buildVitalityContext(vitality: VitalityReadModel): ContextPack {
  const facts: string[] = [vitality.summary];
  for (const m of vitality.measuredIndicators) {
    facts.push(`${m.label}: ${m.value}${m.unit ? ` ${m.unit}` : ''} (${m.source})`);
  }
  for (const p of vitality.proxyIndicators) {
    if (p.value != null) {
      facts.push(`${p.label}: ${p.value}${p.unit ? ` ${p.unit}` : ''} (${p.source})`);
    }
  }
  for (const n of vitality.narrativeSignals.slice(0, 5)) {
    facts.push(`Rapport: ${n.title}${n.date ? ` (${n.date.slice(0, 10)})` : ''}`);
  }
  for (const e of vitality.supportingEvents.slice(0, 5)) {
    facts.push(`Événement continuité: ${e.title} (${e.occurredAt.slice(0, 10)})`);
  }
  for (const pl of vitality.supportingPlaces.slice(0, 5)) {
    facts.push(`Territoire: ${pl.name}${pl.governorate ? ` (${pl.governorate})` : ''}`);
  }

  const citations: string[] = [];
  for (const e of vitality.supportingEvents) {
    citations.push(`[event:${e.id}]`);
  }
  for (const n of vitality.narrativeSignals) {
    citations.push(`[narrative:${n.id}]`);
  }

  return {
    facts,
    claims: [],
    contradictions: [],
    uncertainInferences: vitality.caveats,
    missingData: vitality.gaps,
    citations: [...new Set(citations)],
  };
}
