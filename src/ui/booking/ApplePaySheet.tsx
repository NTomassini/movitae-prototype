import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { euroCents } from '../../data/data';
import { Icon } from '../Icon';
import { AppleLogo } from './BookingParts';
import './apple-pay-sheet.css';

/**
 * Foglio di Apple Pay simulato (Q64, 27 nov). In un'app vera lo disegna iOS (PKPaymentAuthorizationController):
 * qui lo imitiamo per i video, senza dati veri (carta finta "Visa •••• 4242").
 * Passi: conferma ("Conferma con il tasto laterale"; un tocco simula il doppio clic) → Face ID → elaborazione
 * (rotellina) → "Fatto" con la spunta → si chiude e si apre la conferma. Con il pagamento non riuscito il foglio si
 * chiude dopo l'elaborazione e il riepilogo mostra l'errore. La x annulla senza pagare.
 */
type Step = 'confirm' | 'faceid' | 'processing' | 'done';

export function ApplePaySheet({ total, fail, onSuccess, onFail, onCancel }: {
  total: number; fail: boolean; onSuccess: () => void; onFail: () => void; onCancel: () => void;
}) {
  const [step, setStep] = useState<Step>('confirm');
  useEffect(() => {
    if (step === 'faceid') { const t = setTimeout(() => setStep('processing'), 650); return () => clearTimeout(t); }
    if (step === 'processing') { const t = setTimeout(() => (fail ? onFail() : setStep('done')), 900); return () => clearTimeout(t); }
    if (step === 'done') { const t = setTimeout(onSuccess, 750); return () => clearTimeout(t); }
  }, [step, fail, onFail, onSuccess]);
  const confirm = () => { if (step === 'confirm') setStep('faceid'); };

  return (
    <>
      <motion.div className="applepay-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={step === 'confirm' ? onCancel : undefined} />
      <motion.div className="applepay-sheet" role="dialog" aria-modal="true" aria-label="Apple Pay"
        initial={{ y: '110%' }} animate={{ y: 0 }} exit={{ y: '110%' }} transition={{ type: 'spring', visualDuration: 0.45, bounce: 0 }}>
        <div className="applepay-sheet__head">
          <span className="applepay-sheet__brand"><AppleLogo /><span>Pay</span></span>
          {step === 'confirm' && (
            <button className="circle-button pressable" aria-label="Annulla" onClick={onCancel}><Icon name="UI/Close" size={16} /></button>
          )}
        </div>
        <div className="applepay-sheet__rows">
          <div className="applepay-row">
            <span className="applepay-card" aria-hidden="true" />
            <span className="applepay-row__text">
              <span className="t-subheadline-emphasized">Visa Debit</span>
              <span className="t-footnote secondary">•••• 4242</span>
            </span>
            <Icon name="UI/Chevron-Right" size={16} style={{ color: "var(--text-tertiary)" }} />
          </div>
          <div className="applepay-row applepay-row--total">
            <span className="t-subheadline secondary">Paga a Movitae</span>
            <span className="t-headline">{euroCents(total)}</span>
          </div>
        </div>
        <button className="applepay-confirm" onClick={confirm} aria-live="polite" disabled={step !== 'confirm'}>
          <motion.span key={step} className="applepay-confirm__glyph" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', visualDuration: 0.35, bounce: step === 'done' ? 0.35 : 0 }}>
            {step === 'confirm' && <SideButtonGlyph />}
            {step === 'faceid' && <FaceIdGlyph />}
            {step === 'processing' && <span className="applepay-spinner" />}
            {step === 'done' && <DoneGlyph />}
          </motion.span>
          <span className="t-footnote-emphasized">
            {step === 'confirm' ? 'Conferma con il tasto laterale' : step === 'faceid' ? 'Face ID' : step === 'processing' ? 'Elaborazione' : 'Fatto'}
          </span>
        </button>
      </motion.div>
    </>
  );
}

const SideButtonGlyph = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="12" y="6" width="20" height="32" rx="5" />
    <path d="M34 15v6" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
const FaceIdGlyph = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M6 14V9a3 3 0 0 1 3-3h5M30 6h5a3 3 0 0 1 3 3v5M38 30v5a3 3 0 0 1-3 3h-5M14 38H9a3 3 0 0 1-3-3v-5" />
    <path d="M16 17v3M28 17v3M22 17v7h-2M17 29c3 2.5 7 2.5 10 0" />
  </svg>
);
const DoneGlyph = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
    <circle cx="22" cy="22" r="20" fill="var(--system-blue)" />
    <motion.path d="M13 22.5l6 6 12-13" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }} />
  </svg>
);
