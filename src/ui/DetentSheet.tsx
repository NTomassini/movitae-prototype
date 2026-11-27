import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';

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
};

const SPRING = { type: 'spring' as const, visualDuration: 0.4, bounce: 0.15 };
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function DetentSheetInner<D extends string>({ tops, detent, onDetent, className, children, label, onDismiss, modal }: Props<D>, ref: React.Ref<DetentSheetHandle>) {
  const el = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);
  const y = useMotionValue(10000);
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
    animate(y, tops(h)[detent], reduce() ? { duration: 0 } : SPRING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detent, h]);

  useImperativeHandle(ref, () => ({
    dismiss: () => new Promise<void>((res) => {
      animate(y, state.current.h, reduce() ? { duration: 0 } : { type: 'spring', visualDuration: 0.35, bounce: 0 }).then(() => res());
    }),
  }));

  // Gesti: tocco con touch events (così si può fermare lo scorrimento nativo), mouse con pointer events.
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    type G = { y0: number; sheetY0: number; last: number; t: number; v: number; live: boolean; scroller: HTMLElement | null; dead: boolean };
    let g: G | null = null;
    let lastWasDrag = false;

    const bounds = () => {
      const vals = Object.values(topsRef.current(state.current.h)) as number[];
      return { min: Math.min(...vals), max: Math.max(...vals) };
    };
    const start = (clientY: number, target: EventTarget | null) => {
      const t = target as HTMLElement;
      lastWasDrag = false; // prima del controllo: un tocco su un pulsante dopo un trascinamento non va ignorato
      if (t.closest('[data-nodrag]')) return;
      g = { y0: clientY, sheetY0: y.get(), last: clientY, t: performance.now(), v: 0, live: false, scroller: t.closest('[data-scroll]'), dead: false };
    };
    // true = il gesto è dello sheet (e va fermato lo scorrimento nativo)
    const move = (clientY: number): boolean => {
      if (!g || g.dead) return false;
      const dy = clientY - g.y0;
      if (!g.live) {
        if (Math.abs(dy) < 6) return false;
        const { min } = bounds();
        const sc = g.scroller;
        const canScroll = !!sc && sc.scrollHeight > sc.clientHeight + 1 && getComputedStyle(sc).overflowY !== 'hidden';
        if (canScroll) {
          const atTop = sc!.scrollTop <= 0;
          const sheetAtMax = y.get() <= min + 1;
          if (dy > 0 && !atTop) { g.dead = true; return false; }
          if (dy < 0 && sheetAtMax) { g.dead = true; return false; }
        }
        g.live = true;
        g.y0 = clientY; g.sheetY0 = y.get();
      }
      const now = performance.now();
      g.v = ((clientY - g.last) / Math.max(now - g.t, 1)) * 1000;
      g.t = now; g.last = clientY;
      const { min, max } = bounds();
      let next = g.sheetY0 + (clientY - g.y0);
      // Q68: resistenza progressiva oltre il bordo (formula di Apple: più tiri, meno segue)
      const H = state.current.h || 800;
      const band = (over: number) => (over * H * 0.55) / (H + 0.55 * over);
      if (next < min) next = min - band(min - next);
      if (next > max && !state.current.onDismiss) next = max + band(next - max);
      y.set(next);
      return true;
    };
    const end = () => {
      const s = g;
      g = null;
      if (!s || !s.live) return;
      lastWasDrag = true;
      const t = topsRef.current(state.current.h);
      const projected = y.get() + (s.v / 1000) * 0.998 / (1 - 0.998);
      const { max } = bounds();
      if (state.current.onDismiss && projected > max + 100) {
        animate(y, state.current.h, { type: 'spring', visualDuration: 0.35, bounce: 0, velocity: s.v }).then(() => state.current.onDismiss?.());
        return;
      }
      const keys = Object.keys(t) as D[];
      const best = keys.reduce((a, b) => (Math.abs(t[b] - projected) < Math.abs(t[a] - projected) ? b : a));
      if (best === state.current.detent) animate(y, t[best], { ...SPRING, velocity: s.v });
      else state.current.onDetent(best);
    };

    const ts = (e: TouchEvent) => start(e.touches[0].clientY, e.target);
    const tm = (e: TouchEvent) => { if (move(e.touches[0].clientY) && e.cancelable) e.preventDefault(); };
    const te = () => end();
    const pd = (e: PointerEvent) => { if (e.pointerType === 'mouse' && e.button === 0) start(e.clientY, e.target); };
    const pm = (e: PointerEvent) => { if (e.pointerType === 'mouse' && g && move(e.clientY)) e.preventDefault(); };
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
