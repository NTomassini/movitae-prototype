import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { fmtPoints, user } from '../../data/data';
import type { Demo } from '../../state/bookings';
import { Icon } from '../Icon';
import { Img } from '../Img';
import { Button } from '../booking/BookingParts';
import './mission.css';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Anello di avanzamento: spessore = r × (1 − innerRadius di Figma), parte da ore 12, senso orario. */
export function Ring({ size, thickness, progress, track, color, animateFrom, children }: {
  size: number; thickness: number; progress: number; track: string; color: string; animateFrom?: number; children?: React.ReactNode;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const p = useMotionValue(animateFrom ?? progress);
  const dash = useTransform(p, (v) => `${c * v} ${c}`);
  useEffect(() => {
    if (reduce()) { p.set(progress); return; }
    animate(p, progress, { type: 'spring', visualDuration: 0.9, bounce: 0 });
  }, [progress, p]);
  return (
    <span className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thickness} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness} style={{ strokeDasharray: dash }} />
      </svg>
      <span className="ring__label">{children}</span>
    </span>
  );
}

/** MissionCard: state = active | first-day | health-off | completed (DS · Componenti 1456:441…489). */
export function MissionCard({ state, onPress, onConnect }: { state: Demo['mission']; onPress?: () => void; onConnect?: () => void }) {
  const { goal, points } = user.mission;
  const steps = state === 'first-day' || state === 'no-health' ? 0 : state.startsWith('completed') ? goal : user.mission.steps;
  const streak = state === 'completed-7' ? 7 : state === 'completed' ? user.streak + 1 : user.streak;
  const ring = (
    <Ring size={112} thickness={6} progress={steps / goal} track="rgba(255,255,255,0.25)" color="#fff">
      <span className="t-number-large">{fmtPoints(steps)}</span>
      <span className="t-caption mission-card__muted">passi</span>
    </Ring>
  );

  if (state === 'no-health') {
    return (
      <div className="mission-card mission-card--tall">
        <span className="mission-card__text">
          <span className="mission-card__lines">
            <span className="t-title-3">Conta i tuoi passi</span>
            <span className="t-subheadline mission-card__muted">Collega Salute e ogni giorno ricevi una missione con i suoi punti.</span>
          </span>
          <button className="mission-card__connect t-headline pressable" onClick={onConnect}>Collega Salute</button>
        </span>
        {ring}
      </div>
    );
  }
  const done = state.startsWith('completed');
  const left = goal - steps;
  return (
    <button className="mission-card pressable" onClick={onPress}
      aria-label={done ? `Missione completata, +${points} punti. ${streak} giorni di fila.` : `Missione di oggi: ${fmtPoints(goal)} passi, ne mancano ${fmtPoints(left)}. ${state === 'first-day' ? 'Inizia oggi.' : `${streak} giorni di fila.`}`}>
      <span className="mission-card__text">
        <span className="mission-card__lines">
          <span className="t-footnote-emphasized mission-card__muted">{done ? 'Missione completata' : 'Missione di oggi'}</span>
          <span className="t-title-3">{done ? `+${points} pt guadagnati` : `${fmtPoints(goal)} passi · +${points} pt`}</span>
          <span className="t-subheadline mission-card__muted">{done ? 'Domani si riparte' : `Ne mancano ${fmtPoints(left)}`}</span>
        </span>
        <span className="mission-card__streak">
          <span className="mission-card__flame"><Img name="img/fiamma" style={{ width: 20, height: 20 }} /></span>
          <span className="t-subheadline-emphasized">{state === 'first-day' ? 'Inizia oggi' : `${streak} giorni di fila`}</span>
        </span>
      </span>
      {ring}
    </button>
  );
}

type DayState = 'done' | 'pause' | 'today' | 'future';
/** StreakDay — 36 + lettera; fatto = cerchio rosso con spunta; pausa = azzurro con fiamma ghiacciata; oggi = anello; futuro = vuoto. */
export function StreakDay({ letter, state, progress = 0.69 }: { letter: string; state: DayState; progress?: number }) {
  const names: Record<DayState, string> = { done: 'fatto', pause: 'pausa usata', today: 'oggi', future: 'da fare' };
  return (
    <span className="streak-day" aria-label={`${letter}: ${names[state]}`}>
      <span className={`t-footnote-emphasized streak-day__letter${state === 'today' ? ' is-today' : ''}`} aria-hidden="true">{letter}</span>
      {state === 'done' && <span className="streak-day__dot streak-day__dot--done"><Icon name="UI/Check" size={18} /></span>}
      {state === 'pause' && <span className="streak-day__dot streak-day__dot--pause"><Img name="img/fiamma-ghiacciata" style={{ width: 24, height: 24 }} /></span>}
      {state === 'today' && <Ring size={36} thickness={5} progress={progress} track="var(--fill-tertiary)" color="var(--brand-default)" />}
      {state === 'future' && <Ring size={36} thickness={5} progress={0} track="var(--border-control)" color="var(--border-control)" />}
    </span>
  );
}

/** Contenuto dello sheet "La tua serie" (missione/1, 1461:5088). Oggi è venerdì 13: la serie di 5 include sabato e domenica scorsi. */
export function StreakSheetContent({ state }: { state: Demo['mission'] }) {
  const done = state.startsWith('completed');
  const streak = state === 'completed-7' ? 7 : done ? user.streak + 1 : state === 'first-day' ? 0 : user.streak;
  const week: [string, DayState][] = [['L', 'done'], ['M', 'done'], ['M', 'pause'], ['G', 'done'], ['V', done ? 'done' : 'today'], ['S', 'future'], ['D', 'future']];
  return (
    <div className="streak-sheet">
      <Img name="img/fiamma" style={{ width: 72, height: 72 }} />
      <h2 className="t-title-1" style={{ marginTop: 12 }}>{streak} giorni di fila</h2>
      <p className="t-subheadline secondary" style={{ marginTop: 4 }}>
        {done ? 'Missione di oggi completata. Domani si riparte.' : `Oggi ti mancano ${fmtPoints(user.mission.goal - (state === 'first-day' ? 0 : user.mission.steps))} passi.`}
      </p>
      <div className="streak-week" role="list" aria-label="Questa settimana">
        {week.map(([l, s], i) => <StreakDay key={i} letter={l} state={s} />)}
      </div>
      <div className="streak-facts">
        <div className="streak-facts__row">
          <Img name="img/fiamma-ghiacciata" style={{ width: 36, height: 36, flex: 'none' }} />
          <span className="streak-facts__text"><span className="t-headline">Pause</span><span className="t-subheadline secondary">{user.pauses} di 2 disponibili</span></span>
        </div>
        <div className="streak-facts__sep" />
        <div className="streak-facts__row streak-facts__row--between"><span className="t-body">Serie più lunga</span><span className="t-headline">{user.bestStreak} giorni</span></div>
      </div>
      <p className="t-footnote secondary" style={{ marginTop: 12, alignSelf: 'stretch' }}>Guadagni una pausa quando cammini il 50% in più o vai a una lezione. Se salti un giorno, la pausa salva la tua serie.</p>
    </div>
  );
}

/** Celebrazione (missione/2 e /3): anello che si chiude, punti che arrivano, una proposta. Niente Movi. */
export function Celebration({ seven, onClose, onProposal }: { seven: boolean; onClose: () => void; onProposal: () => void }) {
  const [count, setCount] = useState(reduce() ? user.mission.goal : 0);
  useEffect(() => {
    if (reduce()) return;
    const ctl = animate(0, user.mission.goal, { duration: 0.9, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => setCount(Math.round(v / 10) * 10) });
    return () => ctl.stop();
  }, []);
  const pop = (delay: number) => (reduce() ? {} : { initial: { opacity: 0, scale: 0.6 }, animate: { opacity: 1, scale: 1 }, transition: { type: 'spring' as const, visualDuration: 0.5, bounce: 0.3, delay } });
  const fade = (delay: number) => (reduce() ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { type: 'spring' as const, visualDuration: 0.5, bounce: 0, delay } });
  return (
    <motion.div className="celebration" role="dialog" aria-modal="true" aria-label="Missione completata"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <button className="circle-button celebration__close pressable" aria-label="Chiudi" onClick={onClose}><Icon name="UI/Close" size={16} /></button>
      <div className="celebration__ring">
        <Ring size={220} thickness={22} progress={1} animateFrom={0} track="var(--fill-tertiary)" color="var(--brand-default)">
          <span className="t-large-title">{fmtPoints(count)}</span>
          <span className="t-subheadline secondary">passi</span>
        </Ring>
      </div>
      <motion.h1 className="t-title-1 celebration__title" {...fade(0.5)}>{seven ? 'Una settimana di fila!' : 'Missione completata'}</motion.h1>
      <div className="celebration__pills">
        <motion.span className="earn-pill t-headline" {...pop(0.8)}>+{user.mission.points} pt</motion.span>
        {seven && <motion.span className="earn-pill t-headline" {...pop(0.95)}>+25 pt bonus serie</motion.span>}
      </div>
      <motion.div className="celebration__streak" {...fade(1.05)}>
        <Img name="img/fiamma" style={{ width: seven ? 40 : 28, height: seven ? 40 : 28 }} />
        <span className="t-headline">{seven ? 7 : user.streak + 1} giorni di fila</span>
      </motion.div>
      <motion.h2 className="t-title-3 celebration__more" style={{ marginTop: seven ? 48 : 60 }} {...fade(1.2)}>Ti va di continuare?</motion.h2>
      <motion.button className="proposal pressable" onClick={onProposal} {...fade(1.3)}>
        <Img name="foto/yoga" style={{ width: 64, height: 64, borderRadius: 12, flex: 'none' }} />
        <span className="proposal__text">
          <span className="t-headline">Yoga Flow</span>
          <span className="t-subheadline secondary">Oggi, 18:30 · Zen Studio, 600 m</span>
          <span className="t-subheadline-emphasized" style={{ color: 'var(--earn-default)' }}>€18 · +180 pt</span>
        </span>
        <Icon name="UI/Chevron-Right" size={18} className="chevron" />
      </motion.button>
      <div className="celebration__done"><Button onPress={onClose}>Fatto</Button></div>
    </motion.div>
  );
}

/** Flusso E, collegare Salute: spiegazione (flusso-salute/2) → foglio di sistema di Salute (simulato) → missione attiva. */
export function HealthExplain({ onContinue }: { onContinue: () => void }) {
  const lines = ['Leggiamo solo passi e distanza.', 'Non modifichiamo i tuoi dati in Salute.', 'Puoi scollegarla da Impostazioni.'];
  return (
    <div className="health-sheet">
      <Img name="img/orme" style={{ width: 120, height: 120 }} />
      <h2 className="t-title-2" style={{ marginTop: 16 }}>Guadagna punti camminando</h2>
      <p className="t-body secondary" style={{ marginTop: 8 }}>Collega Salute per contare in automatico i passi di ogni giorno. Quando completi la missione ricevi punti da usare come sconto sulle prenotazioni.</p>
      <ul className="health-sheet__list">
        {lines.map((l) => <li key={l}><span className="check-dot"><Icon name="UI/Check" size={14} /></span><span className="t-body">{l}</span></li>)}
      </ul>
      <div style={{ marginTop: 32 }}><Button onPress={onContinue}>Continua</Button></div>
    </div>
  );
}

/** Foglio di autorizzazione di Salute (sistema iOS): nel prototipo è una simulazione fedele nello stile, non un design nostro. */
export function HealthSystemSheet({ onAllow, onDeny }: { onAllow: () => void; onDeny: () => void }) {
  const [on, setOn] = useState({ steps: true, distance: true });
  return (
    <motion.div className="health-system" role="dialog" aria-modal="true" aria-label="Accesso a Salute"
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', visualDuration: 0.5, bounce: 0 }}>
      <div className="health-system__bar">
        <button className="t-subheadline" onClick={onDeny}>Non consentire</button>
        <span className="t-headline">Accesso a Salute</span>
        <button className="t-subheadline-emphasized" style={{ color: 'var(--system-blue)' }} onClick={onAllow}>Consenti</button>
      </div>
      <div className="health-system__body">
        <Img name="img/orme" style={{ width: 56, height: 56 }} />
        <p className="t-title-3" style={{ marginTop: 12 }}>"Movitae" vorrebbe accedere e aggiornare i tuoi dati di Salute.</p>
        <button className="t-body" style={{ color: 'var(--system-blue)', marginTop: 16 }} onClick={() => setOn({ steps: true, distance: true })}>Attiva tutto</button>
        <p className="t-footnote secondary" style={{ alignSelf: 'flex-start', marginTop: 16, marginLeft: 16 }}>CONSENTI A "MOVITAE" DI LEGGERE</p>
        <div className="health-system__list">
          <label><span className="t-body">Passi</span><input type="checkbox" role="switch" checked={on.steps} onChange={(e) => setOn({ ...on, steps: e.target.checked })} /></label>
          <label><span className="t-body">Distanza camminata e corsa</span><input type="checkbox" role="switch" checked={on.distance} onChange={(e) => setOn({ ...on, distance: e.target.checked })} /></label>
        </div>
        <p className="t-footnote secondary" style={{ marginTop: 12, padding: '0 16px' }}>Spiegazione dell'app: Contiamo i tuoi passi per la missione del giorno.</p>
      </div>
    </motion.div>
  );
}
