/**
 * GDACS API GeoJSON types.
 */

export interface GdacsFeatureProperties {
  alertlevel?: string;
  eventtype?: string;
  name?: string;
  description?: string;
  fromdate?: string;
  todate?: string;
  country?: string;
}

export interface GdacsFeature {
  type: 'Feature';
  properties: GdacsFeatureProperties;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface GdacsResponse {
  type: 'FeatureCollection';
  features: GdacsFeature[];
}
