/**
 * Geospatial types for Lebanon Monitor.
 * Phase E — Gazetteer, resolvePlace, geo precision.
 */

export type GeoPrecision =
  | 'exact_point'
  | 'neighborhood'
  | 'city'
  | 'district'
  | 'governorate'
  | 'country'
  | 'inferred'
  | 'unknown';

export type PlaceType = 'country' | 'governorate' | 'district' | 'city' | 'village' | 'neighborhood';

export interface ResolvedPlace {
  lat: number;
  lng: number;
  placeType: PlaceType;
  geoPrecision: GeoPrecision;
  namePrimary: string;
  nameAr?: string;
  nameFr?: string;
  nameEn?: string;
}
