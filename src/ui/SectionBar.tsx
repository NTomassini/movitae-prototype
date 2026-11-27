import type { ReactNode } from 'react';
import { ScreenOverlay } from '../app/ScreenOverlay';
import { useScreenScroll } from '../app/useScreenScroll';
import { ScrollEdge } from './ScrollEdge';
import './page-header.css';

/**
 * Riga fissa delle sezioni principali (Home, Premi), comportamenti §4 + Q70–Q72 (27 nov).
 * Il titolo grande sta nel contenuto e scorre via sotto la barra di stato dissolvendosi; il titolo piccolo centrato
 * (il nome della sezione: "Home", "Premi") e il bordo sfocato compaiono seguendo lo scorrimento, senza soglie.
 * A destra un elemento fisso (l'avatar in Home).
 */
export const COLLAPSE = 52; // pt di scorrimento in cui il titolo grande passa sotto la riga (vedi lo scatto in AppShell)

export function SectionBar({ small, right }: { small: string; right?: ReactNode }) {
  const y = useScreenScroll();
  const edge = Math.min(Math.max(y / 24, 0), 1);
  const title = Math.min(Math.max((y - 28) / 20, 0), 1);
  return (
    <ScreenOverlay>
      <div className="page-header section-bar">
        <span className="scroll-edge-wrap" style={{ ['--edge' as string]: edge }}><ScrollEdge position="top" /></span>
        <span className="t-headline page-header__title section-bar__title" aria-hidden={title < 0.5}
          style={{ opacity: title, transform: `translateY(${(1 - title) * 4}px)` }}>{small}</span>
        {right && <span className="section-bar__right">{right}</span>}
      </div>
    </ScreenOverlay>
  );
}

/** Opacità del titolo grande mentre scorre via (si dissolve salendo sotto la barra di stato). */
export function useLargeTitleFade() {
  const y = useScreenScroll();
  return Math.min(Math.max(1 - y / 40, 0), 1);
}
