import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

// Con Vite il worker di MapLibre va indicato a mano (il file viene copiato tra gli asset).
maplibregl.setWorkerUrl(workerUrl);
import { icons, type IconName } from '../icons';
import { movitaeMapStyle } from './mapStyle';
import { pinElement } from './ScopriParts';

export type MapPinData = { id: string; lat: number; lng: number; icon: IconName; count?: number; label: string };

const svg = (name: IconName, size: number) =>
  `<svg width="${size}" height="${size}" viewBox="${icons[name].viewBox}" aria-hidden="true">${icons[name].body}</svg>`;

/** Mappa vera (MapLibre GL). I pin sono elementi HTML, così hanno gli stessi stili del componente MapPin. */
export function MapView({ center, pins, selected, onSelect, showUser = true }: {
  center: { lat: number; lng: number };
  pins: MapPinData[];
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  showUser?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!box.current) return;
    const m = new maplibregl.Map({
      container: box.current,
      style: movitaeMapStyle(),
      center: [center.lng, center.lat],
      zoom: 14.6,
      attributionControl: { compact: true },
      pitchWithRotate: false,
      dragRotate: false,
    });
    m.touchZoomRotate.disableRotation();
    map.current = m;
    m.on('click', (e: maplibregl.MapMouseEvent) => { if (!(e.originalEvent.target as HTMLElement).closest('.map-pin')) onSelect?.(null); });
    if (showUser) {
      const dot = document.createElement('div');
      dot.className = 'user-dot';
      new maplibregl.Marker({ element: dot }).setLngLat([center.lng, center.lat]).addTo(m);
    }
    // Chiaro/Scuro: lo stile si ricostruisce con i colori della nuova modalità.
    const obs = new MutationObserver(() => m.setStyle(movitaeMapStyle()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { obs.disconnect(); m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    markers.current.forEach((mk) => mk.remove());
    markers.current = pins.map((p) => {
      const isSel = p.id === selected;
      const el = isSel
        ? pinElement('selected', { icon: p.icon, label: p.label }, svg)
        : p.count && p.count > 1 ? pinElement('group', { count: p.count }, svg) : pinElement('sport', { icon: p.icon }, svg);
      el.setAttribute('aria-label', p.label);
      el.addEventListener('click', (ev) => { ev.stopPropagation(); onSelect?.(p.id); });
      return new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([p.lng, p.lat]).addTo(m);
    });
    if (selected) markers.current.find((_, i) => pins[i].id === selected)?.getElement().style.setProperty('z-index', '5');
  }, [pins, selected, onSelect]);

  return <div ref={box} className="scopri-map" />;
}
