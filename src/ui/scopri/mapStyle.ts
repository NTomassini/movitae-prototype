import type { StyleSpecification } from 'maplibre-gl';

/**
 * Stile della mappa Movitae (comportamenti §16): tasselli vettoriali gratuiti OpenFreeMap (dati OpenStreetMap),
 * colori presi dalle variabili map/* di Figma, così cambiano con Chiaro/Scuro.
 */
const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function movitaeMapStyle(): StyleSpecification {
  const land = css('--map-land');
  const water = css('--map-water');
  const park = css('--map-park');
  const road = css('--map-road');
  const minor = css('--map-road-minor');
  const label = css('--map-label');
  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: { omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: '© OpenStreetMap · OpenFreeMap' } },
    layers: [
      { id: 'land', type: 'background', paint: { 'background-color': land } },
      { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': park } },
      { id: 'landcover-grass', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood']]], paint: { 'fill-color': park } },
      { id: 'landuse-park', type: 'fill', source: 'omt', 'source-layer': 'landuse', filter: ['in', ['get', 'class'], ['literal', ['park', 'pitch', 'cemetery', 'stadium']]], paint: { 'fill-color': park } },
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': water } },
      { id: 'river', type: 'line', source: 'omt', 'source-layer': 'waterway', paint: { 'line-color': water, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 2, 16, 10] } },
      { id: 'buildings', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 15, paint: { 'fill-color': minor, 'fill-opacity': 0.35 } },
      {
        id: 'road-minor', type: 'line', source: 'omt', 'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'tertiary', 'path', 'pedestrian']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': minor, 'line-width': ['interpolate', ['linear'], ['zoom'], 13, 1, 17, 6] },
      },
      {
        id: 'road-major', type: 'line', source: 'omt', 'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'trunk', 'motorway']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': road, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 2, 17, 12] },
      },
      {
        id: 'place-label', type: 'symbol', source: 'omt', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['suburb', 'quarter', 'neighbourhood']]],
        layout: { 'text-field': ['upcase', ['coalesce', ['get', 'name:it'], ['get', 'name']]], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-letter-spacing': 0.04 },
        paint: { 'text-color': label, 'text-halo-color': land, 'text-halo-width': 1.2 },
      },
    ],
  };
}
