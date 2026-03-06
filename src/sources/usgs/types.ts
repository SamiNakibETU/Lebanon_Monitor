/**
 * USGS Earthquake API GeoJSON types.
 */

export interface UsgsFeatureProperties {
  mag?: number;
  place?: string;
  time?: number;
  url?: string;
  title?: string;
  type?: string;
  alert?: string | null;
  tsunami?: number;
}

export interface UsgsFeature {
  type: 'Feature';
  properties: UsgsFeatureProperties;
  geometry: {
    type: 'Point';
    coordinates: [number, number, number];
  };
  id?: string;
}

export interface UsgsResponse {
  type: 'FeatureCollection';
  features: UsgsFeature[];
}
