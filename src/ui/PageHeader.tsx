import { useNav } from '../app/nav';
import { ScreenOverlay } from '../app/ScreenOverlay';
import { useScreenScroll } from '../app/useScreenScroll';
import { Icon } from './Icon';
import { ScrollEdge } from './ScrollEdge';
import './page-header.css';

/**
 * Intestazione delle pagine aperte da un'altra pagina (Header B e C, comportamenti §1).
 * - type B: freccia fissa + titolo grande nel contenuto (y 116) che scorre via; il titolo piccolo compare al suo posto.
 * - type C: freccia + titolo piccolo centrato, sempre.
 * Bordo sfocato in alto (106) solo quando il contenuto passa sotto.
 */
export function PageHeader({ title, type, onBack }: { title: string; type: 'B' | 'C'; onBack?: () => void }) {
  const navigate = useNav();
  const y = useScreenScroll();
  // Q71–Q72: bordo sfocato e titolo piccolo seguono lo scorrimento (niente soglie che scattano)
  const edge = Math.min(Math.max(y / 24, 0), 1);
  const small = type === 'C' ? 1 : Math.min(Math.max((y - 30) / 20, 0), 1);
  const showSmall = small > 0.5;
  return (
    <>
      <ScreenOverlay>
        <div className="page-header">
          <span className="scroll-edge-wrap" style={{ ['--edge' as string]: edge }}><ScrollEdge position="top" /></span>
          <button className="back-button glass-control glass-system" aria-label="Indietro" onClick={onBack ?? (() => navigate(-1))}>
            <Icon name="UI/Chevron-Left" size={24} />
          </button>
          <span className={`t-headline page-header__title${showSmall ? ' is-on' : ''}`} aria-hidden={type === 'B'}
            style={type === 'B' ? { opacity: small, transform: `translateY(${(1 - small) * 4}px)`, transition: 'none' } : undefined}>{title}</span>
        </div>
      </ScreenOverlay>
      {type === 'B' && <h1 className="t-large-title page-large-title" data-large-title>{title}</h1>}
    </>
  );
}
