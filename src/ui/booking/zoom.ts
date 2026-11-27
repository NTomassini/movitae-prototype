/**
 * Q65 (27 nov): la foto si allarga dalla card alla scheda (come Airbnb e la transizione "zoom" di iOS).
 * Al tocco su una riga di Scopri, una card di "Vicino a te" o una card di Movi si ricorda dov'era la foto;
 * la scheda che si apre subito dopo fa volare la foto da lì al suo posto e, se la card è ancora sotto, la riporta
 * indietro quando si chiude.
 */
export type ZoomSource = { rect: DOMRect; src: string; radius: number; t: number; path: string };
let pending: ZoomSource | null = null;
let installed = false;

export function installZoomSources() {
  if (installed) return;
  installed = true;
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement | null;
    const card = t?.closest('.activity-row, .venue-card, .movi-card');
    const img = card?.querySelector('img');
    if (!img) return;
    pending = { rect: img.getBoundingClientRect(), src: img.currentSrc || img.src, radius: parseFloat(getComputedStyle(img).borderRadius) || 12, t: performance.now(), path: location.pathname };
  }, true);
}

/** La scheda appena aperta legge la sorgente (vale solo se il tocco è di meno di un secondo fa; non la consuma,
 *  così il doppio montaggio di React in sviluppo non la perde). */
export function peekZoom(): ZoomSource | null {
  const p = pending;
  if (!p || performance.now() - p.t > 1000) return null;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  return p;
}
