/**
 * Worker store — write event + event_observation to DB.
 */

import { withClient } from '@/db/client';
import { createEvent } from '@/db/repositories/event-repository';
import { createEventObservation } from '@/db/repositories/event-observation-repository';
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

  const eventRow = await withClient(async (client) => {
    const ev = await createEvent(client, {
      canonical_title: event.title,
      canonical_summary: event.description ?? null,
      polarity_ui: event.classification,
      confidence_score: event.confidence,
      severity_score: mapSeverity(event.severity),
      occurred_at: event.timestamp,
      event_type: event.category,
      canonical_source_item_id: sourceItem.id,
      metadata: {
        latitude: lat,
        longitude: lng,
        source: event.source,
      },
    });

    await createEventObservation(client, {
      source_item_id: sourceItem.id,
      event_id: ev.id,
      observed_title: event.title,
      observed_summary: event.description ?? null,
      observed_at: event.timestamp,
      matching_confidence: event.confidence,
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
    await createEventObservation(client, {
      source_item_id: sourceItem.id,
      event_id: eventId,
      observed_title: event.title,
      observed_summary: event.description ?? null,
      observed_at: event.timestamp,
      matching_confidence: dedupConfidence,
      dedup_reason: 'jaccard',
    });
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
