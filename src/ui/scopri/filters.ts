import { activities, days, euro, shelfSports, venueOf, type Activity, type Sport } from '../../data/data';

/** Filtri di Scopri (flusso A: flusso-filtri/1–4, errori/5). */
export type Moment = 'mattina' | 'pomeriggio' | 'sera';
export type Filters = {
  sports: Sport[];
  indoor: boolean | null;     // "Dove": Tutti (null) non conta come filtro
  maxPrice: number | null;    // € a persona, 0–60; null = nessun limite (€60+)
  maxDist: number | null;     // km, 0,5–10; null = nessun limite
  day: string | null;         // id del giorno (days)
  moment: Moment | null;
  venue: string | null;       // scelta dalla ricerca ("Zen Studio")
};
export const NO_FILTERS: Filters = { sports: [], indoor: null, maxPrice: null, maxDist: null, day: null, moment: null, venue: null };

export const dist = (a: Activity) => { const s = venueOf(a).distance; const n = parseFloat(s.replace(',', '.')); return s.includes('km') ? n : n / 1000; };
export const unitPrice = (a: Activity) => a.pricePerPerson ?? a.price;
const MOMENTS: Record<Moment, [number, number]> = { mattina: [0, 12 * 60], pomeriggio: [12 * 60, 18 * 60], sera: [18 * 60, 24 * 60] };
const hm = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

export const matches = (a: Activity, f: Filters, skip?: keyof Filters) => {
  if (skip !== 'sports' && f.sports.length && !f.sports.includes(a.sport)) return false;
  if (skip !== 'indoor' && f.indoor != null && a.indoor !== f.indoor) return false;
  if (skip !== 'maxPrice' && f.maxPrice != null && unitPrice(a) > f.maxPrice) return false;
  if (skip !== 'maxDist' && f.maxDist != null && dist(a) > f.maxDist + 0.001) return false;
  if (skip !== 'venue' && f.venue && a.venueId !== f.venue) return false;
  if (skip !== 'moment' && f.moment) {
    const [a0, a1] = MOMENTS[f.moment];
    if (!a.slots.some((s) => { const m = hm(s.time); return m >= a0 && m < a1 && !(s.soldOut && (f.day ?? 'oggi') === 'oggi'); })) return false;
  }
  return true;
};
export const apply = (f: Filters, skip?: keyof Filters) => activities.filter((a) => matches(a, f, skip));

/** Quanti filtri sono attivi (numero sul pulsante): "Tutti" e nessun limite non contano. */
export const countFilters = (f: Filters) =>
  (f.sports.length ? 1 : 0) + (f.indoor != null ? 1 : 0) + (f.maxPrice != null ? 1 : 0) + (f.maxDist != null ? 1 : 0) + (f.day || f.moment ? 1 : 0) + (f.venue ? 1 : 0);

const sportLabel = (s: Sport) => shelfSports.find((x) => x.sport === s)?.label ?? { tennis: 'Tennis', boxe: 'Boxe', corsa: 'Corsa', pilates: 'Pilates', 'arti-marziali': 'Arti marziali' }[s as string] ?? s;
const kmLabel = (k: number) => (k < 1 ? `${Math.round(k * 1000)} m` : `${String(k).replace('.', ',')} km`);
const whenLabel = (f: Filters) => {
  const d = f.day ? days.find((x) => x.id === f.day)! : null;
  if (!d && f.moment) return f.moment === 'sera' ? 'stasera' : f.moment === 'mattina' ? 'stamattina' : 'oggi pomeriggio';
  if (d && !f.moment) return d.id === 'oggi' ? 'oggi' : d.short;
  if (d && f.moment) return d.id === 'oggi' ? (f.moment === 'sera' ? 'stasera' : `oggi ${f.moment}`) : `${d.short}, ${f.moment}`;
  return '';
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Riassunto sotto la ricerca: "Fino a €15", "Padel, fino a €10, 1 km". */
export function summary(f: Filters, venueName?: string) {
  const parts: string[] = [];
  if (venueName) parts.push(venueName);
  if (f.sports.length) parts.push(f.sports.length > 2 ? `${f.sports.length} sport` : f.sports.map(sportLabel).join(', '));
  if (f.indoor != null) parts.push(f.indoor ? 'al chiuso' : 'all’aperto');
  if (f.maxPrice != null) parts.push(`fino a ${euro(f.maxPrice)}`);
  const w = whenLabel(f); if (w) parts.push(w);
  if (f.maxDist != null) parts.push(kmLabel(f.maxDist));
  return cap(parts.join(', '));
}

/** Titolo della lista: "24 attività vicino a te", "17 attività fino a €15", "19 attività entro 2 km". */
export function listTitle(n: number, f: Filters, denied: boolean) {
  const c = countFilters(f);
  const base = `${n} ${n === 1 ? 'attività' : 'attività'}`;
  if (c === 0) return `${base} ${denied ? 'a Roma' : 'vicino a te'}`;
  if (c === 1 && f.maxPrice != null) return `${base} fino a ${euro(f.maxPrice)}`;
  if (c === 1 && f.maxDist != null) return `${base} entro ${kmLabel(f.maxDist)}`;
  return base;
}
export { kmLabel };
