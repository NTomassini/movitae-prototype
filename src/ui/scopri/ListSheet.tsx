import type { ReactNode } from 'react';
import { DetentSheet } from '../DetentSheet';

export type Detent = 'small' | 'medium' | 'large';
// Figma: piccolo bordo a y 650, medio 560, grande 124 su 874 (= 224 e 314 dal fondo, 124 dall'alto).
const tops = (h: number) => ({ small: h - 224, medium: h - 314, large: 124 });

/** Sheet della lista di Scopri. Lista scorrevole solo a grande altezza. */
export function ListSheet({ title, children, detent, onDetent }: { title: string; children: ReactNode; detent: Detent; onDetent: (d: Detent) => void }) {
  return (
    <DetentSheet className={`list-sheet list-sheet--${detent}`} tops={tops} detent={detent} onDetent={onDetent} label={title}>
      <div className="list-sheet__grabber-zone" data-drag>
        <button className="list-sheet__grabber" aria-label="Cambia altezza della lista"
          onClick={() => onDetent(detent === 'small' ? 'medium' : detent === 'medium' ? 'large' : 'small')} />
      </div>
      <h2 className="list-sheet__title t-title-3" data-drag>{title}</h2>
      <div className="list-sheet__list">{children}</div>
    </DetentSheet>
  );
}
