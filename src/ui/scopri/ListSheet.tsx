import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { DetentSheet } from '../DetentSheet';
import { Icon } from '../Icon';

export type Detent = 'hidden' | 'small' | 'medium' | 'large';
// Figma: piccolo bordo a y 650, medio 560, grande 124 su 874 (= 224 e 314 dal fondo, 124 dall'alto).
// "hidden" (26 nov): trascinata tutta in basso la lista esce; torna con "Mostra la lista".
// Q57 (27 nov): con `fit` nessuna altezza supera il contenuto (titolo + righe + 16 + area sicura). Se la lista sta
// già nella media, la grande coincide con la media: tirando su lo sheet si ferma con la resistenza elastica.
const base = (h: number) => ({ hidden: h + 8, small: h - 224, medium: h - 314, large: 124 });

/** Sheet della lista di Scopri. Si trascina da ovunque; la lista scorre solo a grande altezza. */
export function ListSheet({ title, children, detent, onDetent, muted, action, fit, onClose }: {
  title: string | null; children: ReactNode; detent: Detent; onDetent: (d: Detent) => void; muted?: boolean; action?: ReactNode;
  fit?: boolean; onClose?: () => void;
}) {
  const content = useRef<HTMLDivElement>(null);
  const [need, setNeed] = useState(0); // altezza che serve al contenuto, dal bordo superiore dello sheet

  useLayoutEffect(() => {
    const c = content.current;
    if (!c) return;
    const measure = () => {
      const list = c.parentElement!;
      const pad = parseFloat(getComputedStyle(list).paddingBottom) || 0;
      setNeed(list.offsetTop + c.offsetHeight + pad);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  const tops = (h: number) => {
    const t = base(h);
    if (!fit || !need) return t;
    const fitTop = h - need;
    return { hidden: t.hidden, small: Math.max(t.small, fitTop), medium: Math.max(t.medium, fitTop), large: Math.max(t.large, fitTop) };
  };

  return (
    <DetentSheet className={`list-sheet list-sheet--${detent}`} tops={tops} detent={detent} onDetent={onDetent} label={title ?? 'Lista'}>
      <div className="list-sheet__grabber-zone">
        <button className="list-sheet__grabber" aria-label="Cambia altezza della lista"
          onClick={() => onDetent(detent === 'small' ? 'medium' : detent === 'medium' ? 'large' : 'small')} />
      </div>
      {title != null && (
        <div className="list-sheet__title-row">
          <h2 className={`list-sheet__title t-title-3${muted ? ' secondary' : ''}`}>{title}</h2>
          {action}
          {onClose && (
            <button className="circle-button list-sheet__close pressable" aria-label="Nascondi la lista" data-nodrag onClick={onClose}>
              <Icon name="UI/Close" size={22} />
            </button>
          )}
        </div>
      )}
      <div className="list-sheet__list" data-scroll>
        <div ref={content} className="list-sheet__content">{children}</div>
      </div>
    </DetentSheet>
  );
}
