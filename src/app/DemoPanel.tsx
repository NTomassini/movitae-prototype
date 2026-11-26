import { chat } from '../state/movi';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { initialDemo, store, upcoming, useDemo, type Demo } from '../state/bookings';
import './demo.css';

/**
 * Pannello demo (Q33): NON fa parte del design. Si apre con una pressione lunga sull'avatar della Home
 * o aprendo l'app con ?demo nell'indirizzo. Cambia al volo gli stati difficili da provocare.
 */
export const openDemo = () => window.dispatchEvent(new Event('movitae:demo'));

type Opt<K extends keyof Demo> = { key: K; label: string; options: { v: Demo[K]; l: string }[]; ready?: boolean };
const groups: Opt<keyof Demo>[] = [
  { key: 'mission', label: 'Missione in Home', options: [{ v: 'active', l: 'Attiva' }, { v: 'first-day', l: 'Primo giorno' }, { v: 'no-health', l: 'Senza Salute' }, { v: 'completed', l: 'Fatta' }, { v: 'completed-7', l: '7 giorni' }] },
  { key: 'location', label: 'Posizione', options: [{ v: 'granted', l: 'Concessa' }, { v: 'denied', l: 'Negata' }] },
  { key: 'network', label: 'Connessione', options: [{ v: 'online', l: 'Online' }, { v: 'offline', l: 'Offline' }] },
  { key: 'payment', label: 'Pagamento', options: [{ v: 'ok', l: 'Riuscito' }, { v: 'fail', l: 'Non riuscito' }] },
  { key: 'clock', label: 'Ora (disdetta gratis fino a 2 ore prima)', options: [{ v: 'before', l: 'Prima del limite' }, { v: 'after', l: 'Dopo il limite' }] },
  { key: 'soldOut', label: 'Orario scelto', options: [{ v: false, l: 'Disponibile' }, { v: true, l: 'Esaurito' }] },
] as Opt<keyof Demo>[];

export function DemoPanel() {
  const [open, setOpen] = useState(() => new URLSearchParams(location.search).has('demo'));
  const demo = useDemo();
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener('movitae:demo', on);
    return () => window.removeEventListener('movitae:demo', on);
  }, []);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="demo-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.div className="demo-panel" role="dialog" aria-label="Pannello demo"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', visualDuration: 0.4, bounce: 0 }}>
            <div className="demo-panel__head">
              <span className="t-headline">Pannello demo</span>
              <button className="t-headline" onClick={() => setOpen(false)}>Fine</button>
            </div>
            <p className="t-footnote secondary">Strumento per prove e video, non fa parte dell'app.</p>
            {groups.map((g) => (
              <div key={g.key} className="demo-panel__group">
                <span className="t-footnote-emphasized secondary">{g.label}</span>
                <div className="demo-seg">
                  {g.options.map((o) => (
                    <button key={String(o.v)} className={`t-footnote-emphasized${demo[g.key] === o.v ? ' is-on' : ''}`}
                      onClick={() => { store.setDemo({ [g.key]: o.v } as Partial<Demo>); if (g.key === 'mission') store.setCelebrated(null); }}>{o.l}</button>
                  ))}
                </div>
              </div>
            ))}
            <div className="demo-panel__actions">
              <button className="t-subheadline-emphasized" onClick={() => { const b = upcoming(store.get().bookings)[0]; if (b) store.updateBooking(b.id, { status: 'checked-in' }); }}>Check-in della prossima</button>
            </div>
            <div className="demo-panel__actions">
              <button className="t-subheadline-emphasized" onClick={() => store.setDemo(initialDemo)}>Stati normali</button>
              <button className="t-subheadline-emphasized danger" onClick={() => { store.reset(); chat.reset(); setOpen(false); location.assign('/'); }}>Ripristina demo</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
