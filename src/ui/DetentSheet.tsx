import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue, type MotionValue } from 'motion/react';

/**
 * Sheet con altezze fisse (detent), come gli sheet di iOS.
 *
 * - `tops(h)`: per ogni altezza, il bordo superiore in px dentro un contenitore alto h.
 * - Si trascina da qualsiasi punto dello sheet. Dentro un'area che scorre (`data-scroll`) il dito
 *   scorre il contenuto finché può; quando il contenuto è in cima e il dito scende, oppure quando
 *   lo sheet non è all'altezza massima e il dito sale, il gesto passa allo sheet (come in Mappe).
 * - Il trascinamento parte dopo 6 px (un tocco resta un tocco), segue il dito 1:1 con resistenza
 *   oltre i limiti, e al rilascio proietta la velocità (decelerazione 0,998, formula Apple)
 *   per scegliere l'altezza; la molla sheet-release (0,4 s, rimbalzo 0,15) riparte dalla velocità del dito.
 * - `onDismiss`: trascinando oltre l'altezza più bassa lo sheet esce e si chiude.
 * - ref.dismiss(): chiusura animata da codice (pulsante x).
 */
export type DetentSheetHandle = { dismiss: () => Promise<void> };

type Props<D extends string> = {
  tops: (h: number) => Record<D, number>;
  detent: D;
  onDetent: (d: D) => void;
  className?: string;
  children: ReactNode;
  label: string;
  onDismiss?: () => void;
  modal?: boolean;
  /** posizione dello sheet dall'esterno (per legare altri elementi al suo movimento, Q76) */
  y?: MotionValue<number>;
  /** chiamata quando lo sheet si è fermato a un'altezza (es. la lista diventa scorrevole solo da ferma) */
  onSettle?: (d: D) => void;
  /** cambia quando cambiano le altezze (es. la lista ha meno righe): lo sheet si riallinea all'altezza nuova */
  retarget?: number;
};

// Q76 (27 nov): come gli sheet di iOS, si ferma senza rimbalzo (molla smorzata, 0,5 s) partendo dalla velocità del dito
const SPRING = { type: 'spring' as const, visualDuration: 0.5, bounce: 0 };
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function DetentSheetInner<D extends string>({ tops, detent, onDetent, className, children, label, onDismiss, modal, y: yExt, onSettle, retarget }: Props<D>, ref: React.Ref<DetentSheetHandle>) {
  const el = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);
  const yOwn = useMotionValue(10000);
  const y = yExt ?? yOwn;
  const settleRef = useRef(onSettle);
  const lastVelocity = useRef(0);
  settleRef.current = onSettle;
  const topsRef = useRef(tops);
  topsRef.current = tops;
  const state = useRef({ detent, onDetent, onDismiss, h });
  state.current = { detent, onDetent, onDismiss, h };

  useEffect(() => {
    const parent = el.current?.parentElement;
    if (!parent) return;
    setH(parent.clientHeight);
    const ro = new ResizeObserver(() => setH(parent.clientHeight));
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!h) return;
    // entra dal basso. jump e non set: set darebbe al valore la velocità del salto 10000 → h e la molla partirebbe
    // con quella velocità (lo sheet volava fuori dallo schermo per un istante aprendo la scheda dalla lista)
    if (y.get() === 10000) y.jump(h);
    const target = tops(h)[detent];
    if (Math.abs(y.get() - target) < 0.5) { settleRef.current?.(detent); return; }
    const v = lastVelocity.current; lastVelocity.current = 0;
    const a = animate(y, target, reduce() ? { duration: 0 } : { ...SPRING, velocity: v });
    a.then(() => settleRef.current?.(detent));
    return () => a.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detent, h, retarget]);

  useImperativeHandle(ref, () => ({
    dismiss: () => new Promise<void>((res) => {
      animate(y, state.current.h, reduce() ? { duration: 0 } : { type: 'spring', visualDuration: 0.35, bounce: 0 }).then(() => res());
    }),
  }));

  // Gesti (Q90, 27 nov): come gli sheet di iOS, sheet e contenuto sono un solo movimento.
  // Tirando su lo sheet sale col dito e, arrivato all'altezza massima, lo stesso gesto scorre il contenuto;
  // scorrendo giù il contenuto torna in cima e poi lo sheet scende, senza staccare il dito.
  // Lo scorrimento del contenuto è fatto qui (scrollTop + inerzia con la decelerazione di Apple 0,998): su iPhone
  // Safari decide al primo movimento se lo scorrimento è nativo e poi non lo si può più passare allo sheet.
  // Il gesto orizzontale (capsule dei giorni) resta nativo. Tocco con touch events, mouse con pointer events.
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    type G = { x0: number; y0: number; lastY: number; t: number; v: number; live: boolean; scroller: HTMLElement | null;
      dead: boolean; decided: boolean; raw: number; onContent: boolean };
    let g: G | null = null;
    let lastWasDrag = false;
    let inertia = 0;
    const stopInertia = () => { if (inertia) cancelAnimationFrame(inertia); inertia = 0; };

    const bounds = () => {
      const vals = Object.values(topsRef.current(state.current.h)) as number[];
      return { min: Math.min(...vals), max: Math.max(...vals) };
    };
    const H = () => state.current.h || 800;
    const band = (over: number) => (over * H() * 0.55) / (H() + 0.55 * over);
    const room = (sc: HTMLElement | null) => (sc ? Math.max(0, sc.scrollHeight - sc.clientHeight) : 0);
    // posizione "grezza" dello sheet → posizione mostrata, con la resistenza di Apple oltre i limiti (Q68)
    const show = (raw: number) => {
      const { min, max } = bounds();
      if (raw < min) return min - band(min - raw);
      if (raw > max && !state.current.onDismiss) return max + band(raw - max);
      return raw;
    };

    const start = (clientX: number, clientY: number, target: EventTarget | null) => {
      const t = target as HTMLElement;
      lastWasDrag = false; // prima del controllo: un tocco su un pulsante dopo un trascinamento non va ignorato
      stopInertia();
      if (t.closest('[data-nodrag]')) return;
      g = { x0: clientX, y0: clientY, lastY: clientY, t: performance.now(), v: 0, live: false, scroller: t.closest('[data-scroll]'),
        dead: false, decided: false, raw: y.get(), onContent: false };
    };
    // la direzione si decide al primo movimento: orizzontale → nativo, verticale → di questo componente
    const decide = (clientX: number, clientY: number) => {
      if (!g || g.decided) return;
      const dx = clientX - g.x0, dy = clientY - g.y0;
      if (!dx && !dy) return;
      g.decided = true;
      if (Math.abs(dx) > Math.abs(dy)) g.dead = true;
    };
    // sposta di d px (positivo = dito che scende): prima lo sheet o il contenuto, a seconda della direzione
    const apply = (d: number) => {
      if (!g) return;
      const { min } = bounds();
      const sc = g.scroller;
      if (d < 0) {
        // su: lo sheet sale fino all'altezza massima, il resto scorre il contenuto
        const toMax = Math.max(0, g.raw - min);
        const sheetPart = Math.max(d, -toMax);
        g.raw += sheetPart;
        let rest = d - sheetPart;
        if (rest < 0 && sc && room(sc) > 0) {
          const can = room(sc) - sc.scrollTop;
          const s = Math.min(-rest, can);
          sc.scrollTop += s; rest += s;
          g.onContent = s > 0;
        }
        if (rest < 0) { g.raw += rest; g.onContent = false; } // niente più da scorrere: resistenza oltre il bordo
      } else if (d > 0) {
        // giù: il contenuto torna in cima, poi scende lo sheet
        let rest = d;
        if (g.raw <= min + 0.5 && sc && sc.scrollTop > 0) {
          const s = Math.min(rest, sc.scrollTop);
          sc.scrollTop -= s; rest -= s;
          g.onContent = s > 0;
        }
        if (rest > 0) { g.raw += rest; g.onContent = false; }
      }
      y.set(show(g.raw));
    };
    const move = (clientY: number): boolean => {
      if (!g || g.dead) return false;
      if (!g.live) {
        if (Math.abs(clientY - g.y0) < 6) return false;
        g.live = true;
        g.raw = y.get(); g.lastY = g.y0; // i primi 6 px non si perdono: lo sheet resta sotto il dito
      }
      const now = performance.now();
      const d = clientY - g.lastY;
      g.v = (d / Math.max(now - g.t, 1)) * 1000;
      g.t = now; g.lastY = clientY;
      apply(d);
      return true;
    };
    const coast = (sc: HTMLElement, v0: number) => {
      // inerzia del contenuto: v in px/s (positivo = il contenuto torna verso l'alto)
      let v = v0, last = performance.now();
      const step = (now: number) => {
        const dt = now - last; last = now;
        sc.scrollTop -= (v * dt) / 1000;
        v *= Math.pow(0.998, dt);
        const atEdge = sc.scrollTop <= 0 || sc.scrollTop >= room(sc) - 0.5;
        if (Math.abs(v) < 15 || atEdge) { inertia = 0; return; }
        inertia = requestAnimationFrame(step);
      };
      inertia = requestAnimationFrame(step);
    };
    const end = () => {
      const s = g;
      g = null;
      if (!s || !s.live) return;
      lastWasDrag = true;
      const t = topsRef.current(state.current.h);
      const keys = (Object.keys(t) as D[]).sort((a, b) => t[a] - t[b]); // dall'alto in basso
      const top = keys[0];
      // il dito stava scorrendo il contenuto con lo sheet al massimo: lo sheet resta lì e il contenuto prosegue per inerzia
      if (s.onContent && s.scroller && Math.abs(y.get() - t[top]) < 0.5) {
        if (Math.abs(s.v) > 60) coast(s.scroller, s.v);
        if (state.current.detent !== top) state.current.onDetent(top); else settleRef.current?.(top);
        return;
      }
      const projected = y.get() + (s.v / 1000) * 0.998 / (1 - 0.998);
      const { max } = bounds();
      // Q86: un lancio sposta lo sheet di una sola altezza; si chiude con un lancio solo se è già all'altezza più bassa
      const cur = state.current.detent;
      const atLowest = t[cur] >= max - 1 || y.get() > max + 1;
      if (state.current.onDismiss && projected > max + 100 && atLowest) {
        animate(y, state.current.h, { type: 'spring', visualDuration: 0.35, bounce: 0, velocity: s.v }).then(() => state.current.onDismiss?.());
        return;
      }
      let best = keys.reduce((a, b) => (Math.abs(t[b] - projected) < Math.abs(t[a] - projected) ? b : a));
      const near = keys.reduce((a, b) => (Math.abs(t[b] - y.get()) < Math.abs(t[a] - y.get()) ? b : a));
      const from = Math.abs(t[near] - y.get()) < 24 ? near : null;
      const base = keys.indexOf(from ?? cur);
      const bi = keys.indexOf(best);
      if (Math.abs(bi - base) > 1) best = keys[base + Math.sign(bi - base)];
      lastVelocity.current = s.v;
      if (best === state.current.detent) animate(y, t[best], { ...SPRING, velocity: s.v }).then(() => settleRef.current?.(best));
      else state.current.onDetent(best);
    };

    const ts = (e: TouchEvent) => start(e.touches[0].clientX, e.touches[0].clientY, e.target);
    const tm = (e: TouchEvent) => {
      const p = e.touches[0];
      decide(p.clientX, p.clientY);
      // verticale: fermato da subito (anche sotto i 6 px), così Safari non avvia lo scorrimento nativo
      if (g && g.decided && !g.dead && e.cancelable) e.preventDefault();
      move(p.clientY);
    };
    const te = () => end();
    const pd = (e: PointerEvent) => { if (e.pointerType === 'mouse' && e.button === 0) start(e.clientX, e.clientY, e.target); };
    const pm = (e: PointerEvent) => { if (e.pointerType === 'mouse' && g) { decide(e.clientX, e.clientY); if (move(e.clientY)) e.preventDefault(); } };
    const pu = (e: PointerEvent) => { if (e.pointerType === 'mouse') end(); };
    // un trascinamento non deve diventare un tocco sul bottone sotto il dito
    const click = (e: MouseEvent) => { if (lastWasDrag) { e.stopPropagation(); e.preventDefault(); lastWasDrag = false; } };

    node.addEventListener('touchstart', ts, { passive: true });
    node.addEventListener('touchmove', tm, { passive: false });
    node.addEventListener('touchend', te);
    node.addEventListener('touchcancel', te);
    node.addEventListener('pointerdown', pd);
    window.addEventListener('pointermove', pm);
    window.addEventListener('pointerup', pu);
    node.addEventListener('click', click, true);
    return () => {
      stopInertia();
      node.removeEventListener('touchstart', ts);
      node.removeEventListener('touchmove', tm);
      node.removeEventListener('touchend', te);
      node.removeEventListener('touchcancel', te);
      node.removeEventListener('pointerdown', pd);
      window.removeEventListener('pointermove', pm);
      window.removeEventListener('pointerup', pu);
      node.removeEventListener('click', click, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div ref={el} className={className} style={{ y, visibility: h ? 'visible' : 'hidden' }} role={modal ? 'dialog' : 'region'} aria-label={label}>
      {children}
    </motion.div>
  );
}

export const DetentSheet = forwardRef(DetentSheetInner) as <D extends string>(p: Props<D> & { ref?: React.Ref<DetentSheetHandle> }) => React.ReactElement;
