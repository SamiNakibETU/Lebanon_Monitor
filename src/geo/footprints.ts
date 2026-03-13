/**
 * Episode footprints — compute GeoJSON from event points.
 * Phase 3 — union of points -> envelope / polygon.
 */

export interface EventGeoInput {
  metadata?: { latitude?: number; longitude?: number } | null;
  geo_precision?: string | null;
  uncertainty_radius_m?: number | null;
}

/** GeoJSON Feature (Point or Polygon) compatible with MapLibre. */
export type FootprintGeoJSON =
  | { type: 'Feature'; geometry: { type: 'Point'; coordinates: [number, number] }; properties: null }
  | { type: 'Feature'; geometry: { type: 'Polygon'; coordinates: [number, number][][] }; properties: null };

/** Default padding in degrees (~1km at Lebanon latitude) for single-point envelopes. */
const DEFAULT_PADDING_DEG = 0.01;

/** Meters to approximate degrees (at ~33°N: 1° lat ≈ 111km, 1° lng ≈ 91km). */
function metersToDegrees(m: number): number {
  return m / 111_000;
}

/**
 * Extract [lng, lat] from event metadata. GeoJSON uses [longitude, latitude].
 */
function extractPoint(ev: EventGeoInput): [number, number] | null {
  const meta = ev.metadata ?? {};
  const lat = meta.latitude;
  const lng = meta.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lng, lat];
}

/**
 * Compute footprint GeoJSON from events.
 * - 0 points: null
 * - 1 point: Point
 * - 2+ points: Polygon (envelope of all points with padding from max uncertainty)
 */
export function computeFootprintFromEvents(
  events: EventGeoInput[],
  paddingDeg = DEFAULT_PADDING_DEG
): FootprintGeoJSON | null {
  const points: [number, number][] = [];
  let maxUncertaintyDeg = paddingDeg;

  for (const ev of events) {
    const pt = extractPoint(ev);
    if (!pt) continue;
    points.push(pt);
    const unc = ev.uncertainty_radius_m;
    if (typeof unc === 'number' && unc > 0) {
      const deg = metersToDegrees(unc);
      if (deg > maxUncertaintyDeg) maxUncertaintyDeg = deg;
    }
  }

  if (points.length === 0) return null;
  if (points.length === 1) {
    const [lng, lat] = points[0]!;
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: null,
    };
  }

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of points) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  const pad = maxUncertaintyDeg;
  minLng -= pad;
  maxLng += pad;
  minLat -= pad;
  maxLat += pad;

  const ring: [number, number][] = [
    [minLng, minLat],
    [maxLng, minLat],
    [maxLng, maxLat],
    [minLng, maxLat],
    [minLng, minLat],
  ];

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ring],
    },
    properties: null,
  };
}
