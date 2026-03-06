'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { LEBANON_BBOX } from '@/config/lebanon';
import type { LebanonEvent } from '@/types/events';

const TILE_LAYERS = {
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
} as const;

interface EventMapProps {
  events: LebanonEvent[];
  selectedId?: string | null;
  theme?: 'light' | 'dark';
  markerColor?: (c: LebanonEvent['classification']) => string;
  showHeatmap?: boolean;
}

const LEBANON_CENTER: [number, number] = [33.87, 35.86];

function defaultClassificationColor(c: LebanonEvent['classification']): string {
  if (c === 'lumiere') return '#4a7c59';
  if (c === 'ombre') return '#8b5a6b';
  return '#737373';
}

export function EventMap({
  events,
  selectedId,
  theme = 'light',
  markerColor = defaultClassificationColor,
  showHeatmap = false,
}: EventMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const heatRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: LEBANON_CENTER,
      zoom: 8,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    L.tileLayer(TILE_LAYERS[theme], {
      attribution: '&copy; OSM, &copy; CARTO',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.fitBounds(
      [
        [LEBANON_BBOX.minLat, LEBANON_BBOX.minLng],
        [LEBANON_BBOX.maxLat, LEBANON_BBOX.maxLng],
      ],
      { padding: [20, 20], maxZoom: 10 }
    );
    map.setMaxBounds([
      [32.5, 34.5],
      [35.2, 37.2],
    ]);
    map.setMinZoom(7);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (heatRef.current) {
      map.removeLayer(heatRef.current);
      heatRef.current = null;
    }

    if (showHeatmap && events.length > 0) {
      const heatPoints: [number, number, number][] = events.map((e) => [
        e.latitude,
        e.longitude,
        0.3,
      ]);
      const heat = (L as unknown as { heatLayer: (pts: [number, number, number][], opts?: object) => L.Layer }).heatLayer(
        heatPoints,
        { radius: 20, blur: 15, max: 0.5 }
      );

      const addHeatWhenReady = (retries = 0) => {
        const container = map.getContainer();
        const w = container?.offsetWidth ?? 0;
        const h = container?.offsetHeight ?? 0;
        if (w > 0 && h > 0) {
          map.invalidateSize();
          setTimeout(() => {
            try {
              heat.addTo(map);
              heatRef.current = heat;
            } catch {
              heatRef.current = null;
            }
          }, 100);
          return;
        }
        if (retries < 30) {
          setTimeout(() => addHeatWhenReady(retries + 1), 100);
        }
      };
      map.whenReady(() => addHeatWhenReady());
    }

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const inLebanon = (lat: number, lng: number) =>
      lat >= LEBANON_BBOX.minLat && lat <= LEBANON_BBOX.maxLat &&
      lng >= LEBANON_BBOX.minLng && lng <= LEBANON_BBOX.maxLng;

    events.filter((e) => inLebanon(e.latitude, e.longitude)).forEach((e) => {
      const marker = L.circleMarker([e.latitude, e.longitude], {
        radius: selectedId === e.id ? 8 : 5,
        fillColor: markerColor(e.classification),
        color: selectedId === e.id ? '#0a0a0a' : 'rgba(0,0,0,0.15)',
        weight: selectedId === e.id ? 2 : 1,
        opacity: 1,
        fillOpacity: 0.85,
      });

      marker.bindTooltip(e.title.slice(0, 50) + (e.title.length > 50 ? '…' : ''), {
        permanent: false,
        direction: 'top',
        className: 'leaflet-tooltip-minimal',
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [events, selectedId, markerColor, showHeatmap]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full min-h-[400px]"
      style={{ background: theme === 'light' ? 'var(--lumiere-bg)' : 'var(--ombre-bg)' }}
    />
  );
}
