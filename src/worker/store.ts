/**
 * Worker store — write event + event_observation to DB.
 */

import { withClient } from '@/db/client';
import { createEvent, updateEventConvergence } from '@/db/repositories/event-repository';
import {
  createEventObservation,
  getObservationCountByEventIds,
} from '@/db/repositories/event-observation-repository';
import {
  upsertEntity,
  linkEventToEntity,
  type EntityType,
} from '@/db/repositories/entity-repository';
import type { PoolClient } from 'pg';
import { createClaim, getClaimsByEventId } from '@/db/repositories/claim-repository';
import { createClaimContradiction } from '@/db/repositories/claim-contradiction-repository';
import type { LebanonEvent } from '@/types/events';
import type { SourceItemRow } from '@/db/types';
import type { ExtractedEntities } from '@/lib/nlp/entity-extract';
import { extractClaims } from '@/core/claims/extract-claims';
import { detectContradictions } from '@/core/claims/detect-contradictions';
import { LEBANON_BBOX } from '@/config/lebanon';

const EVIDENCE_METHOD_TO_GEO: Record<string, 'source_exact' | 'gazetteer' | 'llm' | 'inferred' | 'unknown'> = {
  source_exact: 'source_exact',
  gazetteer_match: 'gazetteer',
  gazetteer: 'gazetteer',
  admin_fallback: 'inferred',
  country_fallback: 'inferred',
  inferred: 'inferred',
  llm: 'llm',
  unknown: 'unknown',
};

function clampCoords(lat: number, lng: number): [number, number] {
  return [
    Math.max(LEBANON_BBOX.minLat, Math.min(LEBANON_BBOX.maxLat, lat)),
    Math.max(LEBANON_BBOX.minLng, Math.min(LEBANON_BBOX.maxLng, lng)),
  ];
}

export async function storeNewEvent(
  sourceItem: SourceItemRow,
  event: LebanonEvent
): Promise<{ eventId: string; title: string; summary?: string }> {
  const [lat, lng] = clampCoords(event.latitude, event.longitude);
  const enrichedEvidence = event.metadata?.evidence && typeof event.metadata.evidence === 'object'
    ? (event.metadata.evidence as Record<string, unknown>)
    : null;
  const geocodeMethodFromEnrichment = typeof enrichedEvidence?.geocodeMethod === 'string'
    ? enrichedEvidence.geocodeMethod
    : null;
  const geocodeConfidenceFromEnrichment = typeof enrichedEvidence?.geocodeConfidence === 'number'
    ? enrichedEvidence.geocodeConfidence
    : null;

  const geoMethod = geocodeMethodFromEnrichment
    ? (EVIDENCE_METHOD_TO_GEO[geocodeMethodFromEnrichment] ?? 'inferred')
    : ((event.metadata.geoPrecision && event.metadata.geoPrecision !== 'unknown') ? 'gazetteer' : 'inferred');

  const initialEvidence = {
    primarySource: event.source,
    sourceCount: 1,
    sourceDiversity: 1,
    verificationLevel: 'low',
    verificationStatus: 'unverified',
    geocodeMethod: geocodeMethodFromEnrichment ?? ((event.metadata.geoPrecision && event.metadata.geoPrecision !== 'unknown')
      ? 'gazetteer_match'
      : 'unknown'),
    geocodeConfidence: geocodeConfidenceFromEnrichment ?? ((event.metadata.geoPrecision && event.metadata.geoPrecision !== 'unknown') ? 0.8 : 0.2),
  };

  const eventRow = await withClient(async (client) => {
    const safeConfidence = typeof event.confidence === 'number' && !Number.isNaN(event.confidence)
      ? Math.max(0, Math.min(1, event.confidence))
      : 0.5;
    const scoredMeta = event.metadata as LebanonEvent['metadata'] & {
      confidenceLumiere?: number;
      impactLumiere?: number;
      verificationStatus?: 'unverified' | 'partially_verified' | 'verified' | 'disputed';
    };
    const ev = await createEvent(client, {
      canonical_title: event.title,
      canonical_summary: event.description ?? null,
      polarity_ui: event.classification,
      confidence_score: safeConfidence,
      severity_score: mapSeverity(event.severity),
      impact_score: typeof scoredMeta.impactLumiere === 'number' ? Math.max(0, Math.min(100, scoredMeta.impactLumiere)) / 100 : null,
      verification_status: scoredMeta.verificationStatus,
      occurred_at: event.timestamp,
      event_type: event.category,
      canonical_source_item_id: sourceItem.id,
      geo_precision: event.metadata.geoPrecision ?? 'unknown',
      geo_method: geoMethod,
      uncertainty_radius_m: (() => {
        const p = event.metadata?.geoPrecision;
        if (!p || p === 'unknown') return null;
        const m: Record<string, number> = { exact_point: 100, neighborhood: 500, city: 2500, district: 5000, governorate: 15000, country: 50000, inferred: 10000 };
        return m[p] ?? null;
      })(),
      metadata: {
        latitude: lat,
        longitude: lng,
        source: event.source,
        originalSource: sourceItem.source_name,
        geoPrecision: event.metadata.geoPrecision ?? 'unknown',
        resolvedPlaceName: event.metadata.resolvedPlaceName ?? null,
        admin1: (event.metadata as { admin1?: string }).admin1 ?? null,
        evidence: initialEvidence,
        confidenceLumiere: scoredMeta.confidenceLumiere ?? null,
        impactLumiere: scoredMeta.impactLumiere ?? null,
        verificationStatus: scoredMeta.verificationStatus ?? null,
      },
    });

    await createEventObservation(client, {
      source_item_id: sourceItem.id,
      event_id: ev.id,
      observed_title: event.title,
      observed_summary: event.description ?? null,
      observed_at: event.timestamp,
      matching_confidence: safeConfidence,
      dedup_reason: 'new',
    });

    const entities = event.metadata?.extractedEntities as ExtractedEntities | undefined;
    if (entities) {
      await persistEntitiesForEvent(client, ev.id, entities);
    }
    const claims = extractClaims(event.title, event.description);
    for (const c of claims) {
      await createClaim(client, {
        event_id: ev.id,
        source_item_id: sourceItem.id,
        text: c.text,
        claim_type: c.type ?? null,
        confidence: c.confidence,
      });
    }
    await persistContradictionsForEvent(client, ev.id);

    return ev;
  });

  return {
    eventId: eventRow.id,
    title: event.title,
    summary: event.description,
  };
}

export async function linkToExistingEvent(
  sourceItem: SourceItemRow,
  eventId: string,
  event: LebanonEvent,
  dedupConfidence: number
): Promise<void> {
  await withClient(async (client) => {
    const obs = await createEventObservation(client, {
      source_item_id: sourceItem.id,
      event_id: eventId,
      observed_title: event.title,
      observed_summary: event.description ?? null,
      observed_at: event.timestamp,
      matching_confidence: dedupConfidence,
      dedup_reason: 'jaccard',
    });
    if (!obs) return;

    const counts = await getObservationCountByEventIds(client, [eventId]);
    const count = counts.get(eventId) ?? 1;
    const diversityRes = await client.query<{ source_diversity: number }>(
      `SELECT COUNT(DISTINCT si.source_name)::int as source_diversity
       FROM event_observation eo
       JOIN source_item si ON si.id = eo.source_item_id
       WHERE eo.event_id = $1`,
      [eventId]
    );
    const sourceDiversity = diversityRes.rows[0]?.source_diversity ?? 1;
    const { rows } = await client.query<{ confidence_score: number | null }>(
      'SELECT confidence_score FROM event WHERE id = $1',
      [eventId]
    );
    const baseConfidence = rows[0]?.confidence_score ?? null;
    await updateEventConvergence(client, eventId, count, baseConfidence);
    const verificationLevel = sourceDiversity >= 3 ? 'high' : sourceDiversity >= 2 ? 'medium' : 'low';
    const verificationStatus = sourceDiversity >= 3 ? 'verified' : sourceDiversity >= 2 ? 'partially_verified' : 'unverified';
    await client.query(
      `UPDATE event
       SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
         'evidence',
         jsonb_build_object(
           'sourceCount', $2::int,
           'sourceDiversity', $3::int,
           'verificationLevel', $4::text,
           'verificationStatus', $5::text
         )
       ),
       updated_at = now()
       WHERE id = $1`,
      [eventId, count, sourceDiversity, verificationLevel, verificationStatus]
    );

    const entities = event.metadata?.extractedEntities as ExtractedEntities | undefined;
    if (entities) {
      await persistEntitiesForEvent(client, eventId, entities);
    }
    const claims = extractClaims(event.title, event.description);
    for (const c of claims) {
      await createClaim(client, {
        event_id: eventId,
        source_item_id: sourceItem.id,
        text: c.text,
        claim_type: c.type ?? null,
        confidence: c.confidence,
      });
    }
    await persistContradictionsForEvent(client, eventId);
  });
}

async function persistEntitiesForEvent(
  client: PoolClient,
  eventId: string,
  entities: ExtractedEntities
): Promise<void> {
  const entries: { name: string; type: EntityType }[] = [];
  for (const n of entities.persons ?? []) {
    if (n?.trim()) entries.push({ name: n.trim(), type: 'person' });
  }
  for (const n of entities.parties ?? []) {
    if (n?.trim()) entries.push({ name: n.trim(), type: 'organization' });
  }
  for (const n of entities.organizations ?? []) {
    if (n?.trim()) entries.push({ name: n.trim(), type: 'organization' });
  }
  for (const n of entities.cities ?? []) {
    if (n?.trim()) entries.push({ name: n.trim(), type: 'place' });
  }
  const seen = new Set<string>();
  for (const { name, type } of entries) {
    const key = `${type}:${name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const entity = await upsertEntity(client, name, type);
    await linkEventToEntity(client, eventId, entity.id, type);
  }
}

async function persistContradictionsForEvent(
  client: PoolClient,
  eventId: string
): Promise<void> {
  const claims = await getClaimsByEventId(client, eventId);
  const forDetection = claims.map((c) => ({
    id: c.id,
    text: c.text,
    claim_type: c.claim_type ?? null,
  }));
  const contradictions = detectContradictions(forDetection);
  for (const d of contradictions) {
    await createClaimContradiction(client, {
      claim_id_a: d.claim_id_a,
      claim_id_b: d.claim_id_b,
      contradiction_type: d.contradiction_type,
    });
  }
}

function mapSeverity(severity: string): number {
  switch (severity) {
    case 'critical': return 1;
    case 'high': return 0.75;
    case 'medium': return 0.5;
    default: return 0.25;
  }
}
