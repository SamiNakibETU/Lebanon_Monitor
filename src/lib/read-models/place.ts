/**
 * Place read model — normalizes split truth between place table and event metadata.
 * Phase 6 — transitional: place_id is sparse; resolvedPlaceName/admin1 in metadata.
 */

import type { PlaceRow } from '@/db/types';
import type { EventRow } from '@/db/types';

export interface PlaceReadModel {
  id: string;
  label: string;
  namePrimary: string;
  nameAr: string | null;
  nameFr: string | null;
  nameEn: string | null;
  placeType: string | null;
  lat: number | null;
  lng: number | null;
  parentPlaceId: string | null;
  eventCount: number;
  episodeCount: number;
  sourceDiversity: number;
  evidenceNote: 'relational' | 'metadata_only' | 'mixed';
}

/**
 * Build place read model from PlaceRow.
 * Evidence note: relational when place_id is used; metadata_only when inferred from event metadata.
 */
export function buildPlaceReadModel(
  place: PlaceRow,
  stats: { eventCount: number; episodeCount: number; sourceDiversity: number },
  evidenceNote: PlaceReadModel['evidenceNote'] = 'relational'
): PlaceReadModel {
  return {
    id: place.id,
    label: place.name_primary,
    namePrimary: place.name_primary,
    nameAr: place.name_ar,
    nameFr: place.name_fr,
    nameEn: place.name_en,
    placeType: place.place_type,
    lat: place.lat,
    lng: place.lng,
    parentPlaceId: place.parent_place_id,
    eventCount: stats.eventCount,
    episodeCount: stats.episodeCount,
    sourceDiversity: stats.sourceDiversity,
    evidenceNote,
  };
}

/**
 * Infer place-like identity from event metadata when place_id is null.
 * Used for transitional read model when composing events by resolvedPlaceName.
 */
export function inferPlaceFromEventMetadata(ev: EventRow): {
  resolvedPlaceName: string | null;
  admin1: string | null;
} {
  const meta = (ev.metadata ?? {}) as Record<string, unknown>;
  return {
    resolvedPlaceName: (meta.resolvedPlaceName as string | null) ?? null,
    admin1: (meta.admin1 as string | null) ?? null,
  };
}
