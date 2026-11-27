import { HapticLayer } from '../ui/booking/BookingParts';
import { useEffect, useRef, useState } from 'react';

/** Focus dopo l'entrata della schermata e senza far scorrere la cornice (autoFocus durante il push la spostava). */
const useLateFocus = () => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { const t = setTimeout(() => ref.current?.focus({ preventScroll: true }), 480); return () => clearTimeout(t); }, []);
  return ref;
};
import { useParams } from 'react-router-dom';
import { useNav } from '../app/nav';
import { AnimatePresence, motion } from 'motion/react';
import { useScreenChrome } from '../app/chrome';
import { ScreenOverlay } from '../app/ScreenOverlay';
import { fmtPoints, pickSports } from '../data/data';
import { GOALS } from '../data/profile';
import { store, useDemo } from '../state/bookings';
import { chat } from '../state/movi';
import { Icon } from '../ui/Icon';
import { Img } from '../ui/Img';
import { AppleLogo } from '../ui/booking/BookingParts';
import { HealthSystemSheet } from '../ui/mission/Mission';
import '../ui/page-header.css';
import './OnboardingScreen.css';

/**
 * Onboarding (DS · Schermate, riga y 200 e y 1320): intro 1–3 → crea account (Apple, Google, email:
 * email → codice → nome) → sport preferiti → Salute → posizione → obiettivo passi (o "Quanto cammini?"
 * se rifiuti Salute) → benvenuto → Home da utente nuovo (Q37). Si apre solo con ?onboarding o dal
 * pannello demo (Q36 B). "Accedi" = sei già cliente: Home completa di Marco (Q38).
 */
const ORDER = ['intro', 'account', 'email', 'codice', 'nome', 'sport', 'salute', 'posizione', 'obiettivo', 'quanto', 'benvenuto'] as const;
type Step = (typeof ORDER)[number];
// tratto della barra di avanzamento (5 tratti): account 1, sport 2, Salute 3, posizione 4, obiettivo 5
const PROGRESS: Partial<Record<Step, number>> = { account: 1, email: 1, codice: 1, nome: 1, sport: 2, salute: 3, posizione: 4, obiettivo: 5, quanto: 5 };

type Draft = { email: string; name: string; sports: string[]; health: boolean; location: boolean; goal: number; walk: number | null };
const KEY = 'movitae-onboarding';
const fresh = (): Draft => ({ email: '', name: '', sports: [], health: true, location: true, goal: 6000, walk: null });
const loadDraft = (): Draft => { try { return { ...fresh(), ...JSON.parse(sessionStorage.getItem(KEY) || '{}') }; } catch { return fresh(); } };

const WALK = [
  { title: 'Poco', text: 'Lavoro seduto e mi sposto quasi sempre in auto o con i mezzi.', goal: 4000 },
  { title: 'Abbastanza', text: 'Cammino un po’ ogni giorno, per andare al lavoro o fare la spesa.', goal: 6000 },
  { title: 'Tanto', text: 'Passo molte ore in piedi o cammino a lungo quasi ogni giorno.', goal: 8000 },
];

let lastIndex = 0;

export function OnboardingScreen() {
  const { step = 'intro' } = useParams();
  const s = (ORDER.includes(step as Step) ? step : 'intro') as Step;
  const navigate = useNav();
  useScreenChrome({ tabBar: false, bottomEdge: false, pageScroll: false });
  const [draft, setDraftState] = useState<Draft>(loadDraft);
  const setDraft = (p: Partial<Draft>) => setDraftState((d) => { const n = { ...d, ...p }; try { sessionStorage.setItem(KEY, JSON.stringify(n)); } catch { /* ignora */ } return n; });

  // ogni volta che si riparte dall'intro, le scelte si azzerano
  useEffect(() => { if (s === 'intro') { try { sessionStorage.removeItem(KEY); } catch { /* ignora */ } setDraftState(fresh()); } }, [s]);
  // verso: avanti = la pagina nuova entra da destra (push iOS), indietro = esce verso destra
  const idx = ORDER.indexOf(s);
  const dir = idx >= lastIndex ? 1 : -1;
  useEffect(() => { lastIndex = idx; }, [idx]);
  const go = (to: Step) => navigate(`/onboarding/${to}`);
  const back = () => navigate(-1);

  const finish = () => {
    store.finishOnboarding({ name: draft.name.trim() || 'Marco', sports: draft.sports, goal: draft.health ? draft.goal : (draft.walk ?? 6000), health: draft.health }, draft.location);
    chat.reset();
    try { sessionStorage.removeItem(KEY); } catch { /* ignora */ }
    navigate('/', { replace: true });
  };
  // Q38: "Accedi" = già cliente → dati completi di Marco
  const signIn = () => { store.reset(); store.setOnboarded(true); chat.reset(); try { sessionStorage.removeItem(KEY); } catch { /* ignora */ } navigate('/', { replace: true }); };

  const screens: Record<Step, () => React.ReactNode> = {
    intro: () => <Intro onDone={() => go('account')} onSignIn={signIn} />,
    account: () => <Account onApple={() => go('sport')} onGoogle={() => go('sport')} onEmail={() => go('email')} />,
    email: () => <EmailStep value={draft.email} onNext={(email) => { setDraft({ email }); go('codice'); }} />,
    codice: () => <CodeStep email={draft.email || 'marco.rossi@icloud.com'} onNext={() => go('nome')} />,
    nome: () => <NameStep value={draft.name} onNext={(name) => { setDraft({ name }); go('sport'); }} />,
    sport: () => <SportStep value={draft.sports} onChange={(sports) => setDraft({ sports })} onNext={() => go('salute')} />,
    salute: () => <HealthStep onDone={(health) => { setDraft({ health }); go('posizione'); }} />,
    posizione: () => <LocationStep onDone={(location) => { setDraft({ location }); go(draft.health ? 'obiettivo' : 'quanto'); }} />,
    obiettivo: () => <GoalStep value={draft.goal} onChange={(goal) => setDraft({ goal })} onNext={() => go('benvenuto')} />,
    quanto: () => <WalkStep value={draft.walk} onChange={(walk) => setDraft({ walk })} onNext={() => go('benvenuto')} />,
    benvenuto: () => <Welcome name={draft.name.trim() || 'Marco'} health={draft.health} goal={draft.goal} onStart={finish} />,
  };

  const p = PROGRESS[s];
  return (
    <div className="onb-stack">
      <AnimatePresence initial={false} custom={dir}>
        <motion.div key={s} className="onb" custom={dir} variants={push} initial="enter" animate="center" exit="exit"
          transition={{ type: 'spring', visualDuration: 0.45, bounce: 0 }}>
          {p && (
            <div className="onb__bar">
              <button className="back-button pressable" aria-label="Indietro" onClick={back}><Icon name="UI/Chevron-Left" size={24} /></button>
              <div className="onb-steps" role="progressbar" aria-valuemin={1} aria-valuemax={5} aria-valuenow={p} aria-label={`Passo ${p} di 5`}>
                {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= p ? 'is-on' : ''} />)}
              </div>
            </div>
          )}
          {screens[s]()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const push = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-30%', zIndex: d > 0 ? 2 : 1 }),
  center: { x: 0, zIndex: 2 },
  exit: (d: number) => ({ x: d > 0 ? '-30%' : '100%', zIndex: d > 0 ? 1 : 3 }),
};

// ---------- parti comuni ----------
/** Altezza della tastiera sul telefono (visualViewport): "Continua" resta 16 sopra, come in Figma (errori/1). */
function useKeyboardInset() {
  const [k, setK] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport; if (!vv) return;
    const on = () => setK(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    vv.addEventListener('resize', on); vv.addEventListener('scroll', on);
    return () => { vv.removeEventListener('resize', on); vv.removeEventListener('scroll', on); };
  }, []);
  return k;
}
function Primary({ children, onPress, disabled, busy }: { children: React.ReactNode; onPress: () => void; disabled?: boolean; busy?: boolean }) {
  const kb = useKeyboardInset();
  return (
    <button className="button button--primary t-headline onb__cta" disabled={disabled} aria-busy={busy} onClick={onPress} style={kb > 80 ? { bottom: kb + 16 } : undefined}>
      {children}
    </button>
  );
}
function Head({ title, text }: { title: string; text: React.ReactNode }) {
  return (
    <div className="onb__head">
      <h1 className="t-title-1">{title}</h1>
      <p className="t-body secondary">{text}</p>
    </div>
  );
}
function Checks({ items }: { items: string[] }) {
  return (
    <ul className="onb-checks">
      {items.map((t) => <li key={t}><span className="onb-check"><Icon name="UI/Check" size={14} /></span><span className="t-body">{t}</span></li>)}
    </ul>
  );
}
function Radio({ on }: { on: boolean }) {
  return <span className={`onb-radio${on ? ' is-on' : ''}`} aria-hidden="true">{on && <Icon name="UI/Check" size={14} />}</span>;
}

// ---------- 1–3 intro ----------
const INTRO = [
  { img: 'img/intro-muoviti', size: 360, title: 'Muoviti ogni giorno', text: 'Ogni giorno hai una missione di passi pensata per te. Per completarla basta camminare.' },
  { img: 'img/intro-prenota', size: 336, title: 'Prenota vicino a te', text: 'Padel, yoga, nuoto e molto altro: trovi l’attività sulla mappa e prenoti in pochi tocchi.' },
  { img: 'img/intro-risparmi', size: 336, title: 'Più prenoti, più risparmi', text: 'Ogni prenotazione ti dà punti in base a quanto paghi. Con i punti sblocchi buoni da €5 a €100.' },
];
function Intro({ onDone, onSignIn }: { onDone: () => void; onSignIn: () => void }) {
  const strip = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  useEffect(() => {
    const el = strip.current; if (!el) return;
    const on = () => setPage(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, []);
  const next = () => { const el = strip.current!; if (page < 2) el.scrollTo({ left: (page + 1) * el.clientWidth, behavior: 'smooth' }); else onDone(); };
  return (
    <>
      <button className="onb__signin t-headline" onClick={onSignIn}>Accedi</button>
      <div className="onb-intro" ref={strip}>
        {INTRO.map((p) => (
          <section key={p.title} className="onb-intro__page" aria-label={p.title}>
            <Img name={p.img} style={{ width: p.size, height: p.size, marginTop: p.size === 360 ? 0 : 12 }} />
            <h1 className="t-title-1" style={{ marginTop: p.size === 360 ? 32 : 44 }}>{p.title}</h1>
            <p className="t-body secondary">{p.text}</p>
          </section>
        ))}
      </div>
      <div className="onb-dots" aria-hidden="true">{INTRO.map((_, i) => <span key={i} className={i === page ? 'is-on' : ''} />)}</div>
      <Primary onPress={next}>{page < 2 ? 'Avanti' : 'Inizia'}</Primary>
    </>
  );
}

// ---------- 4 crea account ----------
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);
function Account({ onApple, onGoogle, onEmail }: { onApple: () => void; onGoogle: () => void; onEmail: () => void }) {
  const [busy, setBusy] = useState<'apple' | 'google' | null>(null);
  // Q38: niente fogli di Apple o Google finti, solo un breve caricamento sul pulsante
  const press = (k: 'apple' | 'google', then: () => void) => { if (busy) return; setBusy(k); setTimeout(then, 700); };
  return (
    <>
      <Head title="Crea il tuo account" text="Bastano pochi secondi: punti, buoni e prenotazioni saranno sempre con te." />
      <div className="onb-signup">
        <button className="onb-sso onb-sso--apple t-headline" onClick={() => press('apple', onApple)} aria-busy={busy === 'apple'}>
          {busy === 'apple' ? <span className="onb-spinner" /> : <><AppleLogo /><span>Continua con Apple</span></>}
        </button>
        <button className="onb-sso onb-sso--google t-headline" onClick={() => press('google', onGoogle)} aria-busy={busy === 'google'}>
          {busy === 'google' ? <span className="onb-spinner" /> : <><GoogleLogo /><span>Continua con Google</span></>}
        </button>
        <button className="onb-sso onb-sso--email t-headline" onClick={onEmail}>Continua con email</button>
      </div>
      <p className="onb-terms t-footnote">Continuando accetti i Termini di servizio e l’Informativa sulla privacy.</p>
    </>
  );
}

// ---------- email (Q39) ----------
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="onb-field">
      <label className="t-footnote-emphasized secondary">{label}{children}</label>
      {error && <p className="onb-error t-subheadline" role="alert"><Icon name="UI/Alert" size={16} />{error}</p>}
    </div>
  );
}
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
function EmailStep({ value, onNext }: { value: string; onNext: (v: string) => void }) {
  const focusRef = useLateFocus();
  const [v, setV] = useState(value);
  const ok = validEmail(v);
  return (
    <form className="onb-form" onSubmit={(e) => { e.preventDefault(); if (ok) onNext(v.trim()); }}>
      <Head title="Qual è la tua email?" text="Ti mandiamo un codice per entrare: niente password da ricordare." />
      <Field label="Email">
        <input ref={focusRef} className="onb-input t-body" type="email" inputMode="email" autoComplete="email" value={v} onChange={(e) => setV(e.target.value)} placeholder="nome@esempio.it" />
      </Field>
      <Primary onPress={() => ok && onNext(v.trim())} disabled={!ok}>Continua</Primary>
    </form>
  );
}
function CodeStep({ email, onNext }: { email: string; onNext: () => void }) {
  const focusRef = useLateFocus();
  const demo = useDemo();
  const [v, setV] = useState('');
  const [error, setError] = useState(false);
  const digits = v.replace(/\D/g, '');
  const ok = digits.length === 6;
  const fmt = (x: string) => { const d = x.replace(/\D/g, '').slice(0, 6); return d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d; };
  const submit = () => { if (!ok) return; if (demo.emailCode === 'wrong') { setError(true); return; } onNext(); };
  return (
    <form className="onb-form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <Head title="Controlla la tua email" text={`Il codice è nella mail che arriva a ${email}.`} />
      <Field label="Codice" error={error ? 'Il codice non è giusto. Controlla l’ultima email o fattene mandare un altro.' : undefined}>
        <input className={`onb-input t-body${error ? ' is-error' : ''}`} inputMode="numeric" autoComplete="one-time-code" ref={focusRef} value={v}
          onChange={(e) => { setV(fmt(e.target.value)); setError(false); }} aria-invalid={error} />
      </Field>
      <button type="button" className="onb-link t-headline" onClick={() => { setV(''); setError(false); }}>Invia di nuovo il codice</button>
      <Primary onPress={submit} disabled={!ok}>Continua</Primary>
    </form>
  );
}
function NameStep({ value, onNext }: { value: string; onNext: (v: string) => void }) {
  const focusRef = useLateFocus();
  const [v, setV] = useState(value);
  const ok = v.trim().length >= 2;
  return (
    <form className="onb-form" onSubmit={(e) => { e.preventDefault(); if (ok) onNext(v.trim()); }}>
      <Head title="Come ti chiami?" text="Lo usiamo per salutarti e sui biglietti delle prenotazioni." />
      <Field label="Nome">
        <input className="onb-input t-body" autoComplete="given-name" autoCapitalize="words" ref={focusRef} value={v} onChange={(e) => setV(e.target.value)} />
      </Field>
      <Primary onPress={() => ok && onNext(v.trim())} disabled={!ok}>Continua</Primary>
    </form>
  );
}

// ---------- 5 sport preferiti ----------
function SportStep({ value, onChange, onNext }: { value: string[]; onChange: (v: string[]) => void; onNext: () => void }) {
  const toggle = (s: string) => onChange(value.includes(s) ? value.filter((x) => x !== s) : [...value, s]);
  return (
    <>
      <Head title="Che sport ti piacciono?" text="Scegline quanti vuoi: li mettiamo per primi in Home e nelle ricerche." />
      <div className="onb-sports" role="group" aria-label="Sport preferiti">
        {pickSports.map((s) => {
          const on = value.includes(s.sport);
          return (
            <button key={s.sport} className={`onb-sport pressable${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggle(s.sport)}>
              <Img name={s.image} style={{ width: 56, height: 56 }} />
              <span className={on ? 't-subheadline-emphasized' : 't-subheadline-emphasized'}>{s.label}</span>
              {on && <span className="onb-sport__check"><Icon name="UI/Check" size={14} /></span>}
              <HapticLayer />
            </button>
          );
        })}
      </div>
      <Primary onPress={onNext} disabled={!value.length}>Continua</Primary>
    </>
  );
}

// ---------- 6 Salute ----------
function HealthStep({ onDone }: { onDone: (health: boolean) => void }) {
  const [sheet, setSheet] = useState(false);
  return (
    <>
      <div className="onb-center">
        <Img name="img/orme" style={{ width: 140, height: 140 }} />
        <h1 className="t-title-1">Conta i passi con Salute</h1>
        <p className="t-body secondary">Così la missione di ogni giorno si aggiorna da sola e i punti arrivano appena la completi.</p>
      </div>
      <Checks items={['Leggiamo solo passi e distanza.', 'Non modifichiamo i tuoi dati in Salute.', 'Puoi scollegarla da Impostazioni.']} />
      <Primary onPress={() => setSheet(true)}>Continua</Primary>
      <ScreenOverlay>
        <AnimatePresence>
          {sheet && <HealthSystemSheet key="h" onAllow={() => { setSheet(false); setTimeout(() => onDone(true), 250); }} onDeny={() => { setSheet(false); setTimeout(() => onDone(false), 250); }} />}
        </AnimatePresence>
      </ScreenOverlay>
    </>
  );
}

// ---------- 6b–6c posizione ----------
function LocationStep({ onDone }: { onDone: (granted: boolean) => void }) {
  const [alert, setAlert] = useState(false);
  const pick = (g: boolean) => { setAlert(false); setTimeout(() => onDone(g), 220); };
  return (
    <>
      <div className="onb-center">
        <Img name="img/pin" style={{ width: 140, height: 140 }} />
        <h1 className="t-title-1">Trova attività vicino a te</h1>
        <p className="t-body secondary">Ti mostriamo campi, corsi e piscine in base a dove sei.</p>
      </div>
      <Checks items={['La usiamo solo mentre usi l’app.', 'Non la mostriamo alle strutture.', 'Puoi cambiarla da Impostazioni di iPhone.']} />
      <Primary onPress={() => setAlert(true)}>Continua</Primary>
      <ScreenOverlay>
        <AnimatePresence>
          {alert && <motion.div key="s" className="onb-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />}
          {alert && (
            <motion.div key="a" className="permission-alert" role="alertdialog" aria-modal="true" aria-labelledby="perm-title"
              initial={{ opacity: 0, scale: 1.12, x: '-50%', y: '-50%' }} animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }} exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }}
              transition={{ type: 'spring', visualDuration: 0.3, bounce: 0.1 }}>
              <h2 id="perm-title" className="t-headline">Vuoi consentire a “Movitae” di usare la tua posizione?</h2>
              <p className="t-footnote">Ti mostriamo le attività vicino a te.</p>
              <div className="permission-alert__map" aria-hidden="true"><i className="park" /><i className="road-h" /><i className="road-v" /><span className="dot" /></div>
              <button className="t-headline" onClick={() => pick(true)}>Consenti una volta</button>
              <button className="t-headline" onClick={() => pick(true)}>Consenti mentre usi l’app</button>
              <button className="t-headline" onClick={() => pick(false)}>Non consentire</button>
            </motion.div>
          )}
        </AnimatePresence>
      </ScreenOverlay>
    </>
  );
}

// ---------- 7 obiettivo passi / 7b quanto cammini ----------
function GoalStep({ value, onChange, onNext }: { value: number; onChange: (v: number) => void; onNext: () => void }) {
  return (
    <>
      <div className="onb-center onb-center--top">
        <Img name="img/bandierina" style={{ width: 96, height: 96 }} />
        <h1 className="t-title-1">Quanti passi al giorno?</h1>
        <p className="t-body secondary" style={{ marginInline: -8 }}>Ti consigliamo 6.000 passi. Puoi cambiare obiettivo quando vuoi da Impostazioni.</p>
      </div>
      <div className="onb-goals card" role="radiogroup" aria-label="Obiettivo di passi">
        {GOALS.map((g, i) => {
          const on = g.steps === value;
          return (
            <div key={g.steps}>
              {i > 0 && <div className="onb-goals__sep" />}
              <button role="radio" aria-checked={on} className="onb-goal" onClick={() => onChange(g.steps)}>
                <span className={on ? 't-headline' : 't-body'}>{fmtPoints(g.steps)} passi</span>
                {g.steps === 6000 && <span className="onb-tag t-footnote-emphasized">Consigliato</span>}
                <span className="onb-goal__pts t-subheadline-emphasized">+{g.points} pt</span>
                <Radio on={on} />
              </button>
            </div>
          );
        })}
      </div>
      <Primary onPress={onNext}>Mi impegno</Primary>
    </>
  );
}
function WalkStep({ value, onChange, onNext }: { value: number | null; onChange: (v: number) => void; onNext: () => void }) {
  return (
    <>
      <div className="onb-center onb-center--top">
        <Img name="img/orme" style={{ width: 72, height: 72 }} />
        <h1 className="t-title-1">Quanto cammini in una giornata normale?</h1>
        <p className="t-body secondary">Scegli la frase che ti somiglia di più. Partiamo da lì con l’obiettivo, e puoi cambiarlo quando vuoi.</p>
      </div>
      <div className="onb-walk" role="radiogroup" aria-label="Quanto cammini">
        {WALK.map((w) => {
          const on = value === w.goal;
          return (
            <button key={w.title} role="radio" aria-checked={on} className={`onb-walk__card pressable${on ? ' is-on' : ''}`} onClick={() => onChange(w.goal)}>
              <span className="onb-walk__text">
                <span className="t-headline">{w.title}</span>
                <span className="t-subheadline secondary">{w.text}</span>
                <span className="t-footnote-emphasized" style={{ marginTop: 6 }}>Obiettivo: {fmtPoints(w.goal)} passi</span>
              </span>
              <Radio on={on} />
            </button>
          );
        })}
      </div>
      <Primary onPress={onNext} disabled={value == null}>Continua</Primary>
    </>
  );
}

// ---------- 8 benvenuto ----------
function Welcome({ name, health, goal, onStart }: { name: string; health: boolean; goal: number; onStart: () => void }) {
  return (
    <>
      <div className="onb-welcome">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', visualDuration: 0.5, bounce: 0.3, delay: 0.15 }}>
          <Img name="img/movi-saluto" style={{ width: 240, height: 240 }} />
        </motion.div>
        <h1 className="t-large-title">Benvenuto, {name}!</h1>
        <p className="t-body secondary">
          {health
            ? `La prima missione è già pronta: ${fmtPoints(goal)} passi oggi. Alla prima prenotazione ricevi anche 500 punti di benvenuto.`
            : 'Collega Salute quando vuoi dalla Home per iniziare la missione. Alla prima prenotazione ricevi 500 punti di benvenuto.'}
        </p>
      </div>
      <Primary onPress={onStart}>Inizia</Primary>
    </>
  );
}
