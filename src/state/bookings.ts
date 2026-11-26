import { useSyncExternalStore } from 'react';

// Prenotazioni fatte nel prototipo (in memoria): la Home mostra l'ultima come "Prossima prenotazione".
export type Booking = { id: string; activityId: string; dayId: string; time: string; voucher: boolean; paid: number; points: number };
let list: Booking[] = [];
const subs = new Set<() => void>();
export const bookings = {
  add(b: Omit<Booking, 'id'>) { const nb = { ...b, id: String(Date.now()) }; list = [nb, ...list]; subs.forEach((f) => f()); return nb; },
  get: (id: string) => list.find((b) => b.id === id),
  all: () => list,
};
export const useBookings = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => list);

// Saldo dopo i buoni usati nel prototipo (i punti delle prenotazioni arrivano solo al check-in).
export const balance = (all: Booking[], startPoints: number, startSaved: number) => {
  const used = all.filter((b) => b.voucher).length;
  return { points: startPoints - used * 2500, saved: startSaved + used * 5, vouchersUsed: used };
};
