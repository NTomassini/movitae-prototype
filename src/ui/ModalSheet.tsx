import { useRef, useState, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { DetentSheet, type DetentSheetHandle } from './DetentSheet';
import { ScreenOverlay } from '../app/ScreenOverlay';
import { Icon } from './Icon';
import './modal-sheet.css';

/**
 * Sheet modale ancorato al fondo (Figma: Sheet + Scrim 35%). `visible` = quanto sporge dal fondo (pt).
 * Si chiude toccando il velo, trascinando in basso o con close() passato ai figli.
 */
export function ModalSheet({ visible, label, onClose, children, closeButton = true }: { visible: number; label: string; onClose: () => void; children: (close: () => void) => ReactNode; closeButton?: boolean }) {
  const sheet = useRef<DetentSheetHandle>(null);
  const [closing, setClosing] = useState(false);
  const close = async (down = false) => {
    if (closing) return;
    setClosing(true);
    if (!down) await sheet.current?.dismiss();
    onClose();
  };
  // Q76: il velo segue la posizione dello sheet (entrata, trascinamento, uscita), invece di una dissolvenza a tempo
  const y = useMotionValue(10000);
  const scrim = useTransform(y, (v) => {
    const h = document.querySelector<HTMLElement>('.device')?.clientHeight ?? 874;
    return Math.min(Math.max(1 - (v - (h - visible)) / visible, 0), 1);
  });
  // reso fuori dalla pagina che scorre, dentro la cornice: così l'altezza è quella dello schermo
  return (
    <ScreenOverlay>
      <motion.div className="modal-scrim" style={{ opacity: scrim }} onClick={() => close()} />
      <DetentSheet ref={sheet} y={y} className="modal-sheet" tops={(h) => ({ open: h - visible })} detent="open" onDetent={() => {}} label={label} onDismiss={() => close(true)} modal>
        <span className="modal-sheet__grabber" aria-hidden="true" />
        {closeButton && <button className="circle-button modal-sheet__close pressable" aria-label="Chiudi" onClick={() => close()}><Icon name="UI/Close" size={22} /></button>}
        {children(() => close())}
      </DetentSheet>
    </ScreenOverlay>
  );
}
