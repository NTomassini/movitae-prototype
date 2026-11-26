import { motion } from 'motion/react';
import { ScreenOverlay } from '../app/ScreenOverlay';
import './system-alert.css';

/**
 * SystemAlert (DS · Componenti 1476:437, Q21): titolo, messaggio, "Annulla" grigio a sinistra e
 * l'azione confermata piena a destra (selected/default). destructive = rosso pieno (solo Elimina account).
 * Entra come gli avvisi iOS: leggermente più grande che si posa, con il velo che sfuma.
 */
export function SystemAlert({ title, message, action, destructive, onCancel, onConfirm }: {
  title: string; message: string; action: string; destructive?: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <ScreenOverlay>
      <motion.div className="alert-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
      <motion.div className="system-alert" role="alertdialog" aria-modal="true" aria-labelledby="alert-title" aria-describedby="alert-msg"
        initial={{ opacity: 0, scale: 1.12 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', visualDuration: 0.3, bounce: 0.1 }}>
        <h2 id="alert-title" className="t-headline">{title}</h2>
        <p id="alert-msg" className="t-subheadline secondary">{message}</p>
        <div className="system-alert__actions">
          <button className="t-headline system-alert__cancel" onClick={onCancel}>Annulla</button>
          <button className={`t-headline system-alert__confirm${destructive ? ' is-destructive' : ''}`} onClick={onConfirm} autoFocus>{action}</button>
        </div>
      </motion.div>
    </ScreenOverlay>
  );
}
