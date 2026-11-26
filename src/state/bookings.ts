import { useSyncExternalStore } from 'react';

/**
 * Stato del prototipo (Q32): salvato sul telefono (localStorage), così l'app resta coerente
 * tra un'apertura e l'altra. "Ripristina demo" (Impostazioni o pannello demo) torna allo stato iniziale di Marco.
 * Gli stati difficili da provocare (Q33) stanno in `demo` e si cambiano dal pannello demo.
 */
export type Booking = { id: string; activityId: string; dayId: string; time: string; voucher: boolean; paid: number; points: number; status?: 'upcoming' | 'checked-in' | 'cancelled' };
export type Demo = {
  mission: 'active' | 'first-day' | 'no-health' | 'completed';
  location: 'granted' | 'denied';
  network: 'online' | 'offline';
  payment: 'ok' | 'fail';
  soldOut: boolean;
};
export type AppState = { bookings: Booking[]; favorites: string[]; onboarded: boolean; demo: Demo };

const KEY = 'movitae-prototipo-v1';
export const initialDemo: Demo = { mission: 'active', location: 'granted', network: 'online', payment: 'ok', soldOut: false };
const initial = (): AppState => ({ bookings: [], favorites: [], onboarded: true, demo: { ...initialDemo } });

const load = (): AppState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial(), ...JSON.parse(raw) };
  } catch { /* storage non disponibile: si resta in memoria */ }
  return initial();
};
let state: AppState = load();
const subs = new Set<() => void>();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignora */ } };
const set = (next: Partial<AppState>) => { state = { ...state, ...next }; save(); subs.forEach((f) => f()); };
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

export const store = {
  get: () => state,
  addBooking(b: Omit<Booking, 'id' | 'status'>) {
    const nb: Booking = { ...b, id: String(Date.now()), status: 'upcoming' };
    set({ bookings: [nb, ...state.bookings] });
    return nb;
  },
  updateBooking(id: string, patch: Partial<Booking>) { set({ bookings: state.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)) }); },
  toggleFavorite(activityId: string) {
    set({ favorites: state.favorites.includes(activityId) ? state.favorites.filter((x) => x !== activityId) : [...state.favorites, activityId] });
  },
  setDemo(patch: Partial<Demo>) { set({ demo: { ...state.demo, ...patch } }); },
  setOnboarded(v: boolean) { set({ onboarded: v }); },
  reset() { state = initial(); save(); subs.forEach((f) => f()); },
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

/** Saldo dopo i buoni usati (i punti delle prenotazioni arrivano solo al check-in). */
export const balance = (all: Booking[], startPoints: number, startSaved: number) => {
  const live = all.filter((b) => b.status !== 'cancelled' || !b.voucher);
  const used = live.filter((b) => b.voucher).length;
  const checkedIn = all.filter((b) => b.status === 'checked-in').reduce((s, b) => s + b.points + 50, 0);
  return { points: startPoints - used * 2500 + checkedIn, saved: startSaved + used * 5, vouchersUsed: used };
};
