/**
 * Lebanon geography and constants for bounding box, cities, etc.
 */

export const LEBANON_BBOX = {
  minLat: 33.05,
  maxLat: 34.69,
  minLng: 35.1,
  maxLng: 36.62,
} as const;

export const LEBANON_CITIES: Record<string, { lat: number; lng: number }> = {
  Beirut: { lat: 33.8938, lng: 35.5018 },
  Tripoli: { lat: 34.4332, lng: 35.8498 },
  Sidon: { lat: 33.5571, lng: 35.3729 },
  Tyre: { lat: 33.2705, lng: 35.2038 },
  Baalbek: { lat: 34.0047, lng: 36.211 },
  Jounieh: { lat: 33.9808, lng: 35.6178 },
};

/** Default coordinates when geolocation is unknown (Beirut center). */
export const DEFAULT_COORDS = LEBANON_CITIES.Beirut;

export const MOHAPHAZATS = [
  'Beirut',
  'Mount Lebanon',
  'North',
  'South',
  'Bekaa',
  'Baalbek-Hermel',
  'Akkar',
  'Nabatieh',
] as const;
