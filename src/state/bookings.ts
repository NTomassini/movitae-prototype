import { useSyncExternalStore } from 'react';
import { applyProfile } from '../data/profile';

/**
 * Stato del prototipo (Q32): salvato sul telefono (localStorage), così l'app resta coerente
 * tra un'apertura e l'altra. "Ripristina demo" (Impostazioni o pannello demo) torna allo stato iniziale di Marco.
 * Gli stati difficili da provocare (Q33) stanno in `demo` e si cambiano dal pannello demo.
 */
export type Booking = {
  id: string; activityId: string; dayId: string; time: string; voucher: boolean; paid: number; points: number;
  status?: 'upcoming' | 'checked-in' | 'cancelled';
  refunded?: boolean;      // disdetta entro il limite: soldi e buono tornano
  seed?: boolean;          // prenotazioni già presenti nei dati di Marco (punti già nel saldo)
  pastLabel?: string;      // per le passate: "Mar 10 nov, 19:00"
};
export type Demo = {
  mission: 'active' | 'first-day' | 'no-health' | 'completed' | 'completed-7';
  location: 'granted' | 'denied';
  network: 'online' | 'offline';
  payment: 'ok' | 'fail';
  soldOut: boolean;
  clock: 'before' | 'after'; // ora del prototipo: prima o dopo il limite di disdetta gratuita (2 ore prima)
  emailCode: 'ok' | 'wrong'; // onboarding con email: il codice inserito è giusto o sbagliato (errori/1)
  iosNotifications: 'on' | 'off'; // notifiche dell'app accese o spente nelle Impostazioni di iPhone (conferme/6)
};
/** Documenti (Q41): certificato medico personale e moduli firmati per struttura. Date in formato AAAA-MM-GG. */
export type Certificate = { type: 'non' | 'ago'; issued: string; expires: string };
export type Docs = { certificate: Certificate | null; forms: Record<string, string> };
export const NOTIFS = ['Missione del mattino', 'Missione completata', 'Pausa usata', 'Buono pronto', 'Promemoria lezioni', 'Orario liberato', 'Scadenza certificato'] as const;
export type Settings = { notifs: Record<string, boolean>; missionTime: string; nextGoal: number | null; exportRequested: boolean };
/** Utente nuovo creato dall'onboarding (Q37): sostituisce i dati di Marco finché non si ripristina la demo. */
export type Profile = { name: string; sports: string[]; goal: number; health: boolean };
export type AppState = { favSports: string[] | null; profile: Profile | null; docs: Docs; settings: Settings; bookings: Booking[]; favorites: string[]; onboarded: boolean; voucherActive: boolean; celebrated: string | null; demo: Demo };

// v2 (Q58, 27 nov): l'app parte dall'onboarding finché non hai fatto accesso; la chiave nuova fa ripartire tutti da lì.
const KEY = 'movitae-prototipo-v2';
// nei test automatici (webdriver) si entra già dentro come Marco, a meno di ?fresh nell'indirizzo
const signedInByDefault = typeof navigator !== 'undefined' && navigator.webdriver && !new URLSearchParams(location.search).has('fresh');
export const initialDemo: Demo = { mission: 'active', location: 'granted', network: 'online', payment: 'ok', soldOut: false, clock: 'before', emailCode: 'ok', iosNotifications: 'on' };
const initialSettings = (): Settings => ({ notifs: Object.fromEntries(NOTIFS.map((n) => [n, n !== 'Pausa usata'])), missionTime: '08:00', nextGoal: null, exportRequested: false });
// Prenotazioni di Marco all'avvio (prenotazioni/1 e /2 in Figma)
const seedBookings: Booking[] = [
  { id: 's-yoga', activityId: 'yoga-flow', dayId: 'oggi', time: '18:30', voucher: false, paid: 18, points: 180, status: 'upcoming', seed: true },
  { id: 's-padel', activityId: 'padel-ostiense', dayId: '14', time: '19:30', voucher: false, paid: 52, points: 520, status: 'upcoming', seed: true },
  { id: 's-nuoto', activityId: 'nuoto', dayId: '17', time: '07:30', voucher: false, paid: 12, points: 120, status: 'upcoming', seed: true },
  { id: 's-boxe', activityId: 'boxe', dayId: 'past', time: '19:00', voucher: false, paid: 15, points: 150, status: 'checked-in', seed: true, pastLabel: 'Mar 10 nov, 19:00' },
  { id: 's-pilates', activityId: 'pilates-base', dayId: 'past', time: '18:00', voucher: false, paid: 18, points: 180, status: 'cancelled', refunded: true, seed: true, pastLabel: 'Ven 6 nov, 18:00' },
  { id: 's-palestra', activityId: 'palestra', dayId: 'past', time: '08:00', voucher: false, paid: 12, points: 120, status: 'checked-in', seed: true, pastLabel: 'Lun 2 nov, 08:00' },
];
const initial = (): AppState => ({ favSports: null, profile: null, docs: { certificate: null, forms: {} }, settings: initialSettings(), bookings: seedBookings.map((b) => ({ ...b })), favorites: [], onboarded: signedInByDefault, voucherActive: false, celebrated: null, demo: { ...initialDemo } });

const load = (): AppState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const base = initial();
      // le prenotazioni di partenza ci sono sempre (anche nei salvataggi di prima)
      const bookings: Booking[] = saved.bookings ?? [];
      // (non per l'utente nuovo creato dall'onboarding, che parte senza prenotazioni)
      if (!saved.profile) for (const sb of base.bookings) if (!bookings.some((b) => b.id === sb.id)) bookings.push(sb);
      return { ...base, ...saved, bookings, demo: { ...base.demo, ...(saved.demo ?? {}) }, settings: { ...base.settings, ...(saved.settings ?? {}) }, docs: { ...base.docs, ...(saved.docs ?? {}) } };
    }
  } catch { /* storage non disponibile: si resta in memoria */ }
  return initial();
};
let state: AppState = load();
applyProfile(state.profile);
try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignora */ }
const subs = new Set<() => void>();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignora */ } };
const set = (next: Partial<AppState>) => { state = { ...state, ...next }; save(); subs.forEach((f) => f()); };
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

export const store = {
  get: () => state,
  addBooking(b: Omit<Booking, 'id' | 'status'>) {
    const nb: Booking = { ...b, id: String(Date.now()), status: 'upcoming' };
    set({ bookings: [nb, ...state.bookings], voucherActive: false });
    return nb;
  },
  updateBooking(id: string, patch: Partial<Booking>) { set({ bookings: state.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)) }); },
  toggleFavorite(activityId: string) {
    set({ favorites: state.favorites.includes(activityId) ? state.favorites.filter((x) => x !== activityId) : [...state.favorites, activityId] });
  },
  setDemo(patch: Partial<Demo>) { set({ demo: { ...state.demo, ...patch } }); },
  setOnboarded(v: boolean) { set({ onboarded: v }); },
  setCertificate(c: Certificate | null) { set({ docs: { ...state.docs, certificate: c } }); },
  signForm(venueId: string, date = '2026-11-13') { set({ docs: { ...state.docs, forms: { ...state.docs.forms, [venueId]: date } } }); },
  setDocs(d: Docs) { set({ docs: d }); },
  setSettings(p: Partial<Settings>) { set({ settings: { ...state.settings, ...p } }); },
  /** Sport preferiti cambiati dal profilo (profilo/2): scaffale della Home e riga del profilo */
  setFavoriteSports(sports: string[]) { set({ favSports: sports }); },
  /** flusso C: "Trova un'attività" dallo sheet del buono lo attiva fino al pagamento */
  setVoucherActive(v: boolean) { set({ voucherActive: v }); },
  /** la celebrazione si vede una volta sola per ogni missione completata */
  setCelebrated(key: string | null) { set({ celebrated: key }); },
  reset() { state = initial(); applyProfile(null); save(); subs.forEach((f) => f()); },
  /** fine dell'onboarding: utente nuovo senza prenotazioni, missione al primo giorno o senza Salute */
  finishOnboarding(p: Profile, locationGranted: boolean) {
    applyProfile(p);
    set({ profile: p, favSports: null, bookings: [], favorites: [], voucherActive: false, celebrated: null, onboarded: true,
      demo: { ...state.demo, mission: p.health ? 'first-day' : 'no-health', location: locationGranted ? 'granted' : 'denied' } });
  },
};

export const useAppState = () => useSyncExternalStore(subscribe, () => state);
export const useBookings = () => useAppState().bookings;
export const useDemo = () => useAppState().demo;

// compatibilità con il codice già scritto
export const bookings = {
  add: store.addBooking,
  get: (id: string) => state.bookings.find((b) => b.id === id),
  all: () => state.bookings,
};

/** Saldo dopo i buoni usati e i check-in fatti nel prototipo (le prenotazioni di partenza sono già nel saldo). */
export const balance = (all: Booking[], startPoints: number, startSaved: number) => {
  const mine = all.filter((b) => !b.seed);
  const used = mine.filter((b) => b.voucher && !(b.status === 'cancelled' && b.refunded)).length;
  const checkedIn = mine.filter((b) => b.status === 'checked-in').reduce((s, b) => s + b.points + 50, 0);
  return { points: startPoints - used * 2500 + checkedIn, saved: startSaved + used * 5, vouchersUsed: used };
};

/** Ordine delle prenotazioni in arrivo: giorno, poi orario. */
const dayOrder = ['oggi', '14', '15', '16', '17'];
export const upcoming = (all: Booking[]) => all.filter((b) => b.status === 'upcoming')
  .sort((a, b) => dayOrder.indexOf(a.dayId) - dayOrder.indexOf(b.dayId) || a.time.localeCompare(b.time));
export const past = (all: Booking[]) => [
  ...all.filter((b) => b.status !== 'upcoming' && !b.seed),
  ...all.filter((b) => b.status !== 'upcoming' && b.seed),
];
/** Punti della riga "Check-in fatto · +N pt": 10 per € pagato + 50 del check-in. */
export const checkInPoints = (b: Booking) => b.points + 50;
