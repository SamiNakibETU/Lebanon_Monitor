/**
 * OSM Overpass API response types.
 */

export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
  bounds?: [number, number, number, number];
}

export interface OverpassResponse {
  version?: number;
  generator?: string;
  elements: OverpassElement[];
}

export interface InfrastructurePoint {
  id: string;
  type: 'hospital' | 'clinic' | 'military' | 'airfield' | 'power' | 'port';
  name: string;
  lat: number;
  lng: number;
  tags?: Record<string, string>;
}
