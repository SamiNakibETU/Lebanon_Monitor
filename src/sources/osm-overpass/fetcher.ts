/**
 * OSM Overpass API — récupère hôpitaux, bases militaires, ports, etc. au Liban.
 */

import { fetchWithTimeout } from '@/lib/fetcher';
import { logger } from '@/lib/logger';
import { OVERPASS_QUERIES, OSM_OVERPASS_API } from './config';
import type { OverpassResponse } from './types';

const SOURCE = 'osm-overpass';

export interface InfrastructureResult {
  hospitals: Array<{ id: string; name: string; lat: number; lng: number; tags?: Record<string, string> }>;
  clinics: Array<{ id: string; name: string; lat: number; lng: number; tags?: Record<string, string> }>;
  military: Array<{ id: string; name: string; lat: number; lng: number; tags?: Record<string, string> }>;
  airfields: Array<{ id: string; name: string; lat: number; lng: number; tags?: Record<string, string> }>;
  power: Array<{ id: string; name: string; lat: number; lng: number; tags?: Record<string, string> }>;
  ports: Array<{ id: string; name: string; lat: number; lng: number; tags?: Record<string, string> }>;
}

function extractPoints(
  response: OverpassResponse,
  type: keyof InfrastructureResult
): Array<{ id: string; name: string; lat: number; lng: number; tags?: Record<string, string> }> {
  const points: Array<{ id: string; name: string; lat: number; lng: number; tags?: Record<string, string> }> = [];
  for (const el of response.elements ?? []) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat == null || lon == null) continue;
    const name = el.tags?.name ?? el.tags?.int_name ?? `${type}-${el.id}`;
    points.push({
      id: `osm-${type}-${el.type}-${el.id}`,
      name,
      lat,
      lng: lon,
      tags: el.tags,
    });
  }
  return points;
}

export async function fetchOsmInfrastructure(): Promise<
  | { ok: true; data: InfrastructureResult }
  | { ok: false; error: { source: string; message: string } }
> {
  const result: InfrastructureResult = {
    hospitals: [],
    clinics: [],
    military: [],
    airfields: [],
    power: [],
    ports: [],
  };

  for (const [type, query] of Object.entries(OVERPASS_QUERIES)) {
    try {
      const res = await fetchWithTimeout(
        OSM_OVERPASS_API,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
        },
        { timeoutMs: 30_000, source: SOURCE }
      );
      if (!res.ok) continue;
      const response = res.data as Response;
      const text = await response.text();
      const data = JSON.parse(text) as OverpassResponse;
      const key = type as keyof InfrastructureResult;
      const points = extractPoints(data, key);
      result[key] = points;
    } catch (e) {
      logger.warn('OSM Overpass query failed', {
        source: SOURCE,
        type,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const total =
    result.hospitals.length +
    result.clinics.length +
    result.military.length +
    result.airfields.length +
    result.power.length +
    result.ports.length;

  logger.info('OSM infrastructure fetch completed', { source: SOURCE, total });
  return { ok: true, data: result };
}
