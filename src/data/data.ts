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
  totalPoints: 6850,
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
  { id: 'boxe', title: 'Boxe per iniziare', sport: 'boxe', venueId: 'palestra-testaccio', photo: 'foto/boxe', price: 15, points: 150, duration: '60 min', indoor: true, slots: [{ time: '19:00' }, { time: '20:00' }] },
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

// Servizi mostrati nella scheda (di esempio, come nelle bozze).
export const services: Record<string, string> = {
  zen: 'Spogliatoi e docce · Tappetini inclusi',
  'palestra-testaccio': 'Spogliatoi e docce · Guantoni a noleggio €2',
  fitlab: 'Spogliatoi e docce · Armadietti',
  'sporting-testaccio': 'Spogliatoi · Racchette a noleggio €3',
  dojo: 'Spogliatoi e docce',
  'padel-ostiense': 'Spogliatoi e docce · Racchette a noleggio €3',
  'piscina-aventino': 'Spogliatoi e docce · Cuffia obbligatoria',
  'padel-aventino': 'Campi coperti · Racchette a noleggio €3',
  'cs-ostiense': 'Spogliatoi e docce · Pettorine',
};

/** Giorni scelti nella scheda: il prototipo vive venerdì 13 novembre. */
export const days = [
  { id: 'oggi', short: 'Oggi', long: 'Venerdì 13 novembre', sentence: 'oggi' },
  { id: '14', short: 'Sab 14', long: 'Sabato 14 novembre', sentence: 'sabato' },
  { id: '15', short: 'Dom 15', long: 'Domenica 15 novembre', sentence: 'domenica' },
  { id: '16', short: 'Lun 16', long: 'Lunedì 16 novembre', sentence: 'lunedì' },
  { id: '17', short: 'Mar 17', long: 'Martedì 17 novembre', sentence: 'martedì' },
];

/** Orario di fine (es. 18:30 + 60 min = 19:30); null per l'ingresso libero. */
export const endTime = (a: Activity, time: string) => {
  const m = parseInt(a.duration, 10);
  if (!m) return null;
  const [hh, mm] = time.split(':').map(Number);
  const t = hh * 60 + mm + m;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};
export const euroCents = (n: number) => `€${n.toFixed(2).replace('.', ',')}`;
export const VOUCHER = { value: 5, points: 2500 };

// Buoni ripetibili (handoff › Punti e premi)
export const vouchers = [
  { id: 'bronzo', name: 'Bronzo', value: 5, points: 2500, image: 'img/buono-bronzo' },
  { id: 'argento', name: 'Argento', value: 20, points: 8000, image: 'img/buono-argento' },
  { id: 'oro', name: 'Oro', value: 50, points: 18000, image: 'img/buono-oro' },
  { id: 'platino', name: 'Platino', value: 100, points: 30000, image: 'img/buono-platino' },
];

// Traguardi (13, non danno punti) — come la tavola premi/2-traguardi-tutti (1461:5459). stars = livello (1–4).
export type Achievement = { id: string; group: 'Serie' | 'Punti' | 'Lezioni' | 'Risparmio'; label: string; title: string; image: string; stars: number; target: number; progress: number; unit: string; unlocked?: string; description: string };
const A = (id: string, group: Achievement['group'], label: string, title: string, image: string, stars: number, target: number, progress: number, unit: string, description: string, unlocked?: string): Achievement => ({ id, group, label, title, image, stars, target, progress, unit, description, unlocked });
export const achievements: Achievement[] = [
  A('serie-7', 'Serie', '7 giorni', '7 giorni di fila', 'img/trSerie', 1, 7, 7, 'giorni', 'Hai completato la missione per 7 giorni di fila.', '10 nov'),
  A('serie-30', 'Serie', '30 giorni', '30 giorni di fila', 'img/trSerie', 2, 30, 5, 'giorni', 'Completa la missione per 30 giorni di fila. Le pause tengono viva la serie.'),
  A('serie-100', 'Serie', '100 giorni', '100 giorni di fila', 'img/trSerie', 3, 100, 5, 'giorni', 'Completa la missione per 100 giorni di fila. Le pause tengono viva la serie.'),
  A('serie-365', 'Serie', '365 giorni', 'Un anno di fila', 'img/trSerie', 4, 365, 5, 'giorni', 'Completa la missione ogni giorno per un anno. Le pause tengono viva la serie.'),
  A('punti-5k', 'Punti', '5.000 pt', '5.000 punti', 'img/trPunti', 1, 5000, 6850, 'pt', 'Hai guadagnato 5.000 punti in totale.', '2 nov'),
  A('punti-25k', 'Punti', '25.000 pt', '25.000 punti', 'img/trPunti', 2, 25000, 6850, 'pt', 'Guadagna 25.000 punti in totale, tra missioni, prenotazioni e check-in.'),
  A('punti-50k', 'Punti', '50.000 pt', '50.000 punti', 'img/trPunti', 3, 50000, 6850, 'pt', 'Guadagna 50.000 punti in totale, tra missioni, prenotazioni e check-in.'),
  A('punti-100k', 'Punti', '100.000 pt', '100.000 punti', 'img/trPunti', 4, 100000, 6850, 'pt', 'Guadagna 100.000 punti in totale, tra missioni, prenotazioni e check-in.'),
  A('lezioni-1', 'Lezioni', 'Prima lezione', 'Prima lezione', 'img/trLezioni', 1, 1, 1, 'lezioni', 'Hai fatto il check-in alla tua prima lezione.', '3 nov'),
  A('lezioni-10', 'Lezioni', '10 lezioni', '10 lezioni', 'img/trLezioni', 2, 10, 4, 'lezioni', 'Fai il check-in a 10 lezioni.'),
  A('sport-3', 'Lezioni', '3 sport', '3 sport diversi', 'img/trLezioni', 3, 3, 2, 'sport', 'Prova 3 sport diversi con un check-in.'),
  A('risparmio-10', 'Risparmio', 'Primi €10', 'Primi €10 risparmiati', 'img/trRisparmio', 1, 10, 25, '€', 'Hai risparmiato i tuoi primi €10 con i buoni.', '8 nov'),
  A('risparmio-50', 'Risparmio', 'Primi €50', 'Primi €50 risparmiati', 'img/trRisparmio', 2, 50, 25, '€', 'Risparmia €50 in totale con i buoni.'),
];
