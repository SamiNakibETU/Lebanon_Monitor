/**
 * Build geoQuality API object from event row and metadata.
 * Aligns metadata.evidence.geocodeMethod with event.geo_method.
 */

import type { EventRow } from '@/db/types';
import type { GeoQuality } from '@/contracts/geo-quality';

const EVIDENCE_METHOD_TO_GEO: Record<string, GeoQuality['method']> = {
  source_exact: 'source_exact',
  gazetteer_match: 'gazetteer',
  gazetteer: 'gazetteer',
  admin_fallback: 'inferred',
  country_fallback: 'inferred',
  inferred: 'inferred',
  llm: 'llm',
  unknown: 'unknown',
};

export function buildGeoQualityFromEvent(event: EventRow): GeoQuality {
  const meta = (event.metadata ?? {}) as Record<string, unknown>;
  const evidence =
    meta.evidence && typeof meta.evidence === 'object'
      ? (meta.evidence as Record<string, unknown>)
      : null;

  const precision = (event.geo_precision ?? (meta.geoPrecision as string | null) ?? 'unknown') as GeoQuality['precision'];
  const methodFromDb = event.geo_method;
  const methodFromEvidence = evidence?.geocodeMethod as string | undefined;
  const method =
    methodFromDb ??
    (methodFromEvidence ? (EVIDENCE_METHOD_TO_GEO[methodFromEvidence] ?? 'unknown') : 'unknown');

  const geocodeConfidence =
    typeof evidence?.geocodeConfidence === 'number' ? evidence.geocodeConfidence : null;

  return {
    precision,
    method,
    uncertaintyRadiusM: event.uncertainty_radius_m ?? null,
    resolvedPlaceName: (meta.resolvedPlaceName as string | null) ?? null,
    admin1: (meta.admin1 as string | null) ?? null,
    geocodeConfidence,
  };
}

export function buildGeoQualityFromEpisode(
  episode: { footprint_geojson: unknown; metadata: Record<string, unknown> | null }
): GeoQuality & { footprintGeojson?: unknown } {
  const meta = (episode.metadata ?? {}) as Record<string, unknown>;
  const resolvedPlaceName =
    typeof meta.resolvedPlaceName === 'string'
      ? meta.resolvedPlaceName
      : typeof meta.placeKey === 'string'
        ? meta.placeKey
        : null;
  const admin1 =
    typeof meta.admin1 === 'string'
      ? meta.admin1
      : typeof meta.governorateKey === 'string'
        ? meta.governorateKey
        : null;
  return {
    precision: 'inferred',
    method: 'inferred',
    uncertaintyRadiusM: null,
    resolvedPlaceName,
    admin1,
    geocodeConfidence: null,
    footprintGeojson: episode.footprint_geojson ?? null,
  };
}
