import './ScrollEdge.css';

/**
 * Bordo di scorrimento (comportamenti §4): solo sotto elementi di vetro, mai più alto dell'elemento.
 * Sfocatura progressiva 0→10 e velo 72%→30%→0 del colore di sfondo.
 */
export function ScrollEdge({ position, height }: { position: 'top' | 'bottom'; height: number }) {
  return <div className={`scroll-edge scroll-edge--${position}`} style={{ height }} aria-hidden="true" />;
}
