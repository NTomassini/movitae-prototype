import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';

export type Detent = 'small' | 'medium' | 'large';

/**
 * Sheet della lista a tre altezze (Figma: piccolo bordo a y 650, medio 560, grande 124 su 874).
 * Si trascina dal grabber o dal titolo; al rilascio segue la velocità del dito (proiezione Apple,
 * decelerazione 0,998) e si ferma all'altezza più vicina con la molla sheet-release (0,4 s, rimbalzo 0,15).
 * Lista scorrevole solo a grande altezza.
 */
export function ListSheet({ title, children, detent, onDetent }: { title: string; children: ReactNode; detent: Detent; onDetent: (d: Detent) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(874);
  const y = useMotionValue(650);
  const tops = (height: number) => ({ small: height - 224, medium: height - 314, large: 124 });

  useEffect(() => {
    const el = wrap.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    animate(y, tops(h)[detent], reduce ? { duration: 0 } : { type: 'spring', visualDuration: 0.4, bounce: 0.15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detent, h]);

  const start = useRef<{ py: number; y: number; t: number; v: number; last: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { py: e.clientY, y: y.get(), t: performance.now(), v: 0, last: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const now = performance.now();
    s.v = ((e.clientY - s.last) / Math.max(now - s.t, 1)) * 1000;
    s.t = now; s.last = e.clientY;
    const t = tops(h);
    let next = s.y + (e.clientY - s.py);
    // oltre i limiti resiste (rubber band)
    if (next < t.large) next = t.large - (t.large - next) * 0.25;
    if (next > t.small) next = t.small + (next - t.small) * 0.25;
    y.set(next);
  };
  const onUp = () => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const projected = y.get() + (s.v / 1000) * 0.998 / (1 - 0.998);
    const t = tops(h);
    const best = (Object.keys(t) as Detent[]).reduce((a, b) => (Math.abs(t[b] - projected) < Math.abs(t[a] - projected) ? b : a));
    if (best === detent) animate(y, t[best], { type: 'spring', visualDuration: 0.4, bounce: 0.15, velocity: s.v });
    else onDetent(best);
  };

  const handlers = { onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onUp };
  return (
    <motion.div ref={wrap} className={`list-sheet list-sheet--${detent}`} style={{ y }} role="region" aria-label={title}>
      <div className="list-sheet__grabber-zone" {...handlers}>
        <button className="list-sheet__grabber" aria-label="Cambia altezza della lista"
          onClick={() => onDetent(detent === 'small' ? 'medium' : detent === 'medium' ? 'large' : 'small')} />
      </div>
      <h2 className="list-sheet__title t-title-3" {...handlers}>{title}</h2>
      <div className="list-sheet__list">{children}</div>
    </motion.div>
  );
}
