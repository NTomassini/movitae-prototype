import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/**
 * Q66 (27 nov): numeri che scorrono quando cambiano davvero, come contentTransition(.numericText) di iOS.
 * Ogni cifra cambiata esce verso l'alto ed entra dal basso (al contrario se il numero scende), con una molla
 * senza rimbalzo. `id` ricorda l'ultimo valore mostrato anche tra una schermata e l'altra: dopo una prenotazione
 * la Home si apre con i punti nuovi e le cifre scorrono dal valore di prima. All'apertura normale non si muove niente.
 * Con "Riduci movimento" le cifre cambiano con una dissolvenza.
 */
const seen = new Map<string, { text: string; n: number }>();

export function RollingNumber({ id, value, format, remember = true }: { id: string; value: number; format: (n: number) => string; remember?: boolean }) {
  const text = format(value);
  // remember=false: scorre solo per i cambi mentre la schermata è aperta (es. il buono acceso nel riepilogo)
  const prev = remember ? seen.get(id) : undefined;
  // valore da cui partire al primo disegno: quello visto l'ultima volta (se diverso), altrimenti quello attuale
  const [shown, setShown] = useState(() => (prev && prev.text !== text ? prev : { text, n: value }));
  const dir = useRef(1);
  // fermo: testo normale (con la crenatura del carattere); solo durante il cambio le cifre stanno in caselle separate
  const [rolling, setRolling] = useState(false);
  useEffect(() => {
    seen.set(id, { text, n: value });
    if (shown.text === text) return;
    dir.current = value >= shown.n ? 1 : -1;
    setRolling(true);
    const t = setTimeout(() => setShown({ text, n: value }), shown === prev ? 250 : 16); // dopo l'apertura, un attimo di pausa
    const end = setTimeout(() => setRolling(false), (shown === prev ? 250 : 16) + 650);
    return () => { clearTimeout(t); clearTimeout(end); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  if (!rolling && shown.text === text) return <span className="rolling-number" aria-label={text}>{text}</span>;
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chars = shown.text.split('');
  return (
    <span className="rolling-number" aria-label={text}>
      {chars.map((c, i) => {
        const key = chars.length - i; // posizione da destra: le unità restano unità
        return (
          <span key={key} className="rolling-number__slot" aria-hidden="true">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span key={c} className="rolling-number__char"
                initial={reduce ? { opacity: 0 } : { y: `${dir.current * 70}%`, opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { y: `${-dir.current * 70}%`, opacity: 0 }}
                transition={{ type: 'spring', visualDuration: 0.4, bounce: 0 }}>{c}</motion.span>
            </AnimatePresence>
          </span>
        );
      })}
    </span>
  );
}
