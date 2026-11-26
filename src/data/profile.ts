import { user, type Sport } from './data';
import type { Profile } from '../state/bookings';

// Punti della missione per scaglione (handoff › Punti e premi)
export const GOALS: { steps: number; points: number }[] = [
  { steps: 4000, points: 4 }, { steps: 6000, points: 7 }, { steps: 8000, points: 10 },
  { steps: 10000, points: 14 }, { steps: 12000, points: 18 }, { steps: 15000, points: 25 },
];

// Dati di Marco come nel file dei dati, per tornare indietro con "Ripristina demo" o "Accedi"
const marco = JSON.parse(JSON.stringify(user)) as typeof user;

/** Applica (o toglie) l'utente nuovo dell'onboarding all'oggetto `user` usato da tutte le schermate. */
export function applyProfile(p: Profile | null) {
  Object.assign(user, JSON.parse(JSON.stringify(marco)));
  if (!p) return;
  user.name = p.name;
  user.fullName = p.name;
  user.initial = p.name.charAt(0).toUpperCase();
  user.memberSince = 'novembre 2026';
  user.favoriteSports = p.sports as Sport[];
  user.points = 0; user.totalPoints = 0; user.saved = 0;
  user.streak = 0; user.bestStreak = 0; user.pauses = 0;
  user.healthConnected = p.health;
  user.mission = { goal: p.goal, steps: 0, points: GOALS.find((g) => g.steps === p.goal)?.points ?? 7 };
}
