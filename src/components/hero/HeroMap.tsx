'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import useSWR from 'swr';
import { scrollToTop } from '@/hooks/useScrollPosition';

const VOYAGER_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const CENTER: [number, number] = [35.5, 33.85];
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [34.0, 32.8],
  [37.0, 35.2],
];

const LAYER_IDS = ['events', 'flights', 'ships', 'fires', 'infra', 'unifil', 'jamming'] as const;
type LayerId = (typeof LAYER_IDS)[number];

interface MapEvent {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
  classification: string;
  title: string;
  source?: string | null;
  occurredAt: string;
}

function toGeoJSON(events: MapEvent[], classification: 'lumiere' | 'ombre'): GeoJSON.FeatureCollection {
  const features = events
    .filter((e) => e.latitude != null && e.longitude != null)
    .filter((e) => {
      const lat = e.latitude!;
      const lng = e.longitude!;
      return lat >= 32.8 && lat <= 35.2 && lng >= 34.0 && lng <= 37.0;
    })
    .map((e) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [e.longitude!, e.latitude!] },
      properties: {
        id: e.id,
        title: e.title,
        classification: e.classification,
        source: e.source ?? '',
        occurredAt: e.occurredAt,
      },
    }));
  return { type: 'FeatureCollection', features };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface HeroMapProps {
  minimized: boolean;
}

export function HeroMap({ minimized }: HeroMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [layers, setLayers] = useState<Record<LayerId, boolean>>({
    events: false,
    flights: false,
    ships: false,
    fires: false,
    infra: false,
    unifil: false,
    jamming: false,
  });

  const { data: lumiereRes } = useSWR<{ data: MapEvent[] }>(
    '/api/v2/events?classification=lumiere&limit=200',
    fetcher,
    { refreshInterval: 60_000 }
  );
  const { data: ombreRes } = useSWR<{ data: MapEvent[] }>(
    '/api/v2/events?classification=ombre&limit=200',
    fetcher,
    { refreshInterval: 60_000 }
  );
  const { data: firmsRes } = useSWR<{ data: MapEvent[] }>(
    '/api/v2/events?source=firms&limit=100',
    fetcher,
    { refreshInterval: 120_000 }
  );
  const { data: flightsGeo } = useSWR<GeoJSON.FeatureCollection>(
    '/api/v2/opensky/positions',
    fetcher,
    { refreshInterval: 15_000 }
  );
  const { data: infraRes } = useSWR<{
    hospitals: Array<{ lat: number; lng: number; name: string }>;
    clinics: Array<{ lat: number; lng: number; name: string }>;
    military: Array<{ lat: number; lng: number; name: string }>;
    airfields: Array<{ lat: number; lng: number; name: string }>;
    power: Array<{ lat: number; lng: number; name: string }>;
    ports: Array<{ lat: number; lng: number; name: string }>;
  }>('/api/v2/infrastructure', fetcher, { refreshInterval: 3600_000 });

  const lumiereEvents = Array.isArray(lumiereRes?.data) ? lumiereRes.data : [];
  const ombreEvents = Array.isArray(ombreRes?.data) ? ombreRes.data : [];
  const lumiereGeo = toGeoJSON(lumiereEvents, 'lumiere');
  const ombreGeo = toGeoJSON(ombreEvents, 'ombre');
  const allEventsGeo: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [...lumiereGeo.features, ...ombreGeo.features],
  };

  const firmsEvents = Array.isArray(firmsRes?.data) ? firmsRes.data : [];
  const firesGeo: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: firmsEvents
      .filter((e) => e.latitude != null && e.longitude != null)
      .map((e) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [e.longitude!, e.latitude!] },
        properties: { id: e.id, title: e.title },
      })),
  };

  const flightsGeoData = flightsGeo ?? { type: 'FeatureCollection' as const, features: [] };

  const infrastructureGeo: GeoJSON.FeatureCollection = (() => {
    if (!infraRes) return { type: 'FeatureCollection', features: [] };
    const types = ['hospitals', 'clinics', 'military', 'airfields', 'power', 'ports'] as const;
    const features: GeoJSON.Feature[] = [];
    for (const t of types) {
      const arr = infraRes[t] ?? [];
      for (const p of arr) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
          properties: { name: p.name, type: t },
        });
      }
    }
    return { type: 'FeatureCollection', features };
  })();

  const toggleLayer = useCallback((id: LayerId) => {
    setLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: VOYAGER_STYLE,
      center: CENTER,
      zoom: 8.2,
      maxBounds: MAX_BOUNDS,
      attributionControl: false,
    });

    map.on('load', () => setStyleLoaded(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setStyleLoaded(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;

    const resize = () => map.resize();
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [styleLoaded, minimized]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    if (!map.getSource('heatmap-lumiere')) {
      map.addSource('heatmap-lumiere', { type: 'geojson', data: lumiereGeo });
      map.addLayer({
        id: 'heatmap-lumiere-layer',
        type: 'heatmap',
        source: 'heatmap-lumiere',
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': 0.8,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0,0,0,0)',
            0.3,
            'rgba(46,125,50,0.15)',
            0.6,
            'rgba(46,125,50,0.35)',
            1,
            'rgba(165,214,167,0.6)',
          ],
          'heatmap-radius': 35,
        },
      });
    } else {
      (map.getSource('heatmap-lumiere') as maplibregl.GeoJSONSource).setData(lumiereGeo);
    }

    if (!map.getSource('heatmap-ombre')) {
      map.addSource('heatmap-ombre', { type: 'geojson', data: ombreGeo });
      map.addLayer({
        id: 'heatmap-ombre-layer',
        type: 'heatmap',
        source: 'heatmap-ombre',
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': 0.8,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0,0,0,0)',
            0.3,
            'rgba(198,40,40,0.15)',
            0.6,
            'rgba(198,40,40,0.35)',
            1,
            'rgba(239,154,154,0.6)',
          ],
          'heatmap-radius': 35,
        },
      });
    } else {
      (map.getSource('heatmap-ombre') as maplibregl.GeoJSONSource).setData(ombreGeo);
    }

    if (!map.getSource('events-points')) {
      map.addSource('events-points', {
        type: 'geojson',
        data: allEventsGeo,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });
      map.addLayer({
        id: 'events-clusters',
        type: 'circle',
        source: 'events-points',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#666666',
          'circle-radius': ['step', ['get', 'point_count'], 6, 10, 8, 30, 12, 100, 16],
          'circle-opacity': 0.8,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(255,255,255,0.3)',
        },
        layout: { visibility: 'none' },
      });
      map.addLayer({
        id: 'events-unclustered',
        type: 'circle',
        source: 'events-points',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'classification'],
            'lumiere',
            '#2E7D32',
            '#C62828',
          ],
          'circle-radius': 5,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(255,255,255,0.3)',
        },
        layout: { visibility: 'none' },
      });
    } else {
      (map.getSource('events-points') as maplibregl.GeoJSONSource).setData(allEventsGeo);
    }

    fetch('/data/unifil-zone.geojson')
      .then((r) => r.json())
      .then((geojson) => {
        if (!mapRef.current || map.getSource('unifil-zone')) return;
        map.addSource('unifil-zone', { type: 'geojson', data: geojson });
        map.addLayer({
          id: 'unifil-fill',
          type: 'fill',
          source: 'unifil-zone',
          paint: {
            'fill-color': '#1565C0',
            'fill-opacity': 0.15,
            'fill-outline-color': 'rgba(21,101,192,0.5)',
          },
          layout: { visibility: 'none' },
        });
      })
      .catch(() => {});

    if (!map.getSource('infrastructure')) {
      map.addSource('infrastructure', { type: 'geojson', data: infrastructureGeo });
      map.addLayer({
        id: 'infrastructure-points',
        type: 'circle',
        source: 'infrastructure',
        paint: {
          'circle-radius': 5,
          'circle-color': '#666666',
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(255,255,255,0.3)',
        },
        layout: { visibility: 'none' },
      });
    } else {
      (map.getSource('infrastructure') as maplibregl.GeoJSONSource).setData(infrastructureGeo);
    }

    if (!map.getSource('flights')) {
      map.addSource('flights', { type: 'geojson', data: flightsGeoData });
      map.addLayer({
        id: 'flights-points',
        type: 'circle',
        source: 'flights',
        paint: {
          'circle-radius': 4,
          'circle-color': [
            'case',
            ['<', ['get', 'nic'], 5],
            '#C62828',
            '#2E7D32',
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(255,255,255,0.3)',
        },
        layout: { visibility: 'none' },
      });
      map.addLayer({
        id: 'jamming-points',
        type: 'circle',
        source: 'flights',
        filter: ['<', ['get', 'nic'], 5],
        paint: {
          'circle-radius': 6,
          'circle-color': '#C62828',
          'circle-opacity': 0.8,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(255,255,255,0.5)',
        },
        layout: { visibility: 'none' },
      });
    } else {
      (map.getSource('flights') as maplibregl.GeoJSONSource).setData(flightsGeoData);
    }

    if (!map.getSource('fires')) {
      map.addSource('fires', { type: 'geojson', data: firesGeo });
      map.addLayer({
        id: 'fires-points',
        type: 'circle',
        source: 'fires',
        paint: {
          'circle-radius': 6,
          'circle-color': '#E65100',
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(255,255,255,0.4)',
        },
        layout: { visibility: 'none' },
      });
    } else {
      (map.getSource('fires') as maplibregl.GeoJSONSource).setData(firesGeo);
    }
  }, [styleLoaded, lumiereGeo, ombreGeo, allEventsGeo, firesGeo, flightsGeoData, infrastructureGeo]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;
    const v = (id: string) => (layers[id as LayerId] ? 'visible' : 'none');
    if (map.getLayer('events-clusters')) map.setLayoutProperty('events-clusters', 'visibility', v('events'));
    if (map.getLayer('events-unclustered')) map.setLayoutProperty('events-unclustered', 'visibility', v('events'));
    if (map.getLayer('flights-points')) map.setLayoutProperty('flights-points', 'visibility', v('flights'));
    if (map.getLayer('jamming-points')) map.setLayoutProperty('jamming-points', 'visibility', v('jamming'));
    if (map.getLayer('fires-points')) map.setLayoutProperty('fires-points', 'visibility', v('fires'));
    if (map.getLayer('unifil-fill')) map.setLayoutProperty('unifil-fill', 'visibility', v('unifil'));
    if (map.getLayer('infrastructure-points'))
      map.setLayoutProperty('infrastructure-points', 'visibility', v('infra'));
  }, [layers, styleLoaded]);

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => minimized && (e.key === 'Enter' || e.key === ' ') && scrollToTop()}
      onClick={minimized ? scrollToTop : undefined}
      className="overflow-hidden"
      style={{
        position: minimized ? 'fixed' : 'relative',
        top: minimized ? 60 : undefined,
        right: minimized ? 16 : undefined,
        width: minimized ? 280 : '100%',
        height: minimized ? 200 : 'calc(100vh - 48px)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: minimized ? '0 2px 12px rgba(0,0,0,0.15)' : undefined,
        cursor: minimized ? 'pointer' : undefined,
        zIndex: minimized ? 40 : 1,
      }}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full hero-heatmap-pulse"
      />
      <div
        className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-1"
        style={{ maxWidth: 'calc(100% - 16px)' }}
      >
        {LAYER_IDS.map((id) => (
          <button
            key={id}
            type="button"
            title={id === 'ships' ? 'Données navires à venir' : undefined}
            onClick={(e) => {
              e.stopPropagation();
              if (id !== 'ships') toggleLayer(id);
            }}
            className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider border cursor-pointer transition-colors"
            style={{
              background: 'transparent',
              color: layers[id] ? '#1A1A1A' : 'rgba(0,0,0,0.6)',
              borderColor: layers[id] ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)',
              opacity: id === 'ships' ? 0.6 : 1,
            }}
          >
            {id}
          </button>
        ))}
      </div>
    </div>
  );
}
