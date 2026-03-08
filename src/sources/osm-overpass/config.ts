/**
 * OSM Overpass API — infrastructures au Liban (hôpitaux, bases, ports, etc.).
 */

export const LEBANON_BBOX = { south: 33.0, north: 34.7, west: 35.0, east: 36.7 };

const BBOX = `(${LEBANON_BBOX.south},${LEBANON_BBOX.west},${LEBANON_BBOX.north},${LEBANON_BBOX.east})`;

/** Requêtes Overpass QL pour chaque type d'infrastructure. */
export const OVERPASS_QUERIES = {
  hospitals: `
    [out:json][timeout:25];
    ( node["amenity"="hospital"]${BBOX};
      way["amenity"="hospital"]${BBOX};
    );
    out center;
  `,
  clinics: `
    [out:json][timeout:25];
    ( node["amenity"="clinic"]${BBOX};
      way["amenity"="clinic"]${BBOX};
    );
    out center;
  `,
  military: `
    [out:json][timeout:25];
    ( node["military"]${BBOX};
      way["military"]${BBOX};
    );
    out center;
  `,
  airfields: `
    [out:json][timeout:25];
    ( node["aeroway"]${BBOX};
      way["aeroway"]${BBOX};
    );
    out center;
  `,
  power: `
    [out:json][timeout:25];
    ( node["power"="plant"]${BBOX};
      way["power"="plant"]${BBOX};
    );
    out center;
  `,
  ports: `
    [out:json][timeout:25];
    ( node["harbour"="yes"]${BBOX};
      way["harbour"="yes"]${BBOX};
      node["man_made"="pier"]${BBOX};
      way["man_made"="pier"]${BBOX};
    );
    out center;
  `,
} as const;

export const OSM_OVERPASS_API = 'https://overpass-api.de/api/interpreter';
