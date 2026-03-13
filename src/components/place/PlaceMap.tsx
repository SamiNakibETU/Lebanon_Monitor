'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

export interface PlaceMapProps {
  centroid: { lat: number; lng: number } | null;
  placeLabel?: string;
  height?: number;
}

export function PlaceMap({ centroid, placeLabel, height = 200 }: PlaceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || !centroid) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: MAP_STYLE,
      center: [centroid.lng, centroid.lat],
      zoom: 12,
    });

    new maplibregl.Marker({ color: '#C62828' })
      .setLngLat([centroid.lng, centroid.lat])
      .addTo(map);

    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [centroid?.lat, centroid?.lng]);

  if (!centroid) {
    return (
      <div
        className="w-full flex items-center justify-center"
        style={{ height, background: '#0A0A0A', color: '#666666', fontSize: 13 }}
      >
        Pas de coordonnées disponibles
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      {placeLabel && (
        <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: '#666666' }}>
          {placeLabel}
        </div>
      )}
      <div ref={mapRef} className="w-full" style={{ height }} />
    </div>
  );
}
