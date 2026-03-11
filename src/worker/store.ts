/**
 * Worker store — write event + event_observation to DB.
 */

import { withClient } from '@/db/client';
import { createEvent, updateEventConvergence } from '@/db/repositories/event-repository';
import {
  createEventObservation,
  getObservationCountByEventIds,
} from '@/db/repositories/event-observation-repository';
import type { LebanonEvent } from '@/types/events';
import type { SourceItemRow } from '@/db/types';
import { LEBANON_BBOX } from '@/config/lebanon';

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
  const initialEvidence = {
    primarySource: event.source,
    sourceCount: 1,
    sourceDiversity: 1,
    verificationLevel: 'low',
    verificationStatus: 'unverified',
    geocodeMethod: (event.metadata.geoPrecision && event.metadata.geoPrecision !== 'unknown')
      ? 'gazetteer_match'
      : 'unknown',
    geocodeConfidence: (event.metadata.geoPrecision && event.metadata.geoPrecision !== 'unknown') ? 0.8 : 0.2,
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
      metadata: {
        latitude: lat,
        longitude: lng,
        source: event.source,
        originalSource: sourceItem.source_name,
        geoPrecision: event.metadata.geoPrecision ?? 'unknown',
        resolvedPlaceName: event.metadata.resolvedPlaceName ?? null,
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
  });
}

function mapSeverity(severity: string): number {
  switch (severity) {
    case 'critical': return 1;
    case 'high': return 0.75;
    case 'medium': return 0.5;
    default: return 0.25;
  }
}
