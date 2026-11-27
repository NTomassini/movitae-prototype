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
    return () => { obs.disconnect(); m.remove(); map.current = null; live.current.clear(); first.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Q68–Q69 (27 nov): i pin restano gli stessi elementi tra un aggiornamento e l'altro. Il pin scelto si trasforma
  // in capsula con una molla; con un filtro nuovo i pin nuovi compaiono uno dopo l'altro (in tutto 0,3 s) e quelli
  // tolti svaniscono. Il marker di MapLibre è un involucro (la sua posizione è una transform): le animazioni stanno
  // sul pin dentro.
  const onSel = useRef(onSelect);
  onSel.current = onSelect;
  const live = useRef(new Map<string, { marker: maplibregl.Marker; pin: HTMLElement; kind: string }>());
  const first = useRef(true);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const kindOf = (p: MapPinData) => (p.id === selected ? 'selected' : p.count && p.count > 1 ? 'group' : 'sport');
    const build = (p: MapPinData, kind: string) => kind === 'selected'
      ? pinElement('selected', { icon: p.icon, label: p.label }, svg)
      : kind === 'group' ? pinElement('group', { count: p.count }, svg) : pinElement('sport', { icon: p.icon }, svg);
    const ids = new Set(pins.map((p) => p.id));
    // tolti: svaniscono, poi escono dalla mappa
    live.current.forEach((v, id) => {
      if (ids.has(id)) return;
      live.current.delete(id);
      v.pin.classList.add('is-leaving');
      setTimeout(() => v.marker.remove(), 200);
    });
    const fresh = pins.filter((p) => !live.current.has(p.id));
    pins.forEach((p) => {
      const kind = kindOf(p);
      const cur = live.current.get(p.id);
      if (cur) {
        if (cur.kind !== kind) { // da cerchio a capsula (o indietro): stesso marker, pin nuovo che cresce dal vecchio
          const pin = build(p, kind);
          pin.setAttribute('aria-label', p.label);
          pin.classList.add('is-morph');
          cur.marker.getElement().replaceChildren(pin);
          cur.pin = pin; cur.kind = kind;
        }
        cur.marker.getElement().style.zIndex = kind === 'selected' ? '5' : '';
        return;
      }
      const wrap = document.createElement('div');
      const pin = build(p, kind);
      pin.setAttribute('aria-label', p.label);
      if (!first.current) {
        pin.classList.add('is-entering');
        pin.style.animationDelay = `${(fresh.indexOf(p) * 0.3) / Math.max(fresh.length, 1)}s`;
      }
      wrap.appendChild(pin);
      wrap.addEventListener('click', (ev) => { ev.stopPropagation(); onSel.current?.(p.id); });
      if (kind === 'selected') wrap.style.zIndex = '5';
      const marker = new maplibregl.Marker({ element: wrap, anchor: 'center' }).setLngLat([p.lng, p.lat]).addTo(m);
      live.current.set(p.id, { marker, pin, kind });
    });
    first.current = false;
  }, [pins, selected]);

  // Q69: toccato un pin (o aperta una scheda), la mappa scivola per metterlo al centro dello spazio libero sopra lo sheet
  const lastSel = useRef<string | null>(null);
  useEffect(() => {
    const m = map.current;
    if (!m || !selected || selected === lastSel.current) { lastSel.current = selected ?? null; return; }
    lastSel.current = selected;
    const p = pins.find((x) => x.id === selected);
    if (!p) return;
    const t = setTimeout(() => {
      const h = box.current?.clientHeight ?? 874;
      const venue = document.querySelector('.venue-sheet');
      const list = document.querySelector<HTMLElement>('.list-sheet');
      const sheetTop = venue ? Math.max(h - 482, 54) : list && list.getBoundingClientRect().top < h ? list.getBoundingClientRect().top - (box.current?.getBoundingClientRect().top ?? 0) : h;
      const freeTop = 116; // sotto la ricerca
      const target = (freeTop + sheetTop) / 2;
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      m.easeTo({ center: [p.lng, p.lat], offset: [0, target - h / 2], duration: reduce ? 0 : 550, easing: (x) => 1 - Math.pow(1 - x, 3) });
    }, 80);
    return () => clearTimeout(t);
  }, [selected, pins]);

  return <div ref={box} className="scopri-map" />;
}
