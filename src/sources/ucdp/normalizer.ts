/**
 * UCDP GED events → LebanonEvent.
 */

import type { LebanonEvent } from '@/types/events';
import { UCDP_CONFIG } from './config';
import { LEBANON_BBOX } from '@/config/lebanon';
import type { UCDPEvent } from './types';

function clampLatLng(lat: number | undefined, lng: number | undefined): { lat: number; lng: number } {
  if (lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return {
      lat: Math.max(LEBANON_BBOX.minLat, Math.min(LEBANON_BBOX.maxLat, lat)),
      lng: Math.max(LEBANON_BBOX.minLng, Math.min(LEBANON_BBOX.maxLng, lng)),
    };
  }
  return UCDP_CONFIG.defaultCoords;
}

function mapTypeOfViolence(v?: number): LebanonEvent['category'] {
  if (v === 1) return 'armed_conflict';
  if (v === 2) return 'violence';
  if (v === 3) return 'violence';
  return 'armed_conflict';
}

function wherePrecToGeoPrecision(prec?: number): LebanonEvent['metadata']['geoPrecision'] {
  if (prec == null) return 'unknown';
  if (prec <= 1) return 'exact_point';
  if (prec === 2) return 'city';
  if (prec === 3) return 'district';
  if (prec === 4) return 'governorate';
  return 'country';
}

export function normalize(raw: { Result?: UCDPEvent[] }, fetchedAt: Date): LebanonEvent[] {
  const events: LebanonEvent[] = [];
  const items = raw.Result ?? [];

  for (const item of items) {
    const deaths = item.best ?? ((item.deaths_a ?? 0) + (item.deaths_b ?? 0) + (item.deaths_civilians ?? 0));
    const actors = [item.side_a, item.side_b].filter(Boolean).join(' vs ');
    const where = item.where_description ?? item.where_coordinates ?? item.adm_2 ?? item.adm_1 ?? item.country ?? 'zone inconnue';
    const title = `${actors || item.dyad_name || item.conflict_name || 'Violence'} — ${where}${deaths > 0 ? ` (${deaths} morts)` : ''}`;
    const { lat, lng } = clampLatLng(item.latitude, item.longitude);

    events.push({
      id: `ucdp-${item.id ?? item.relid ?? `${item.date_start}-${where}`}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
      source: 'ucdp',
      title,
      timestamp: item.date_start ? new Date(item.date_start) : fetchedAt,
      latitude: lat,
      longitude: lng,
      classification: 'ombre',
      confidence: 0.98,
      category: mapTypeOfViolence(item.type_of_violence),
      severity: deaths > 10 ? 'critical' : deaths > 0 ? 'high' : 'medium',
      rawData: {
        relid: item.relid,
        conflict_name: item.conflict_name,
        dyad_name: item.dyad_name,
        side_a: item.side_a,
        side_b: item.side_b,
        where_description: item.where_description,
        where_coordinates: item.where_coordinates,
        adm_1: item.adm_1,
        adm_2: item.adm_2,
        source_headline: item.source_headline,
        source_article: item.source_article,
        number_of_sources: item.number_of_sources,
        event_clarity: item.event_clarity,
        type_of_violence: item.type_of_violence,
        deaths_a: item.deaths_a,
        deaths_b: item.deaths_b,
        deaths_civilians: item.deaths_civilians,
        best: item.best,
      },
      metadata: {
        fetchedAt,
        ttlSeconds: UCDP_CONFIG.ttlSeconds,
        sourceReliability: 'high',
        geoPrecision: wherePrecToGeoPrecision(item.where_prec),
        resolvedPlaceName: where,
        admin1: item.adm_1,
        evidence: {
          geocodeMethod: item.where_prec != null ? 'source_exact' : 'admin_fallback',
          geocodeConfidence: item.where_prec != null ? 0.9 : 0.6,
          sourceCount: item.number_of_sources ?? 1,
          verificationLevel: item.event_clarity === 1 ? 'high' : 'medium',
          verificationStatus: 'partially_verified',
        },
      },
    });
  }

  return events;
}
