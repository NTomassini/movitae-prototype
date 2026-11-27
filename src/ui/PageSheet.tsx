import { useEffect, useId, type ReactNode } from 'react';
import { setPushBack } from './pushback';
import { animate, motion, useMotionValue } from 'motion/react';
import { ScreenOverlay } from '../app/ScreenOverlay';
import './modal-sheet.css';
import './page-sheet.css';

/**
 * Sheet grande con intestazione (profilo/2, documenti/2 e /5): bordo a y 62, grabber a +5,
 * "Annulla" a sinistra, titolo 17 Semi Bold centrato, eventuale "Fine" a destra (a +26); contenuto da +72.
 */
export function PageSheet({ title, onCancel, done, onDone, doneDisabled, children, footer }: {
  title: string; onCancel: () => void; done?: string; onDone?: () => void; doneDisabled?: boolean; children: ReactNode; footer?: ReactNode;
}) {
  // come gli altri sheet: si chiude trascinando giù dalla maniglia o dall'intestazione (oltre 120 pt o con un lancio)
  const y = useMotionValue(1000); // in pt: 1000 = fuori dallo schermo (numeri, così trascinamento e uscita non mescolano unità)
  // Q67: la pagina sotto arretra seguendo lo sheet
  const pid = useId();
  useEffect(() => {
    const unsub = y.on('change', (v) => setPushBack(pid, 1 - Math.max(0, v) / 800));
    return () => { unsub(); setPushBack(pid, 0); };
  }, [y, pid]);
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const el = e.currentTarget as HTMLElement; el.setPointerCapture(e.pointerId);
    const start = e.clientY; let last = start; let lastT = performance.now(); let v = 0;
    const move = (ev: PointerEvent) => { const now = performance.now(); v = (ev.clientY - last) / Math.max(1, now - lastT) * 1000; last = ev.clientY; lastT = now; const dy = ev.clientY - start; y.set(dy > 0 ? dy : dy / 6); };
    const up = (ev: PointerEvent) => {
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      const dy = ev.clientY - start;
      if (dy > 120 || v > 600) onCancel(); else animate(y, 0, { type: 'spring', visualDuration: 0.4, bounce: 0.15 });
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
  return (
    <ScreenOverlay>
      <motion.div className="modal-scrim" style={{ pointerEvents: 'auto' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onCancel} />
      <motion.div className="page-sheet" role="dialog" aria-modal="true" aria-label={title}
        style={{ y }} animate={{ y: 0 }} exit={{ y: 1000 }} transition={{ type: 'spring', visualDuration: 0.5, bounce: 0 }}>
        <span className="modal-sheet__grabber" aria-hidden="true" />
        <div className="page-sheet__head" onPointerDown={onDown} style={{ touchAction: 'none' }}>
          <button className="t-body" onClick={onCancel}>Annulla</button>
          <h2 className="t-headline">{title}</h2>
          {done ? <button className="t-headline" onClick={onDone} disabled={doneDisabled}>{done}</button> : <span />}
        </div>
        <div className="page-sheet__body">{children}</div>
        {footer && <div className="page-sheet__footer">{footer}</div>}
      </motion.div>
    </ScreenOverlay>
  );
}
