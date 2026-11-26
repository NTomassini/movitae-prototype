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
  const showSmall = type === 'C' || y > 44;
  return (
    <>
      <ScreenOverlay>
        <div className={`page-header${y > 4 ? ' is-scrolled' : ''}`}>
          <ScrollEdge position="top" height={106} />
          <button className="back-button pressable" aria-label="Indietro" onClick={onBack ?? (() => navigate(-1))}>
            <Icon name="UI/Chevron-Left" size={24} />
          </button>
          <span className={`t-headline page-header__title${showSmall ? ' is-on' : ''}`} aria-hidden={type === 'B'}>{title}</span>
        </div>
      </ScreenOverlay>
      {type === 'B' && <h1 className="t-large-title page-large-title">{title}</h1>}
    </>
  );
}
