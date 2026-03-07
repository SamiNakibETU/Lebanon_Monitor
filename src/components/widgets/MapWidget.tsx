'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LEBANON_BBOX } from '@/config/lebanon';

const TILE_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
const LEBANON_CENTER: [number, number] = [35.5, 33.85];

interface MapEvent {
  id: string;
  title: string;
  classification: string;
  source?: string | null;
  occurredAt: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface MapWidgetProps {
  events: MapEvent[];
  className?: string;
}

function toGeoJSON(evts: MapEvent[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = evts
    .filter((e) => e.latitude != null && e.longitude != null)
    .filter((e) => {
      const lat = e.latitude!;
      const lng = e.longitude!;
      return lat >= LEBANON_BBOX.minLat && lat <= LEBANON_BBOX.maxLat
        && lng >= LEBANON_BBOX.minLng && lng <= LEBANON_BBOX.maxLng;
    })
    .map((e) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [e.longitude!, e.latitude!],
      },
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

export function MapWidget({ events, className = '' }: MapWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: TILE_STYLE,
      center: LEBANON_CENTER,
      zoom: 8.2,
      maxBounds: [
        [LEBANON_BBOX.minLng, LEBANON_BBOX.minLat],
        [LEBANON_BBOX.maxLng, LEBANON_BBOX.maxLat],
      ] as [[number, number], [number, number]],
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
    if (!map || !styleLoaded) return;

    const geojson = toGeoJSON(events);

    if (map.getSource('events')) {
      (map.getSource('events') as maplibregl.GeoJSONSource).setData(geojson);
      return;
    }

    map.addSource('events', {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'events',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 30, '#f28cb1'],
        'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 30, 25],
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(255,255,255,0.2)',
      },
    });

    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'events',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12,
      },
      paint: {
        'text-color': '#0a0a0a',
      },
    });

    map.addLayer({
      id: 'events-unclustered',
      type: 'circle',
      source: 'events',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match',
          ['get', 'classification'],
          'ombre',
          '#E53935',
          'lumiere',
          '#43A047',
          '#666666',
        ],
        'circle-radius': 6,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': 'rgba(255,255,255,0.2)',
      },
    });

    map.on('click', 'events-unclustered', (e) => {
      const props = e.features?.[0]?.properties;
      if (!props) return;
      new maplibregl.Popup({
        className: 'dark-popup',
        offset: 10,
        closeButton: false,
      })
        .setLngLat(e.lngLat)
        .setHTML(
          `<div class="p-3 max-w-xs">
            <div class="text-[10px] text-zinc-500 uppercase">${escapeHtml(String(props.source))} · ${new Date(props.occurredAt).toLocaleString()}</div>
            <div class="text-sm text-white mt-1">${escapeHtml(String(props.title).slice(0, 120))}${String(props.title).length > 120 ? '…' : ''}</div>
          </div>`
        )
        .addTo(map);
    });

    map.on('mouseenter', 'events-unclustered', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'events-unclustered', () => {
      map.getCanvas().style.cursor = '';
    });
  }, [events, styleLoaded]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[200px] overflow-hidden ${className}`}
    />
  );
}
