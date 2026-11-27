import './ScrollEdge.css';

/**
 * Bordo di scorrimento (comportamenti §4): solo sotto elementi di vetro, mai più alto dell'elemento.
 * Q72 (27 nov): sfocatura progressiva 0→12 e velo 95%→80%→0 del colore di sfondo, così titolo piccolo e avatar
 * restano leggibili su qualsiasi contenuto.
 */
export function ScrollEdge({ position, height }: { position: 'top' | 'bottom'; height: number }) {
  return <div className={`scroll-edge scroll-edge--${position}`} style={{ height }} aria-hidden="true" />;
}
