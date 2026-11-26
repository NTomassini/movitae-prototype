import { type ReactNode } from 'react';
import { motion } from 'motion/react';
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
  return (
    <ScreenOverlay>
      <motion.div className="modal-scrim" style={{ pointerEvents: 'auto' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onCancel} />
      <motion.div className="page-sheet" role="dialog" aria-modal="true" aria-label={title}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', visualDuration: 0.5, bounce: 0 }}
        drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} dragListener={false}>
        <span className="modal-sheet__grabber" aria-hidden="true" />
        <div className="page-sheet__head">
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
