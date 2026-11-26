import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { Splash } from './Splash';
import { settle, startEdgeBack } from './nav';
import { TabBar } from '../ui/TabBar';
import { ScrollEdge } from '../ui/ScrollEdge';
import { StatusBar, HomeIndicator } from './DeviceChrome';
import { ChromeProvider, useChrome } from './chrome';
import { DemoPanel } from './DemoPanel';

/**
 * Cornice dell'app. Sul telefono occupa tutto lo schermo e usa le safe area vere;
 * su desktop mostra un iPhone 17 Pro (402×874) con barra di stato e indicatore Home disegnati,
 * così le schermate si confrontano 1:1 con Figma.
 */
export function AppShell() {
  return (
    <ChromeProvider>
      <Device />
    </ChromeProvider>
  );
}

// Ogni sezione ricorda dove l'avevi lasciata (come le tab di iOS); una pagina nuova parte dall'alto.
const scrollMemory = new Map<string, number>();

function Device() {
  const chrome = useChrome();
  const { pathname } = useLocation();
  const prev = useRef(pathname);
  const navigate = useNavigate();
  const navType = useNavigationType();
  // iOS 26: dopo la tastiera la finestra può restare spostata; si rimette a posto quando il campo perde il focus
  useEffect(() => { const f = () => setTimeout(() => window.scrollTo(0, 0), 50); window.addEventListener('focusout', f); return () => window.removeEventListener('focusout', f); }, []);
  const [splash, setSplash] = useState(false);
  const onSplash = useCallback((v: boolean) => setSplash(v), []);
  // Q36 B: l'onboarding si apre solo con ?onboarding nell'indirizzo (o dal pannello demo)
  useEffect(() => { if (new URLSearchParams(location.search).has('onboarding')) navigate('/onboarding/intro', { replace: true }); }, [navigate]);
  useLayoutEffect(() => {
    const el = document.getElementById('screen');
    if (!el) return;
    scrollMemory.set(prev.current, el.scrollTop);
    // indietro (o cambio di tab: ogni sezione ricorda dov'era) → riprende lo scorrimento; pagina nuova → dall'alto
    const isTab = ['/', '/scopri', '/movi', '/premi'].includes(pathname);
    const restore = navType === 'POP' || isTab || (history.state?.usr as { restore?: boolean } | null)?.restore;
    el.scrollTop = restore ? scrollMemory.get(pathname) ?? 0 : 0;
    prev.current = pathname;
    settle(); // la pagina nuova è sullo schermo: la transizione può partire
  }, [pathname]);
  const { search } = useLocation();
  const device = useRef<HTMLDivElement>(null);
  useEdgeBack(device, pathname + search, navigate);
  return (
    <div className="stage">
      <div ref={device} className={`device${splash ? ' is-splash' : ''}`}>
        {/* pagina + livelli fissi in un solo strato: nel passaggio tra le pagine si muovono insieme (Q48) */}
        <div className="page-layer">
          <main className={`screen${chrome.pageScroll ? '' : ' screen--fixed'}`} id="screen">
            <Outlet />
          </main>
          <div id="overlay" />
        </div>
        {chrome.bottomEdge && <ScrollEdge position="bottom" height={83} />}
        <TabBar hidden={!chrome.tabBar} />
        <StatusBar />
        <HomeIndicator />
        <Splash onVisible={onSplash} />
        <DemoPanel />
      </div>
    </div>
  );
}

/**
 * Indietro col dito dal bordo sinistro (Q49): il gesto parte entro 24 pt dal bordo, sulle pagine con la freccia.
 * La pagina segue il dito; lasciata oltre un terzo della larghezza (o con un colpo veloce) torna indietro,
 * altrimenti torna al suo posto.
 */
const ROOTS = ['/', '/scopri', '/movi', '/premi'];
const canGoBack = (path: string) => !ROOTS.includes(path) && !path.startsWith('/onboarding') && !path.startsWith('/prenotato') && !path.startsWith('/scopri/') && ((history.state?.idx as number) ?? 0) > 0;
function useEdgeBack(ref: React.RefObject<HTMLDivElement | null>, here: string, navigate: ReturnType<typeof useNavigate>) {
  const hereRef = useRef(here);
  hereRef.current = here;
  // il gesto attraversa un cambio di pagina: navigate cambia identità, quindi va letto da un ref (l'effetto resta montato)
  const navRef = useRef(navigate);
  navRef.current = navigate;
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let g: { x0: number; y0: number; left: number; w: number; started: boolean; ctl: ReturnType<typeof startEdgeBack>; lastX: number; lastT: number; v: number } | null = null;
    const begin = (x: number, y: number) => {
      const r = el.getBoundingClientRect();
      if (x - r.left > 24 || !canGoBack(location.pathname)) return;
      g = { x0: x, y0: y, left: r.left, w: r.width, started: false, ctl: null, lastX: x, lastT: performance.now(), v: 0 };
    };
    const move = (x: number, y: number, e: Event) => {
      if (!g) return;
      const dx = x - g.x0; const dy = y - g.y0;
      if (!g.started) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { g = null; return; }
        if (dx < 10) return;
        g.started = true;
        g.ctl = startEdgeBack(((to: never, o?: never) => navRef.current(to, o)) as unknown as ReturnType<typeof useNavigate>, { path: hereRef.current });
        if (!g.ctl) { g = null; navRef.current(-1); return; }
      }
      if (e.cancelable) e.preventDefault();
      const now = performance.now(); g.v = (x - g.lastX) / Math.max(1, now - g.lastT); g.lastX = x; g.lastT = now;
      g.ctl?.move(dx / g.w);
    };
    const end = (x: number) => {
      if (!g) return;
      const gg = g; g = null;
      if (!gg.started || !gg.ctl) return;
      const p = (x - gg.x0) / gg.w;
      gg.ctl.end(p > 0.33 || gg.v > 0.5);
    };
    const ts = (e: TouchEvent) => begin(e.touches[0].clientX, e.touches[0].clientY);
    const tm = (e: TouchEvent) => move(e.touches[0].clientX, e.touches[0].clientY, e);
    const te = (e: TouchEvent) => end(e.changedTouches[0].clientX);
    const md = (e: MouseEvent) => begin(e.clientX, e.clientY);
    const mm = (e: MouseEvent) => move(e.clientX, e.clientY, e);
    const mu = (e: MouseEvent) => end(e.clientX);
    el.addEventListener('touchstart', ts, { passive: true });
    el.addEventListener('touchmove', tm, { passive: false });
    el.addEventListener('touchend', te); el.addEventListener('touchcancel', te);
    el.addEventListener('mousedown', md); window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
    return () => {
      el.removeEventListener('touchstart', ts); el.removeEventListener('touchmove', tm); el.removeEventListener('touchend', te); el.removeEventListener('touchcancel', te);
      el.removeEventListener('mousedown', md); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu);
    };
  }, [ref]);
}
