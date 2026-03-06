/**
 * Place resolution from text — alias lookup, returns coords + geo precision.
 * Phase E — resolvePlace with AR/FR/EN support.
 */

import type { ResolvedPlace } from './types';
import type { GeoPrecision } from './types';
import { LEBANON_GAZETTEER } from './gazetteer';

/** Normalize string for lookup: lowercase, trim, collapse spaces. */
function normalizeForLookup(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\u0600-\u06FF\s]/g, '');
}

function geoPrecisionFromPlaceType(placeType: string): GeoPrecision {
  switch (placeType) {
    case 'neighborhood':
      return 'neighborhood';
    case 'city':
      return 'city';
    case 'district':
      return 'district';
    case 'governorate':
      return 'governorate';
    case 'country':
      return 'country';
    default:
      return 'city';
  }
}

/** Lazy-built alias map: normalized string -> GazetteerPlace. */
let aliasMap: Map<string, (typeof LEBANON_GAZETTEER)[0]> | null = null;

function buildAliasMap(): Map<string, (typeof LEBANON_GAZETTEER)[0]> {
  if (aliasMap) return aliasMap;
  aliasMap = new Map();
  for (const place of LEBANON_GAZETTEER) {
    const keys = [
      place.namePrimary,
      place.nameAr,
      place.nameFr,
      place.nameEn,
      ...(place.aliases ?? []),
    ].filter(Boolean) as string[];
    for (const key of keys) {
      const norm = normalizeForLookup(key);
      if (norm && !aliasMap.has(norm)) {
        aliasMap.set(norm, place);
      }
    }
  }
  return aliasMap;
}

/**
 * Resolves a place name (AR/FR/EN) to coordinates and geo precision.
 * Returns null if no match.
 */
export function resolvePlace(query: string): ResolvedPlace | null {
  if (!query?.trim()) return null;
  const map = buildAliasMap();
  const norm = normalizeForLookup(query);
  const place = map.get(norm);
  if (!place) return null;
  return {
    lat: place.lat,
    lng: place.lng,
    placeType: place.placeType,
    geoPrecision: geoPrecisionFromPlaceType(place.placeType),
    namePrimary: place.namePrimary,
    nameAr: place.nameAr,
    nameFr: place.nameFr,
    nameEn: place.nameEn,
  };
}

/**
 * Tries to resolve the first matching place from a list of candidate strings.
 * Useful when extracting cities from entity extraction.
 */
export function resolvePlaceFromCandidates(candidates: string[]): ResolvedPlace | null {
  for (const c of candidates) {
    const r = resolvePlace(c);
    if (r) return r;
  }
  return null;
}
