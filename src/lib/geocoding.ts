/**
 * Geocoding utilities: jitter for events without precise location.
 * Adds deterministic offset so multiple events don't stack at exact same point.
 */

export interface Coords {
  lat: number;
  lng: number;
}

/** Deterministic hash from string seed (simple djb2). */
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return h >>> 0;
}

/**
 * Adds small deterministic jitter to coords so markers don't overlap.
 * Jitter radius ~0.02° (~2 km) within bbox.
 */
export function addJitter(base: Coords, seed: string, radiusDeg = 0.012): Coords {
  const h = hashStr(seed);
  const a = ((h % 360) / 360) * 2 * Math.PI;
  const r = ((h >> 8) % 100) / 100 * radiusDeg;
  return {
    lat: base.lat + Math.cos(a) * r,
    lng: base.lng + Math.sin(a) * r,
  };
}
