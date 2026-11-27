/**
 * Altezza della cornice nell'app installata (punto 30a, Q54).
 * Bug di WebKit (iOS, app aggiunta alla Home con status-bar-style black-translucent): 100dvh/100vh e gli elementi
 * con bottom: 0 si fermano più in alto del fondo dello schermo, di quanto vale la safe area in alto
 * (sull'iPhone di Nicolò 47 pt di fascia grigia sotto la tab bar). In standalone si usa quindi l'altezza vera
 * dello schermo (screen.height in verticale) come --app-h; nel browser resta 100dvh.
 */
export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function fullScreenHeight() {
  const portrait = innerHeight >= innerWidth;
  const s = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
  return Math.max(s, innerHeight);
}

export function installViewportFix() {
  if (!isStandalone()) return;
  const root = document.documentElement;
  root.dataset.standalone = '';
  const apply = () => root.style.setProperty('--app-h', `${fullScreenHeight()}px`);
  apply();
  addEventListener('resize', apply);
  addEventListener('orientationchange', () => setTimeout(apply, 300));
}

/** Misure per la riga di controllo del pannello demo. */
export function viewportReport() {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;height:100dvh;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const r = {
    standalone: isStandalone(),
    screen: Math.max(screen.width, screen.height),
    inner: innerHeight,
    dvh: Math.round(probe.getBoundingClientRect().height), // box-sizing: border-box, quindi l'altezza è già 100dvh
    top: parseFloat(cs.paddingTop),
    bottom: parseFloat(cs.paddingBottom),
    device: Math.round(document.querySelector('.device')?.getBoundingClientRect().height ?? 0),
  };
  probe.remove();
  return r;
}
