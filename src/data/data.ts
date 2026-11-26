// Dati finti del prototipo: unica fonte per schermate, video e caso studio (claude/movitae-dati-prototipo.md).
// Distanze come nelle bozze (da Testaccio, posizione di Marco); coordinate approssimate delle vie, da verificare sulla mappa.

export type Sport = 'padel' | 'yoga' | 'pilates' | 'palestra' | 'nuoto' | 'calcio' | 'tennis' | 'basket' | 'boxe' | 'corsa' | 'arti-marziali';

export const user = {
  name: 'Marco',
  fullName: 'Marco Rossi',
  initial: 'M',
  memberSince: 'settembre 2026',
  location: { lat: 41.8768, lng: 12.4757, label: 'Testaccio' },
  favoriteSports: ['padel', 'yoga', 'nuoto'] as Sport[],
  points: 2700,
  saved: 25,
  streak: 5,
  bestStreak: 12,
  pauses: 1,
  mission: { goal: 6000, steps: 4120, points: 7 },
  healthConnected: true,
  locationGranted: true,
};

export type Venue = { id: string; name: string; street: string; city: string; lat: number; lng: number; distance: string; documents?: 'certificate' | 'form' };

export const venues: Venue[] = [
  { id: 'zen', name: 'Zen Studio', street: 'Via Marmorata 12', city: 'Roma', lat: 41.8797, lng: 12.4774, distance: '600 m' },
  { id: 'palestra-testaccio', name: 'Palestra Testaccio', street: 'Via Zabaglia 8', city: 'Roma', lat: 41.879, lng: 12.4745, distance: '800 m' },
  { id: 'fitlab', name: 'FitLab Testaccio', street: 'Via Galvani 24', city: 'Roma', lat: 41.8762, lng: 12.4728, distance: '900 m', documents: 'form' },
  { id: 'sporting-testaccio', name: 'Sporting Testaccio', street: 'Via Galvani 42', city: 'Roma', lat: 41.8755, lng: 12.4715, distance: '900 m' },
  { id: 'dojo', name: 'Dojo Aventino', street: 'Via di San Saba 10', city: 'Roma', lat: 41.8805, lng: 12.4885, distance: '950 m' },
  { id: 'padel-ostiense', name: 'Padel Ostiense', street: 'Via Ostiense 131', city: 'Roma', lat: 41.8653, lng: 12.4789, distance: '1,2 km' },
  { id: 'piscina-aventino', name: 'Piscina Aventino', street: 'Viale Aventino 32', city: 'Roma', lat: 41.881, lng: 12.4861, distance: '1,4 km', documents: 'certificate' },
  { id: 'padel-aventino', name: 'Padel Aventino', street: 'Via Aventina 20', city: 'Roma', lat: 41.882, lng: 12.485, distance: '1,6 km' },
  { id: 'cs-ostiense', name: 'Centro Sportivo Ostiense', street: 'Via del Porto Fluviale 20', city: 'Roma', lat: 41.868, lng: 12.4765, distance: '1,8 km' },
];

export type Slot = { time: string; soldOut?: boolean };
export type Activity = {
  id: string; title: string; sport: Sport; venueId: string; photo: string;
  price: number; pricePerPerson?: number; people?: number; points: number;
  duration: string; slots: Slot[]; indoor: boolean;
};

export const activities: Activity[] = [
  { id: 'yoga-flow', title: 'Yoga Flow', sport: 'yoga', venueId: 'zen', photo: 'foto/yoga', price: 18, points: 180, duration: '60 min', indoor: true, slots: [{ time: '18:30' }, { time: '19:30' }, { time: '20:30', soldOut: true }] },
  { id: 'yoga-tramonto', title: 'Yoga al tramonto', sport: 'yoga', venueId: 'zen', photo: 'foto/yoga-tramonto', price: 18, points: 180, duration: '60 min', indoor: false, slots: [{ time: '19:00' }, { time: '20:00' }] },
  { id: 'pilates-base', title: 'Pilates base', sport: 'pilates', venueId: 'zen', photo: 'foto/pilates', price: 18, points: 180, duration: '50 min', indoor: true, slots: [{ time: '18:00' }, { time: '19:00' }] },
  { id: 'boxe', title: 'Boxe per iniziare', sport: 'boxe', venueId: 'palestra-testaccio', photo: 'foto/arti-marziali', price: 15, points: 150, duration: '60 min', indoor: true, slots: [{ time: '19:00' }, { time: '20:00' }] },
  { id: 'arti-marziali', title: 'Arti marziali', sport: 'arti-marziali', venueId: 'dojo', photo: 'foto/arti-marziali', price: 15, points: 150, duration: '60 min', indoor: true, slots: [{ time: '20:30' }, { time: '19:00', soldOut: true }] },
  { id: 'padel-ostiense', title: 'Padel, campo da 4', sport: 'padel', venueId: 'padel-ostiense', photo: 'foto/padel', price: 52, pricePerPerson: 13, people: 4, points: 520, duration: '90 min', indoor: false, slots: [{ time: '18:00' }, { time: '19:30' }, { time: '21:00' }] },
  { id: 'padel-aventino', title: 'Padel, campo da 4', sport: 'padel', venueId: 'padel-aventino', photo: 'foto/padel-coperto', price: 52, pricePerPerson: 13, people: 4, points: 520, duration: '90 min', indoor: true, slots: [{ time: '19:00' }, { time: '20:30' }] },
  { id: 'padel-sporting', title: 'Padel, campo da 4', sport: 'padel', venueId: 'sporting-testaccio', photo: 'foto/padel-aperto', price: 48, pricePerPerson: 12, people: 4, points: 480, duration: '90 min', indoor: false, slots: [{ time: '18:30' }, { time: '20:00' }] },
  { id: 'nuoto', title: 'Nuoto libero', sport: 'nuoto', venueId: 'piscina-aventino', photo: 'foto/nuoto', price: 12, points: 120, duration: '60 min', indoor: true, slots: [{ time: '07:30' }, { time: '13:00' }, { time: '19:00' }] },
  { id: 'palestra', title: 'Palestra, ingresso', sport: 'palestra', venueId: 'fitlab', photo: 'foto/palestra', price: 12, points: 120, duration: 'ingresso singolo', indoor: true, slots: [{ time: '08:00' }, { time: '18:00' }] },
  { id: 'calcetto', title: 'Calcetto, campo da 10', sport: 'calcio', venueId: 'cs-ostiense', photo: 'foto/calcetto', price: 70, pricePerPerson: 7, people: 10, points: 700, duration: '60 min', indoor: false, slots: [{ time: '20:00' }, { time: '21:00' }] },
];

export const nearby = ['boxe', 'padel-ostiense', 'yoga-tramonto'];

export const shelfSports: { sport: Sport; label: string; image: string }[] = [
  { sport: 'padel', label: 'Padel', image: 'img/padel' },
  { sport: 'calcio', label: 'Calcio', image: 'img/calcio' },
  { sport: 'palestra', label: 'Palestra', image: 'img/gym' },
  { sport: 'yoga', label: 'Yoga', image: 'img/yoga' },
  { sport: 'basket', label: 'Basket', image: 'img/basket' },
  { sport: 'nuoto', label: 'Nuoto', image: 'img/nuoto' },
];

export const upcomingBooking = { activityId: 'yoga-flow', day: 'Oggi', time: '18:30', end: '19:30', dateLong: 'Venerdì 13 novembre' };

export const venueOf = (a: Activity) => venues.find((v) => v.id === a.venueId)!;
export const activity = (id: string) => activities.find((a) => a.id === id)!;
export const euro = (n: number) => `€${n}`;
// Separatore delle migliaia anche a 4 cifre (6.000), come nelle schermate: Intl it-IT lo omette sotto 10.000.
export const fmtPoints = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
