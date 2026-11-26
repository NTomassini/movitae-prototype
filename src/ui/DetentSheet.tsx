import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';

/**
 * Sheet con altezze fisse (detent), come gli sheet di iOS.
 * `tops(h)` dà, per ogni altezza, il bordo superiore in px dentro un contenitore alto h.
 * Si trascina dalle zone con `data-drag`; al rilascio segue la velocità del dito (proiezione Apple,
 * decelerazione 0,998) e si ferma all'altezza più vicina con la molla sheet-release (0,4 s, rimbalzo 0,15).
 * Oltre i limiti resiste (rubber band). Con "Riduci movimento" salta senza animazione.
 */
export function DetentSheet<D extends string>({ tops, detent, onDetent, className, children, label, onDismiss }: {
  tops: (h: number) => Record<D, number>;
  detent: D;
  onDetent: (d: D) => void;
  className?: string;
  children: ReactNode;
  label: string;
  /** se c'è, trascinare oltre l'altezza più bassa chiude lo sheet */
  onDismiss?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(874);
  const y = useMotionValue(2000);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    setH(el.clientHeight);
    const ro = new ResizeObserver(() => setH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (y.get() === 2000) y.set(h); // entra dal basso
    animate(y, tops(h)[detent], reduce ? { duration: 0 } : { type: 'spring', visualDuration: 0.4, bounce: 0.15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detent, h]);

  const drag = useRef<{ py: number; y: number; t: number; v: number; last: number; live: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (!(e.target as HTMLElement).closest('[data-drag]')) return;
    drag.current = { py: e.clientY, y: y.get(), t: performance.now(), v: 0, last: e.clientY, live: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = drag.current;
    if (!s) return;
    // il trascinamento parte dopo 6 px (isteresi): un tocco resta un tocco
    if (!s.live) {
      if (Math.abs(e.clientY - s.py) < 6) return;
      s.live = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    const now = performance.now();
    s.v = ((e.clientY - s.last) / Math.max(now - s.t, 1)) * 1000;
    s.t = now; s.last = e.clientY;
    const vals = Object.values(tops(h)) as number[];
    const min = Math.min(...vals), max = Math.max(...vals);
    let next = s.y + (e.clientY - s.py);
    if (next < min) next = min - (min - next) * 0.25;
    if (next > max && !onDismiss) next = max + (next - max) * 0.25;
    y.set(next);
  };
  const onPointerUp = () => {
    const s = drag.current;
    drag.current = null;
    if (!s || !s.live) return;
    const t = tops(h);
    const projected = y.get() + (s.v / 1000) * 0.998 / (1 - 0.998);
    const max = Math.max(...(Object.values(t) as number[]));
    if (onDismiss && projected > max + 120) {
      animate(y, h, { type: 'spring', visualDuration: 0.35, bounce: 0, velocity: s.v }).then(onDismiss);
      return;
    }
    const best = (Object.keys(t) as D[]).reduce((a, b) => (Math.abs(t[b] - projected) < Math.abs(t[a] - projected) ? b : a));
    if (best === detent) animate(y, t[best], { type: 'spring', visualDuration: 0.4, bounce: 0.15, velocity: s.v });
    else onDetent(best);
  };

  return (
    <motion.div ref={ref} className={className} style={{ y }} role="dialog" aria-label={label}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      {children}
    </motion.div>
  );
}
