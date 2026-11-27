import './ScrollEdge.css';

/**
 * Bordo di scorrimento (comportamenti §4): solo sotto elementi di vetro.
 * Q79 (27 nov): rifatto sul modello di WhatsApp su iOS 26 (effetto "soft" di sistema), misurato dagli screenshot:
 * - sfocatura progressiva, 5 livelli da 2 a 24 px, più forte in alto (sotto la barra di stato il contenuto sparisce,
 *   all'altezza del titolo si intravede sfocato, sotto la riga torna nitido);
 * - velo del colore di sfondo 97% → 93% (fine barra di stato) → 65% (titolo) → 25% (fine riga) → 0;
 * - in basso, sotto la tab bar, più leggero: il contenuto resta visibile ma sbiadito.
 * L'intensità segue lo scorrimento con la variabile --edge (0–1) messa da chi lo usa: niente opacity sul
 * contenitore, che spegnerebbe la sfocatura (diventerebbe la radice del backdrop).
 * Il colore del velo è --edge-bg (di serie lo sfondo della schermata; negli sheet lo sfondo dello sheet).
 */
export function ScrollEdge({ position, height }: { position: 'top' | 'bottom'; height?: number }) {
  return (
    <div className={`scroll-edge scroll-edge--${position}`} style={height ? { height } : undefined} aria-hidden="true">
      <i /><i /><i /><i /><i />
    </div>
  );
}
