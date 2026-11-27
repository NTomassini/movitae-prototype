import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { isStandalone } from './viewport';
import { Icon } from '../ui/Icon';
import { QR } from '../ui/booking/BookingParts';
import './install.css';

/**
 * Schermata "Aggiungi alla Home" (installa/iphone e installa/computer, Q83–Q84, 27 nov), prima dello splash.
 * - Aperta dall'icona sulla Home (standalone): mai.
 * - iPhone e iPad in un browser: icona dell'app, titolo e i 3 passi di Safari su iOS 26 (··· → Condividi →
 *   Aggiungi alla schermata Home, con "Apri come app web" acceso).
 * - Android: pulsante "Installa" col foglio di Chrome se il browser lo offre, altrimenti i passi del menu ⋮.
 * - Computer: QR da inquadrare con l'iPhone (dentro la cornice del telefono).
 * "Continua nel browser" la nasconde finché la scheda resta aperta (sessionStorage).
 * Nei test automatici non compare, a meno di ?install nell'indirizzo.
 */
const SKIP_KEY = 'movitae-install-skip';
type Kind = 'ios' | 'android' | 'desktop';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferred: InstallPrompt | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallPrompt; listeners.forEach((l) => l()); });
}

function deviceKind(): Kind {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

export function shouldShowInstall() {
  const q = new URLSearchParams(location.search);
  if (q.has('install')) return true;
  if (isStandalone() || navigator.webdriver) return false;
  try { return sessionStorage.getItem(SKIP_KEY) !== '1'; } catch { return true; }
}

/* simboli SF disegnati come in iOS: ellipsis (nella capsula di Safari) e plus.square */
const Ellipsis = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><g fill="currentColor"><circle cx="4" cy="10" r="1.8" /><circle cx="10" cy="10" r="1.8" /><circle cx="16" cy="10" r="1.8" /></g></svg>
);
const PlusSquare = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="2.5" y="2.5" width="15" height="15" rx="4" /><path d="M10 6.5v7M6.5 10h7" />
  </svg>
);
const Kebab = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><g fill="currentColor"><circle cx="10" cy="4" r="1.8" /><circle cx="10" cy="10" r="1.8" /><circle cx="10" cy="16" r="1.8" /></g></svg>
);

function Step({ n, children, glyph, i }: { n: number; children: ReactNode; glyph: ReactNode; i: number }) {
  return (
    <motion.li className="install__step" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', visualDuration: 0.4, bounce: 0.15, delay: 0.15 + i * 0.08 }}>
      <span className="install__n t-footnote-emphasized" aria-hidden="true">{n}</span>
      <p className="t-body">{children}</p>
      <span className="install__glyph" aria-hidden="true">{glyph}</span>
    </motion.li>
  );
}

export function InstallScreen({ onContinue }: { onContinue: () => void }) {
  const kind = deviceKind();
  const [canPrompt, setCanPrompt] = useState(!!deferred);
  useEffect(() => { const l = () => setCanPrompt(!!deferred); listeners.add(l); return () => { listeners.delete(l); }; }, []);
  const skip = () => { try { sessionStorage.setItem(SKIP_KEY, '1'); } catch { /* niente memoria: va bene lo stesso */ } onContinue(); };
  const install = async () => { if (!deferred) return; await deferred.prompt(); const r = await deferred.userChoice; deferred = null; setCanPrompt(false); if (r.outcome === 'accepted') skip(); };
  const url = location.origin;

  return (
    <motion.div className="install" role="dialog" aria-modal="true" aria-labelledby="install-title"
      exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
      <div className="install__body">
        <motion.img className="install__icon" src="/apple-touch-icon.png" alt="" width={96} height={96}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', visualDuration: 0.45, bounce: 0.25 }} />
        {kind === 'desktop' ? (
          <>
            <h1 id="install-title" className="t-title-1">Provalo sull'iPhone</h1>
            <p className="t-body secondary">Inquadra il codice con la fotocamera: si apre in Safari e ti spiega come aggiungerlo alla schermata Home.</p>
            <motion.div className="install__qr" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', visualDuration: 0.4, bounce: 0.15, delay: 0.15 }}>
              <QR value={url} label="Codice QR per aprire il prototipo sull'iPhone" />
              <span className="t-footnote secondary">{url.replace(/^https?:\/\//, '')}</span>
            </motion.div>
          </>
        ) : (
          <>
            <h1 id="install-title" className="t-title-1">Prova Movitae come un'app</h1>
            <p className="t-body secondary">Aggiungilo alla schermata Home: si apre a tutto schermo, come un'app vera.</p>
            {kind === 'ios' ? (
              <>
                <ol className="install__steps">
                  <Step n={1} i={0} glyph={<Ellipsis />}>Tocca <b>···</b> nella barra di Safari</Step>
                  <Step n={2} i={1} glyph={<Icon name="UI/Share" size={20} />}>Tocca <b>Condividi</b></Step>
                  <Step n={3} i={2} glyph={<PlusSquare />}>Scegli <b>Aggiungi alla schermata Home</b>, lascia acceso “Apri come app web” e tocca <b>Aggiungi</b></Step>
                </ol>
                <p className="install__note t-footnote secondary">Se Condividi è già nella barra, parti dal passo 2.</p>
              </>
            ) : !canPrompt && (
              <ol className="install__steps">
                <Step n={1} i={0} glyph={<Kebab />}>Tocca <b>⋮</b> in alto a destra</Step>
                <Step n={2} i={1} glyph={<PlusSquare />}>Tocca <b>Aggiungi a schermata Home</b> o <b>Installa app</b></Step>
                <Step n={3} i={2} glyph={<PlusSquare />}>Conferma con <b>Installa</b></Step>
              </ol>
            )}
          </>
        )}
      </div>
      <div className="install__cta">
        {kind === 'android' && canPrompt && <button className="button button--primary t-headline" onClick={install}>Installa</button>}
        <button className="button button--secondary t-headline" onClick={skip}>{kind === 'desktop' ? 'Continua qui' : 'Continua nel browser'}</button>
      </div>
    </motion.div>
  );
}
