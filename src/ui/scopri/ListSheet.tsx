import type { ReactNode } from 'react';
import { DetentSheet } from '../DetentSheet';

export type Detent = 'hidden' | 'small' | 'medium' | 'large';
// Figma: piccolo bordo a y 650, medio 560, grande 124 su 874 (= 224 e 314 dal fondo, 124 dall'alto).
// "hidden" (26 nov, richiesta di Nicolò): trascinata tutta in basso la lista esce; torna con "Mostra la lista".
const tops = (h: number) => ({ hidden: h + 8, small: h - 224, medium: h - 314, large: 124 });

/** Sheet della lista di Scopri. Si trascina da ovunque; la lista scorre solo a grande altezza. */
export function ListSheet({ title, children, detent, onDetent, muted, action }: { title: string | null; children: ReactNode; detent: Detent; onDetent: (d: Detent) => void; muted?: boolean; action?: ReactNode }) {
  return (
    <DetentSheet className={`list-sheet list-sheet--${detent}`} tops={tops} detent={detent} onDetent={onDetent} label={title ?? 'Lista'}>
      <div className="list-sheet__grabber-zone">
        <button className="list-sheet__grabber" aria-label="Cambia altezza della lista"
          onClick={() => onDetent(detent === 'small' ? 'medium' : detent === 'medium' ? 'large' : 'small')} />
      </div>
      {title != null && (action
        ? <div className="list-sheet__title-row"><h2 className="list-sheet__title t-title-3">{title}</h2>{action}</div>
        : <h2 className={`list-sheet__title t-title-3${muted ? ' secondary' : ''}`}>{title}</h2>)}
      <div className="list-sheet__list" data-scroll>{children}</div>
    </DetentSheet>
  );
}
