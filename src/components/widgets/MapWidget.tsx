'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LEBANON_BBOX } from '@/config/lebanon';

/** Use nolabels styles to avoid font loading (Montserrat/Open Sans Bold 404 on demotiles) */
const TILE_STYLES = {
  lumiere: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
  ombre: 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json',
} as const;

const LAYER_LABELS: Record<string, string> = {
  events: 'Events',
  heatmap: 'Heatmap',
  terrain: 'Terrain',
  unifil: 'UNIFIL',
  infrastructure: 'Infrastructure',
};

const LAYERS = ['events', 'heatmap', 'terrain', 'unifil', 'infrastructure'] as const;
type LayerId = (typeof LAYERS)[number];

/** Layer control overlay — pills, no overflow */
function LayerControlOverlay({
  layers,
  onToggle,
  variant,
}: {
  layers: Record<LayerId, boolean>;
  onToggle: (id: LayerId) => void;
  variant: 'lumiere' | 'ombre';
}) {
  const isDark = variant === 'ombre';
  return (
    <div
      className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-1"
      style={{ maxWidth: 'calc(100% - 16px)' }}
    >
      {LAYERS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle(id);
          }}
          className="whitespace-nowrap rounded-sm px-2 py-1 text-[10px] font-medium transition-colors border cursor-pointer"
          style={{
            background: layers[id]
              ? isDark
                ? '#C62828'
                : '#2E7D32'
              : isDark
                ? 'rgba(0,0,0,0.6)'
                : 'rgba(255,255,255,0.7)',
            color: layers[id] ? '#fff' : isDark ? '#ccc' : '#1a1a1a',
            borderColor: 'rgba(128,128,128,0.3)',
          }}
        >
          {LAYER_LABELS[id]}
        </button>
      ))}
    </div>
  );
}

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
  severity?: string;
  occurredAt: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface MapWidgetProps {
  events: MapEvent[];
  variant?: 'lumiere' | 'ombre';
  className?: string;
  showLayerToggles?: boolean;
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

export function MapWidget({
  events,
  variant = 'ombre',
  className = '',
  showLayerToggles = true,
}: MapWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [layers, setLayers] = useState<Record<LayerId, boolean>>({
    events: true,
    heatmap: false,
    terrain: false,
    unifil: false,
    infrastructure: false,
  });

  const toggleLayer = (id: LayerId) => {
    setLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (!containerRef.current) return;
    setLoadError(null);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: TILE_STYLES[variant],
      center: LEBANON_CENTER,
      zoom: 8.2,
      maxBounds: [
        [LEBANON_BBOX.minLng, LEBANON_BBOX.minLat],
        [LEBANON_BBOX.maxLng, LEBANON_BBOX.maxLat],
      ] as [[number, number], [number, number]],
      attributionControl: false,
    });
    map.on('load', () => {
      setStyleLoaded(true);
      map.fitBounds(
        [
          [LEBANON_BBOX.minLng, LEBANON_BBOX.minLat],
          [LEBANON_BBOX.maxLng, LEBANON_BBOX.maxLat],
        ] as [[number, number], [number, number]],
        { padding: 20, maxZoom: 10 }
      );
    });
    map.on('error', (e) => setLoadError(e.error?.message ?? 'Erreur chargement carte'));
    mapRef.current = map;

    return () => {
      const m = mapRef.current;
      if (m) {
        m.remove();
        mapRef.current = null;
      }
      setStyleLoaded(false);
      setLoadError(null);
    };
  }, [variant]);

  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;

    const resize = () => {
      map.resize();
    };
    resize();
    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(container);
    const t1 = setTimeout(resize, 100);
    const t2 = setTimeout(resize, 400);
    return () => {
      ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [styleLoaded]);

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

    const markerColor = variant === 'lumiere' ? '#2E7D32' : '#C62828';
    const clusterColor = variant === 'lumiere' ? '#2E7D32' : '#C62828';

    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'events',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': clusterColor,
        'circle-radius': ['step', ['get', 'point_count'], 8, 10, 12, 30, 16],
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(255,255,255,0.5)',
      },
    });

    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'events',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 11,
      },
      paint: {
        'text-color': '#ffffff',
      },
    });

    map.addLayer({
      id: 'events-unclustered',
      type: 'circle',
      source: 'events',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': markerColor,
        'circle-radius': 6,
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(255,255,255,0.5)',
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

    if (!map.getSource('events-heatmap')) {
      map.addSource('events-heatmap', {
        type: 'geojson',
        data: geojson,
      });
      map.addLayer({
        id: 'conflict-heatmap',
        type: 'heatmap',
        source: 'events-heatmap',
        minzoom: 6,
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': 0.6,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(0,0,0,0)',
            0.2,
            'rgba(198,40,40,0.2)',
            0.4,
            'rgba(198,40,40,0.4)',
            0.6,
            'rgba(198,40,40,0.6)',
            1,
            'rgba(198,40,40,0.9)',
          ],
          'heatmap-radius': 30,
        },
        layout: { visibility: 'none' },
      });
    } else {
      (map.getSource('events-heatmap') as maplibregl.GeoJSONSource).setData(geojson);
    }

    if (!map.getSource('terrain-dem')) {
      try {
        map.addSource('terrain-dem', {
          type: 'raster-dem',
          url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
          tileSize: 256,
        });
        map.addLayer({
          id: 'hillshade',
          type: 'hillshade',
          source: 'terrain-dem',
          paint: {
            'hillshade-shadow-color': '#000000',
            'hillshade-highlight-color': '#ffffff',
            'hillshade-exaggeration': 0.3,
          },
          layout: { visibility: 'none' },
        });
      } catch {
        //
      }
    }

    if (!map.getSource('unifil-zone')) {
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
              'fill-color': variant === 'ombre' ? '#1565C0' : '#42A5F5',
              'fill-opacity': 0.15,
              'fill-outline-color': variant === 'ombre' ? 'rgba(21,101,192,0.5)' : 'rgba(25,118,210,0.5)',
            },
            layout: { visibility: 'none' },
          });
        })
        .catch(() => {});
    }

    if (!map.getSource('infrastructure')) {
      fetch('/data/lebanon-infrastructure.geojson')
        .then((r) => r.json())
        .then((geojson) => {
          if (!mapRef.current || map.getSource('infrastructure')) return;
          map.addSource('infrastructure', { type: 'geojson', data: geojson });
          map.addLayer({
            id: 'infrastructure-points',
            type: 'circle',
            source: 'infrastructure',
            paint: {
              'circle-radius': 6,
              'circle-color': [
                'match',
                ['get', 'type'],
                'airport',
                variant === 'ombre' ? '#9C27B0' : '#7B1FA2',
                'port',
                variant === 'ombre' ? '#009688' : '#00796B',
                'hospital',
                variant === 'ombre' ? '#E53935' : '#C62828',
                'power',
                variant === 'ombre' ? '#FF9800' : '#F57C00',
                '#666666',
              ],
              'circle-stroke-width': 1.5,
              'circle-stroke-color': 'rgba(255,255,255,0.3)',
            },
            layout: { visibility: 'none' },
          });
        })
        .catch(() => {});
    }
  }, [events, styleLoaded, variant]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;
    const v = (id: string) => (layers[id as LayerId] ? 'visible' : 'none');
    if (map.getLayer('clusters')) map.setLayoutProperty('clusters', 'visibility', v('events'));
    if (map.getLayer('cluster-count')) map.setLayoutProperty('cluster-count', 'visibility', v('events'));
    if (map.getLayer('events-unclustered')) map.setLayoutProperty('events-unclustered', 'visibility', v('events'));
    if (map.getLayer('conflict-heatmap')) map.setLayoutProperty('conflict-heatmap', 'visibility', v('heatmap'));
    if (map.getLayer('hillshade')) map.setLayoutProperty('hillshade', 'visibility', v('terrain'));
    if (map.getLayer('unifil-fill')) map.setLayoutProperty('unifil-fill', 'visibility', v('unifil'));
    if (map.getLayer('infrastructure-points')) map.setLayoutProperty('infrastructure-points', 'visibility', v('infrastructure'));
  }, [layers, styleLoaded]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        background: variant === 'ombre' ? '#0A0A0A' : '#E8E6E3',
      }}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 z-[1]"
        style={{ width: '100%', height: '100%' }}
      />
      {showLayerToggles && (
        <LayerControlOverlay layers={layers} onToggle={toggleLayer} variant={variant} />
      )}
      {loadError && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20 px-4 text-center"
          style={{
            background: variant === 'ombre' ? '#0A0A0A' : '#F5F2EE',
            color: variant === 'ombre' ? '#9E9E9E' : '#666666',
            fontSize: 12,
          }}
        >
          Carte indisponible
        </div>
      )}
    </div>
  );
}
