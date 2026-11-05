import {
  LngLatBounds,
  Map as MapLibreMap,
  setWorkerUrl,
  type GeoJSONSource,
  type MapLayerMouseEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre sucht den Worker neben seiner eigenen Datei; nach dem Bündeln durch Vite liegt er
// dort nicht. Deshalb den Worker als Asset einbinden und die URL explizit setzen.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
// Typen kommen mit maplibre-gl (@types/geojson).
import type { FeatureCollection } from 'geojson';
import type { Resort } from '../data/resort.ts';
import { formatKm } from '../logic/format.ts';

setWorkerUrl(workerUrl);

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const SOURCE_ID = 'resorts';
const COLORS = { neutral: '#8e8e93', wrong: '#ff3b30', correct: '#34c759' } as const;

export type MarkerState = 'neutral' | 'wrong' | 'correct';

/** Zustand eines getippten oder aufgedeckten Gebiets auf der Karte. */
export interface MarkedResort {
  id: string;
  state: Exclude<MarkerState, 'neutral'>;
  /** Entfernung zur Lösung, nur bei falschen Tipps angezeigt. */
  distanceKm?: number;
}

export interface ResortMapOptions {
  resorts: readonly Resort[];
  /** Klick auf ein Gebiet (Punkt oder Name). */
  onResortClick?: (resort: Resort) => void;
  /** Startansicht: Weltkarte oder auf ein Gebiet gezoomt. */
  focus?: Resort;
}

export interface ResortMap {
  setMarked(marked: readonly MarkedResort[]): void;
  /** Ausschnitt so wählen, dass alle angegebenen Gebiete sichtbar sind. */
  fitTo(resorts: readonly Resort[]): void;
  destroy(): void;
}

function toGeoJson(resorts: readonly Resort[], marked: readonly MarkedResort[]): FeatureCollection {
  const byId = new Map(marked.map((m) => [m.id, m]));
  return {
    type: 'FeatureCollection',
    features: resorts.map((r) => {
      const m = byId.get(r.id);
      const state: MarkerState = m?.state ?? 'neutral';
      const label = m?.state === 'wrong' && m.distanceKm !== undefined ? `${r.name} · ${formatKm(m.distanceKm)}` : r.name;
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.lon, r.lat] },
        properties: { id: r.id, state, label },
      };
    }),
  };
}

const colorByState = ['match', ['get', 'state'], 'wrong', COLORS.wrong, 'correct', COLORS.correct, COLORS.neutral] as const;

export function createResortMap(container: HTMLElement, options: ResortMapOptions): ResortMap {
  const { resorts, onResortClick, focus } = options;
  let marked: readonly MarkedResort[] = [];
  let loaded = false;
  let pendingFit: readonly Resort[] | null = null;

  const map = new MapLibreMap({
    container,
    style: STYLE_URL,
    center: focus ? [focus.lon, focus.lat] : [10, 30],
    zoom: focus ? 8 : 0.6,
    renderWorldCopies: false,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    attributionControl: { compact: false, customAttribution: '© OpenStreetMap contributors' },
  });
  map.touchZoomRotate.disableRotation();

  map.on('load', () => {
    map.addSource(SOURCE_ID, { type: 'geojson', data: toGeoJson(resorts, marked) });
    map.addLayer({
      id: 'resort-dots',
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-color': colorByState as never,
        'circle-radius': ['match', ['get', 'state'], 'neutral', 4, 6],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
      },
    });
    const labelLayout = {
      'text-field': ['get', 'label'],
      'text-size': 12,
      'text-anchor': 'left',
      'text-offset': [0.8, 0],
      'text-optional': true,
    } as const;
    // Nicht getippte Namen weichen einander aus, getippte werden immer gezeigt.
    map.addLayer({
      id: 'resort-labels',
      type: 'symbol',
      source: SOURCE_ID,
      filter: ['==', ['get', 'state'], 'neutral'],
      layout: { ...labelLayout, 'text-font': ['Noto Sans Regular'] } as never,
      paint: { 'text-color': COLORS.neutral, 'text-halo-color': '#ffffff', 'text-halo-width': 1.4 },
    });
    map.addLayer({
      id: 'resort-labels-marked',
      type: 'symbol',
      source: SOURCE_ID,
      filter: ['!=', ['get', 'state'], 'neutral'],
      layout: {
        ...labelLayout,
        'text-font': ['Noto Sans Bold'],
        'text-size': 13,
        // Name und km in einer Zeile halten
        'text-max-width': 40,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      } as never,
      paint: { 'text-color': colorByState as never, 'text-halo-color': '#ffffff', 'text-halo-width': 1.6 },
    });
    loaded = true;
    if (pendingFit) {
      fitTo(pendingFit, false);
      pendingFit = null;
    }
  });

  if (onResortClick) {
    const layers = ['resort-dots', 'resort-labels', 'resort-labels-marked'];
    const handleClick = (event: MapLayerMouseEvent) => {
      const id = event.features?.[0]?.properties?.id;
      const resort = resorts.find((r) => r.id === id);
      if (resort) onResortClick(resort);
    };
    for (const layer of layers) {
      map.on('click', layer, handleClick);
      map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
    }
  }

  function fitTo(targets: readonly Resort[], animate = true): void {
    if (targets.length === 0) return;
    if (!loaded) {
      pendingFit = targets;
      return;
    }
    if (targets.length === 1) {
      const [only] = targets;
      map.easeTo({ center: [only!.lon, only!.lat], zoom: Math.max(map.getZoom(), 4), animate });
      return;
    }
    const bounds = new LngLatBounds();
    for (const r of targets) bounds.extend([r.lon, r.lat]);
    // Rechts mehr Platz, weil die Namen rechts neben den Punkten stehen.
    const width = container.clientWidth;
    const right = Math.min(180, width * 0.4);
    map.fitBounds(bounds, { padding: { top: 50, bottom: 50, left: 40, right }, maxZoom: 7, animate });
  }

  return {
    setMarked(next) {
      marked = next;
      if (loaded) (map.getSource(SOURCE_ID) as GeoJSONSource | undefined)?.setData(toGeoJson(resorts, marked));
    },
    fitTo: (targets) => fitTo(targets),
    destroy: () => map.remove(),
  };
}
