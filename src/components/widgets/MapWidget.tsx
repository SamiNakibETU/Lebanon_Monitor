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

/** Custom MapLibre control for layer toggles — uses addControl so buttons are above canvas and receive clicks */
function createLayerControl(
  layers: Record<LayerId, boolean>,
  onToggle: (id: LayerId) => void,
  variant: 'lumiere' | 'ombre'
): maplibregl.IControl {
  return {
    onAdd() {
      const div = document.createElement('div');
      div.className = 'maplibregl-ctrl maplibregl-ctrl-group';
      div.style.cssText = 'margin: 8px; padding: 4px; display: flex; gap: 4px; flex-wrap: wrap;';
      const isDark = variant === 'ombre';
      LAYERS.forEach((id) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = LAYER_LABELS[id];
        btn.dataset.layerId = id;
        btn.style.cssText = `
          padding: 4px 8px;
          font-size: 10px;
          border: 1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
          background: ${layers[id] ? (isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)') : 'transparent'};
          color: ${isDark ? '#fff' : '#1a1a1a'};
          cursor: pointer;
          border-radius: 2px;
        `;
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle(id);
        });
        div.appendChild(btn);
      });
      return div;
    },
    onRemove() {},
  };
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
  const layerControlRef = useRef<maplibregl.IControl | null>(null);
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
    map.on('load', () => setStyleLoaded(true));
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

    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(container);
    return () => ro.disconnect();
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
    if (map.getLayer('events-unclustered')) map.setLayoutProperty('events-unclustered', 'visibility', v('events'));
    if (map.getLayer('conflict-heatmap')) map.setLayoutProperty('conflict-heatmap', 'visibility', v('heatmap'));
    if (map.getLayer('hillshade')) map.setLayoutProperty('hillshade', 'visibility', v('terrain'));
    if (map.getLayer('unifil-fill')) map.setLayoutProperty('unifil-fill', 'visibility', v('unifil'));
    if (map.getLayer('infrastructure-points')) map.setLayoutProperty('infrastructure-points', 'visibility', v('infrastructure'));
  }, [layers, styleLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded || !showLayerToggles) return;
    if (layerControlRef.current) {
      map.removeControl(layerControlRef.current);
      layerControlRef.current = null;
    }
    const ctrl = createLayerControl(layers, toggleLayer, variant);
    map.addControl(ctrl, 'bottom-left');
    layerControlRef.current = ctrl;
    return () => {
      if (layerControlRef.current) {
        try {
          map.removeControl(layerControlRef.current);
        } catch {
          //
        }
        layerControlRef.current = null;
      }
    };
  }, [styleLoaded, showLayerToggles, layers, variant]);

  return (
    <div className={`relative w-full h-full min-h-[200px] ${className}`}>
      <div ref={containerRef} className="absolute inset-0 z-0" />
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
