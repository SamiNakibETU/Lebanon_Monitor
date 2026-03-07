/**
 * Core constants for Lebanon Monitor.
 * Bounding box, cities gazetteer, source priorities.
 */

export const LEBANON_BBOX = {
  north: 34.69,
  south: 33.05,
  east: 36.62,
  west: 35.1,
  minLat: 33.05,
  maxLat: 34.69,
  minLng: 35.1,
  maxLng: 36.62,
} as const;

export const LEBANON_CENTER = { lat: 33.8938, lng: 35.5018 } as const;

export const CITIES: Record<string, { lat: number; lng: number }> = {
  beirut: { lat: 33.8938, lng: 35.5018 },
  beyrouth: { lat: 33.8938, lng: 35.5018 },
  'بيروت': { lat: 33.8938, lng: 35.5018 },
  tripoli: { lat: 34.4332, lng: 35.8498 },
  'طرابلس': { lat: 34.4332, lng: 35.8498 },
  sidon: { lat: 33.5571, lng: 35.3729 },
  saida: { lat: 33.5571, lng: 35.3729 },
  'صيدا': { lat: 33.5571, lng: 35.3729 },
  tyre: { lat: 33.2705, lng: 35.2038 },
  sour: { lat: 33.2705, lng: 35.2038 },
  'صور': { lat: 33.2705, lng: 35.2038 },
  baalbek: { lat: 34.0047, lng: 36.211 },
  'بعلبك': { lat: 34.0047, lng: 36.211 },
  jounieh: { lat: 33.9808, lng: 35.6178 },
  'جونيه': { lat: 33.9808, lng: 35.6178 },
  zahle: { lat: 33.8463, lng: 35.902 },
  'zahlé': { lat: 33.8463, lng: 35.902 },
  'زحلة': { lat: 33.8463, lng: 35.902 },
  nabatieh: { lat: 33.3779, lng: 35.4839 },
  'النبطية': { lat: 33.3779, lng: 35.4839 },
  byblos: { lat: 34.1236, lng: 35.6511 },
  jbeil: { lat: 34.1236, lng: 35.6511 },
  'جبيل': { lat: 34.1236, lng: 35.6511 },
  dahieh: { lat: 33.8547, lng: 35.5024 },
  dahiyeh: { lat: 33.8547, lng: 35.5024 },
  'الضاحية': { lat: 33.8547, lng: 35.5024 },
  'south lebanon': { lat: 33.27, lng: 35.4 },
  'sud-liban': { lat: 33.27, lng: 35.4 },
  'جنوب لبنان': { lat: 33.27, lng: 35.4 },
  bekaa: { lat: 33.85, lng: 36.0 },
  'البقاع': { lat: 33.85, lng: 36.0 },
  akkar: { lat: 34.55, lng: 36.1 },
  'عكار': { lat: 34.55, lng: 36.1 },
};

export const SOURCE_PRIORITY: Record<string, number> = {
  acled: 11,
  ucdp: 11,
  usgs: 10,
  firms: 10,
  gdacs: 10,
  cloudflare: 9,
  rss: 8,
  reliefweb: 8,
  gdelt: 7,
  'lbp-rate': 7,
  openaq: 6,
  weather: 5,
  twitter: 4,
};

export const EVENT_SOURCES: string[] = [
  'gdelt',
  'usgs',
  'firms',
  'rss',
  'gdacs',
  'reliefweb',
  'twitter',
  'cloudflare',
];

export const INDICATOR_SOURCES: string[] = ['weather', 'lbp-rate', 'openaq'];
