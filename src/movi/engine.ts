// Movi (Q31): risposte preparate, senza un modello vero. Capisce il più possibile:
// sport e sinonimi, momenti della giornata e giorni, prezzo, al chiuso / all'aperto, vicino,
// "in compagnia", "per rilassarmi", "per sudare", "per iniziare", e le domande sull'app
// (prenotazioni, punti, buoni, missione, disdetta, check-in, documenti). Tutto il resto è fuori tema.
import { activities, days, euro, fmtPoints, user, venueOf, VOUCHER, type Activity, type Sport } from '../data/data';

export const SUGGESTIONS = ['Cosa faccio stasera?', 'Sotto i €15 vicino a me', 'Qualcosa al chiuso', 'Una lezione per domattina'];

export type Card = { activityId: string; dayId: string; slots: string[] };
export type Action = { label: string; to: string };
export type Query = {
  sports?: Sport[]; category?: 'relax' | 'intense' | 'group' | 'beginner';
  dayId: string; from: number; to: number; timePhrase: string; timeGiven: boolean;
  maxPrice?: number; cheap?: boolean; indoor?: boolean; near?: boolean; lessonsOnly?: boolean;
  page: number;
};
export type Reply = {
  text: string; cards?: Card[]; actions?: Action[]; suggestions?: string[];
  /** riga "sta pensando" mostrata prima della risposta (con le card segnaposto se è una ricerca) */
  thinking: string; search: boolean; query?: Query;
};
export type Ctx = { lastQuery?: Query; points: number; upcoming: { activityId: string; dayId: string; time: string }[]; favorites: string[] };

// ---------- testo ----------
const norm = (s: string) => ` ${s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/€/g, ' euro ').replace(/(\d)[.:,](\d\d)\b/g, '$1:$2').replace(/[^a-z0-9: ]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
/** vero se il testo contiene una delle parole (o l'inizio di parola con *) */
const has = (t: string, words: string[]) => words.some((w) => {
  const stem = w.endsWith('*');
  const k = stem ? w.slice(0, -1) : w;
  return new RegExp(` ${k.replace(/ /g, ' ')}${stem ? '' : ' '}`).test(t);
});

// ---------- sport ----------
const SPORT_WORDS: [Sport, string[]][] = [
  ['padel', ['padel', 'paddle', 'padle', 'pade']],
  ['yoga', ['yoga', 'vinyasa', 'hatha', 'ashtanga', 'yogi*']],
  ['pilates', ['pilates', 'reformer', 'pilates*']],
  ['palestra', ['palestra*', 'gym', 'pesi', 'sala pesi', 'fitness', 'body building', 'bodybuilding', 'macchinari', 'tapis roulant', 'crossfit', 'functional', 'funzionale', 'muscol*', 'massa', 'squat']],
  ['nuoto', ['nuot*', 'piscina', 'vasche', 'stile libero', 'rana', 'acquagym']],
  ['calcio', ['calcio', 'calcetto', 'calcio a 5', 'calcio a 8', 'futsal', 'pallone', 'partita*', 'partitella']],
  ['boxe', ['boxe', 'boxing', 'pugilato', 'sacco', 'box']],
  ['arti-marziali', ['arti marziali', 'arte marziale', 'karate', 'judo', 'kick boxing', 'kickboxing', 'kick', 'muay thai', 'thai', 'taekwondo', 'jiu jitsu', 'jujitsu', 'bjj', 'mma', 'kung fu', 'aikido', 'difesa personale', 'autodifesa', 'krav maga']],
];
// sport che Movitae non ha ancora vicino a Marco: proponi l'alternativa più vicina
const MISSING: { words: string[]; name: string; alt: Sport[]; why: string }[] = [
  { words: ['tennis'], name: 'Tennis', alt: ['padel'], why: 'Se ti va la racchetta, prova il padel' },
  { words: ['basket', 'pallacanestro'], name: 'Basket', alt: ['calcio'], why: 'Per giocare in squadra c\'è il calcetto' },
  { words: ['pallavolo', 'volley', 'beach volley'], name: 'Pallavolo', alt: ['calcio', 'padel'], why: 'Per giocare in gruppo ci sono calcetto e padel' },
  { words: ['corsa', 'correre', 'running', 'jogging', 'corsetta', 'maratona'], name: 'Per correre non serve prenotare, ma', alt: ['palestra'], why: 'se vuoi un tapis roulant c\'è la palestra' },
  { words: ['spinning', 'bici', 'bicicletta', 'ciclismo', 'cyclette'], name: 'Spinning', alt: ['palestra'], why: 'Per pedalare c\'è la cyclette in palestra' },
  { words: ['danza', 'ballo', 'ballare', 'zumba', 'salsa', 'hip hop'], name: 'Danza', alt: ['pilates', 'yoga'], why: 'Per muoverti a ritmo lento ci sono pilates e yoga' },
  { words: ['arrampicata', 'climbing', 'boulder'], name: 'Arrampicata', alt: ['palestra'], why: 'Per allenare la forza c\'è la palestra' },
  { words: ['golf', 'sci', 'surf', 'equitazione', 'cavallo', 'scherma', 'rugby', 'ping pong', 'tennistavolo', 'skate', 'pattinaggio', 'canottaggio'], name: 'Questo sport', alt: [], why: '' },
];
const SPORT_NAME: Record<Sport, string> = { padel: 'padel', yoga: 'yoga', pilates: 'pilates', palestra: 'palestra', nuoto: 'nuoto', calcio: 'calcetto', tennis: 'tennis', basket: 'basket', boxe: 'boxe', corsa: 'corsa', 'arti-marziali': 'arti marziali' };

// ---------- tempo (il prototipo vive venerdì 13 novembre, alle 9:41) ----------
const NOW = 9 * 60 + 41;
const hm = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + (m || 0); };
const DAY_WORDS: [string, string[], string][] = [
  ['14', ['domani', 'sabato', 'weekend', 'week end', 'fine settimana', 'fine-settimana'], 'sabato'],
  ['15', ['domenica', 'dopodomani'], 'domenica'],
  ['16', ['lunedi'], 'lunedì'],
  ['17', ['martedi'], 'martedì'],
  ['oggi', ['oggi', 'stasera', 'stamattina', 'stamani', 'stanotte', 'venerdi', 'adesso', 'subito', 'ora', 'tra poco', 'fra poco'], 'oggi'],
];
function parseTime(t: string): Pick<Query, 'dayId' | 'from' | 'to' | 'timePhrase' | 'timeGiven'> | null {
  let dayId: string | null = null; let dayWord = '';
  for (const [id, words, phrase] of DAY_WORDS) if (has(t, words)) { dayId = id; dayWord = phrase; break; }
  if (has(t, ['domattina', 'domani mattina', 'domani presto', 'domani mattino'])) return { dayId: '14', from: 0, to: 12 * 60, timePhrase: 'domattina', timeGiven: true };
  if (has(t, ['domani sera'])) return { dayId: '14', from: 18 * 60 + 30, to: 24 * 60, timePhrase: 'domani sera', timeGiven: true };
  const tomorrow = has(t, ['domani']);
  const dayLabel = dayId === 'oggi' || !dayId ? 'oggi' : tomorrow ? 'domani' : has(t, ['weekend', 'week end', 'fine settimana']) ? 'nel weekend' : dayWord;
  const d = dayId ?? 'oggi';
  const say = (part: string) => (d === 'oggi' ? (part === 'sera' ? 'stasera' : part === 'mattina' ? 'stamattina' : `oggi ${part}`) : `${dayLabel} ${part}`);
  // orario preciso: "alle 19", "verso le 19:30", "dopo le 20", "prima delle 19"
  const at = t.match(/ (?:alle|verso le|per le|ore|dalle) (\d{1,2})(?::(\d\d))? /);
  const after = t.match(/ dopo (?:le |l )?(\d{1,2})(?::(\d\d))? /);
  const before = t.match(/ (?:prima delle|entro le|non oltre le) (\d{1,2})(?::(\d\d))? /);
  const toMin = (m: RegExpMatchArray) => { let h = +m[1]; if (h < 7) h += 12; return h * 60 + (m[2] ? +m[2] : 0); };
  if (after) { const m = toMin(after); return { dayId: d, from: m, to: 24 * 60, timePhrase: `${d === 'oggi' ? 'oggi' : dayLabel} dopo le ${after[1]}${after[2] ? `:${after[2]}` : ''}`, timeGiven: true }; }
  if (before) { const m = toMin(before); return { dayId: d, from: 0, to: m, timePhrase: `${d === 'oggi' ? 'oggi' : dayLabel} prima delle ${before[1]}${before[2] ? `:${before[2]}` : ''}`, timeGiven: true }; }
  if (at) { const m = toMin(at); return { dayId: d, from: m - 60, to: m + 61, timePhrase: `${d === 'oggi' ? 'oggi' : dayLabel} verso le ${at[1]}${at[2] ? `:${at[2]}` : ''}`, timeGiven: true }; }
  if (has(t, ['stasera', 'sera', 'serata', 'dopo cena', 'dopo il lavoro', 'dopo lavoro', 'esco dal lavoro', 'uscito dal lavoro', 'dopo l ufficio', 'tardi', 'stanotte', 'notte'])) return { dayId: d, from: 18 * 60 + 30, to: 24 * 60, timePhrase: say('sera'), timeGiven: true };
  if (has(t, ['pranzo', 'pausa pranzo', 'mezzogiorno', 'ora di pranzo'])) return { dayId: d, from: 12 * 60, to: 14 * 60 + 31, timePhrase: d === 'oggi' ? 'a pranzo' : `${dayLabel} a pranzo`, timeGiven: true };
  if (has(t, ['pomeriggio'])) return { dayId: d, from: 14 * 60, to: 18 * 60 + 1, timePhrase: say('pomeriggio'), timeGiven: true };
  if (has(t, ['mattina', 'mattino', 'stamattina', 'stamani', 'presto', 'prima del lavoro', 'colazione', 'all alba'])) return { dayId: d, from: 0, to: 12 * 60, timePhrase: say('mattina'), timeGiven: true };
  if (dayId) return { dayId: d, from: 0, to: 24 * 60, timePhrase: dayLabel, timeGiven: true };
  return null;
}

// ---------- intenti ----------
const SEARCH_WORDS = ['cosa faccio', 'cosa posso fare', 'che faccio', 'consigli*', 'propon*', 'suggerisc*', 'voglio', 'vorrei', 'mi va', 'ho voglia', 'avrei voglia', 'allenar*', 'allenamento', 'sport', 'lezion*', 'corso', 'corsi', 'classe', 'attivita', 'muover*', 'fare qualcosa', 'qualcosa da fare', 'trova*', 'cerca*', 'c e qualcosa', 'ce qualcosa', 'disponibil*', 'sono libero', 'libero', 'orari', 'posti', 'prenotare', 'prenoto', 'posso prenotare', 'dove posso', 'campo', 'campi', 'altro', 'altre', 'altri', 'di piu', 'ancora', 'qualcosa', 'ingresso'];
const CATEGORY: [Query['category'] & string, string[], Sport[], string][] = [
  ['relax', ['rilass*', 'stretching', 'meditaz*', 'medita*', 'calm*', 'tranquill*', 'stanco', 'stanca', 'sono a pezzi', 'scaric* la tensione', 'leggero', 'leggera', 'schiena', 'postura', 'flessibil*', 'respir*', 'zen'], ['yoga', 'pilates'], 'Qualcosa di tranquillo'],
  ['intense', ['sudare', 'sudata', 'intens*', 'cardio', 'scaricarmi', 'scaricare', 'sfogar*', 'sfogo', 'stress*', 'adrenalina', 'fatic*', 'bruciare', 'calorie', 'dimagrire', 'tonific*', 'forza', 'menare', 'pugni', 'arrabbiato', 'nervoso', 'energia'], ['boxe', 'arti-marziali', 'palestra'], 'Per sudare un po\''],
  ['group', ['amici', 'amico', 'gruppo', 'squadra', 'compagnia', 'colleghi', 'in 4', 'in quattro', 'in 10', 'in dieci', 'insieme', 'ragazzi', 'coppia', 'in due'], ['padel', 'calcio'], 'Da fare in compagnia'],
];
const BEGINNER = ['principiant*', 'iniziare', 'inizio', 'mai fatto', 'prima volta', 'nuovo', 'nuova', 'neofita', 'base', 'facile', 'semplice', 'non sono allenato', 'fuori forma', 'da zero'];

const dist = (a: Activity) => { const s = venueOf(a).distance; const n = parseFloat(s.replace(',', '.')); return s.includes('km') ? n : n / 1000; };
const unitPrice = (a: Activity) => a.pricePerPerson ?? a.price;
const kind = (a: Activity) => (a.people ? 'court' : a.duration === 'ingresso singolo' ? 'entry' : 'lesson');
const slotsIn = (a: Activity, q: Query) => a.slots.filter((s) => { const m = hm(s.time); return m >= q.from && m < q.to && (q.dayId !== 'oggi' || m > NOW); }).map((s) => s.time);

function search(q: Query): Card[] {
  const sportGiven = !!q.sports?.length;
  let list = activities.filter((a) => {
    if (sportGiven && !q.sports!.includes(a.sport)) return false;
    // senza sport chiesti: niente campi da squadra (servono più persone); con "lezione" solo lezioni
    if (!sportGiven && kind(a) === 'court') return false;
    if (q.lessonsOnly && kind(a) !== 'lesson' && !sportGiven) return false;
    if (q.maxPrice != null && unitPrice(a) > q.maxPrice) return false;
    if (q.indoor != null && a.indoor !== q.indoor) return false;
    if (q.near && dist(a) > 1) return false;
    return slotsIn(a, q).length > 0;
  });
  if (q.category === 'beginner') list = [...list].sort((x, y) => Number(!/iniziare|base/i.test(x.title)) - Number(!/iniziare|base/i.test(y.title)));
  list = [...list].sort((x, y) => (q.cheap ? unitPrice(x) - unitPrice(y) : 0) || dist(x) - dist(y));
  // ricerca generica: una proposta per struttura, così le card sono davvero diverse
  if (!sportGiven) { const seen = new Set<string>(); list = list.filter((a) => (seen.has(a.venueId) ? false : (seen.add(a.venueId), true))); }
  return list.slice(q.page * 3, q.page * 3 + 3).map((a) => ({ activityId: a.id, dayId: q.dayId, slots: slotsIn(a, q) }));
}

const NUM_F = ['', 'Una', 'Due', 'Tre'];
const NUM_M = ['', 'Un', 'Due', 'Tre'];
/** "Tre lezioni stasera, a meno di 1 km." (movi — risposta) */
function header(cards: Card[], q: Query, lead?: string) {
  const acts = cards.map((c) => activities.find((a) => a.id === c.activityId)!);
  const kinds = new Set(acts.map(kind));
  const sports = new Set(acts.map((a) => a.sport));
  const n = acts.length;
  const k = kinds.size === 1 ? [...kinds][0] : 'mixed';
  let noun = '';
  const sp = sports.size === 1 ? [...sports][0] : null;
  if (k === 'court') noun = `${NUM_M[n]} ${n === 1 ? 'campo' : 'campi'}${sp ? ` da ${SPORT_NAME[sp]}` : ''}`;
  else if (k === 'entry') noun = `${NUM_M[n]} ${n === 1 ? 'ingresso' : 'ingressi'} in palestra`;
  else if (k === 'lesson') noun = `${NUM_F[n]} ${n === 1 ? 'lezione' : 'lezioni'}${sp && sp !== 'nuoto' && q.sports ? ` di ${SPORT_NAME[sp]}` : ''}`;
  else noun = n === 1 ? 'Un\'attività' : `${NUM_F[n]} attività`;
  if (sp === 'nuoto' && k === 'lesson' && q.sports) noun = `${NUM_M[n]} ${n === 1 ? 'turno' : 'turni'} di nuoto libero`;
  const bits = [noun];
  if (q.maxPrice != null) bits.push(`sotto i ${euro(q.maxPrice)}${acts.some((a) => a.people) ? ' a persona' : ''}`);
  else if (q.cheap) bits.push('tra le più economiche');
  if (q.indoor === true) bits.push('al chiuso');
  if (q.indoor === false) bits.push('all\'aperto');
  if (q.timeGiven || q.maxPrice == null) bits.push(q.timePhrase);
  const km = Math.max(1, Math.ceil(Math.max(...acts.map(dist)) - 0.001));
  let s = `${bits.join(' ')}, a meno di ${km} km.`;
  if (lead) s = `${lead}: ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
  return s;
}

function thinkingFor(q: Query) {
  const sp = q.sports?.length === 1 ? q.sports[0] : null;
  const what = sp === 'padel' || sp === 'calcio' ? `campi da ${SPORT_NAME[sp]}` : sp === 'palestra' ? 'ingressi in palestra' : sp ? `lezioni di ${SPORT_NAME[sp]}` : 'lezioni';
  const when = q.maxPrice != null && !q.timeGiven ? `sotto i ${euro(q.maxPrice)}` : q.timePhrase.startsWith('a ') ? q.timePhrase : `per ${q.timePhrase}`;
  return `Cerco ${what} ${when}…`;
}

function parseQuery(t: string, prev?: Query): { q: Query; lead?: string; missing?: (typeof MISSING)[number]; signal: boolean; onlyModifiers: boolean } {
  const sports = SPORT_WORDS.filter(([, w]) => has(t, w)).map(([s]) => s);
  const missing = MISSING.find((m) => has(t, m.words));
  let category: Query['category']; let lead: string | undefined; let catSports: Sport[] | undefined;
  for (const [c, w, s, l] of CATEGORY) if (has(t, w)) { category = c; lead = l; catSports = s; break; }
  if (!category && has(t, BEGINNER)) { category = 'beginner'; lead = 'Adatte a chi inizia'; }
  const time = parseTime(t);
  let maxPrice: number | undefined;
  const pm = t.match(/ (?:sotto|meno di|massimo|max|entro|fino a|non piu di|al massimo|budget(?: di)?|spendere) (?:i |gli |le |l |a )?(?:euro )?(\d{1,3})(?: euro)? /) ?? t.match(/ (\d{1,3}) euro (?:al massimo|massimo|max) /);
  if (pm) maxPrice = +pm[1];
  const cheap = has(t, ['economic*', 'costa poco', 'costano poco', 'spendere poco', 'low cost', 'risparmi*', 'buon prezzo', 'prezzo basso', 'meno caro', 'meno cara', 'piu economico', 'conveniente', 'poco costoso', 'non costi tanto', 'senza spendere']);
  let indoor: boolean | undefined;
  if (has(t, ['al chiuso', 'chiuso', 'coperto', 'coperta', 'dentro', 'indoor', 'piove', 'pioggia', 'se piove', 'freddo', 'riparo', 'al coperto'])) indoor = true;
  else if (has(t, ['all aperto', 'aperto', 'all aria aperta', 'aria aperta', 'fuori', 'outdoor', 'sole', 'tramonto', 'in esterna', 'esterno'])) indoor = false;
  const near = has(t, ['vicino', 'vicina', 'vicini', 'qui vicino', 'sotto casa', 'a piedi', 'nei dintorni', 'in zona', 'qui intorno', 'zona mia']);
  const lessonsOnly = has(t, ['lezion*', 'corso', 'corsi', 'classe', 'istruttore', 'maestro']);
  const more = has(t, ['altro', 'altre', 'altri', 'di piu', 'ancora', 'mostrami altro', 'altre opzioni', 'nient altro']);
  const signal = !!(sports.length || missing || category || time || maxPrice != null || cheap || indoor != null || near || has(t, SEARCH_WORDS));
  // è un seguito solo se lo dice la forma: "e domani?", "invece al chiuso", "più vicino", "altro?"
  const followUp = /^ (e|ed|ma|invece|anche|piu|meno|solo|magari|allora|oppure|o|altro|altre|altri|ancora|nient altro|mostrami altro)( |$)/.test(t) || has(t, ['invece']);
  const onlyModifiers = followUp && !sports.length && !missing && !category && !!prev;

  const base: Query = { dayId: 'oggi', from: 0, to: 24 * 60, timePhrase: 'oggi', timeGiven: false, page: 0 };
  // seguito della conversazione: "e domani?", "più economico", "altro?" cambiano solo una parte della ricerca di prima
  const q: Query = onlyModifiers ? { ...prev!, page: 0 } : { ...base };
  if (!onlyModifiers) {
    q.sports = sports.length ? sports : missing?.alt.length ? missing.alt : catSports;
    q.category = category;
    q.lessonsOnly = lessonsOnly;
  }
  if (time && onlyModifiers && time.from === 0 && time.to === 24 * 60 && (prev!.from > 0 || prev!.to < 24 * 60)) {
    // "e sabato?" dopo "domani sera": cambia il giorno, resta la parte della giornata
    const part = prev!.from >= 18 * 60 ? 'sera' : prev!.to <= 12 * 60 ? 'mattina' : prev!.from >= 14 * 60 ? 'pomeriggio' : '';
    q.dayId = time.dayId; q.timeGiven = true;
    q.timePhrase = time.dayId === 'oggi' && part === 'sera' ? 'stasera' : time.dayId === 'oggi' && part === 'mattina' ? 'stamattina' : `${time.timePhrase} ${part}`.trim();
  } else if (time) Object.assign(q, time);
  if (maxPrice != null) { q.maxPrice = maxPrice; q.cheap = true; }
  if (cheap) q.cheap = true;
  if (indoor != null) q.indoor = indoor;
  if (near) q.near = true;
  if (onlyModifiers && more && !time && maxPrice == null && !cheap && indoor == null && !near) q.page = prev!.page + 1;
  if (!onlyModifiers && !q.timeGiven && !maxPrice && !cheap && indoor == null && !near && !sports.length && !category && !missing) {
    // "cosa faccio?" senza altro: da adesso in poi, oggi
    Object.assign(q, base, { lessonsOnly });
  }
  return { q, lead: onlyModifiers ? undefined : lead, missing, signal, onlyModifiers };
}

// ---------- risposte ----------
const off = (): Reply => ({ text: 'Posso aiutarti a trovare e prenotare attività sportive. Prova a chiedermi:', suggestions: SUGGESTIONS, thinking: 'Ci penso…', search: false });
const textR = (text: string, actions?: Action[], suggestions?: string[]): Reply => ({ text, actions, suggestions, thinking: 'Ci penso…', search: false });
const dayName = (id: string) => (id === 'oggi' ? 'oggi' : days.find((d) => d.id === id)!.sentence);

export function answer(input: string, ctx: Ctx): Reply {
  const t = norm(input);
  if (t.trim() === '') return off();

  // domande sull'app
  if (has(t, ['meteo', 'che tempo', 'previsioni', 'temperatura'])) return off();
  if (has(t, ['mie prenotazioni', 'le prenotazioni', 'ho prenotato', 'cosa ho prenotato', 'prossima prenotazione', 'prossima lezione', 'quando ho', 'ho qualcosa', 'i miei impegni', 'la mia prenotazione'])) {
    const u = ctx.upcoming;
    if (!u.length) return textR('Non hai prenotazioni in arrivo. Vuoi che ti cerchi qualcosa?', undefined, SUGGESTIONS.slice(0, 2));
    const f = u[0]; const a = activities.find((x) => x.id === f.activityId)!;
    return textR(`Hai ${u.length === 1 ? 'una prenotazione' : `${u.length} prenotazioni`} in arrivo. La prossima è ${a.title}, ${dayName(f.dayId)} alle ${f.time}.`, [{ label: 'Vedi prenotazioni', to: '/prenotazioni' }]);
  }
  if (has(t, ['disdire', 'disdico', 'disdetta', 'annullare', 'annullo', 'cancellare', 'cancello', 'rimborso', 'rimborsate', 'rimborsi'])) {
    return textR('Puoi disdire gratis fino a 2 ore prima: ti rimborsiamo sul metodo di pagamento e, se avevi usato un buono, torna disponibile. Lo fai dal dettaglio della prenotazione.', [{ label: 'Vedi prenotazioni', to: '/prenotazioni' }]);
  }
  if (has(t, ['check in', 'checkin', 'qr', 'codice', 'ingresso con', 'come entro', 'all ingresso'])) {
    return textR('All\'ingresso mostri il QR della prenotazione: con il check-in arrivano i punti della lezione più 50 pt.', [{ label: 'Vedi prenotazioni', to: '/prenotazioni' }]);
  }
  if (has(t, ['buono', 'buoni', 'sconto', 'sconti', 'coupon', 'codice sconto'])) {
    return ctx.points >= VOUCHER.points
      ? textR(`Hai ${fmtPoints(ctx.points)} pt: basta per un buono da €${VOUCHER.value}. Lo attivi nel riepilogo, prima di pagare.`, [{ label: 'Vai a Premi', to: '/premi' }])
      : textR(`Il primo buono, da €${VOUCHER.value}, si sblocca a ${fmtPoints(VOUCHER.points)} pt. Te ne mancano ${fmtPoints(VOUCHER.points - ctx.points)}.`, [{ label: 'Vai a Premi', to: '/premi' }]);
  }
  if (has(t, ['punti', 'punteggio', 'saldo', 'quanti pt', ' pt'])) {
    return textR(`Hai ${fmtPoints(ctx.points)} pt. Li guadagni camminando, prenotando e facendo il check-in; con ${fmtPoints(VOUCHER.points)} pt sblocchi un buono da €${VOUCHER.value}.`, [{ label: 'Vai a Premi', to: '/premi' }]);
  }
  if (has(t, ['passi', 'missione', 'serie', 'streak', 'camminare', 'camminata', 'quanto ho camminato'])) {
    const m = user.mission;
    return textR(`Oggi sei a ${fmtPoints(m.steps)} passi su ${fmtPoints(m.goal)}: ne mancano ${fmtPoints(m.goal - m.steps)}. La tua serie è di ${user.streak} giorni.`, [{ label: 'Vai alla Home', to: '/' }]);
  }
  if (has(t, ['certificato', 'certificato medico', 'documenti', 'documento', 'modulo', 'visita medica'])) {
    return textR('Alla Piscina Aventino serve il certificato medico; FitLab Testaccio ti fa firmare un modulo al primo ingresso. Le altre strutture non chiedono niente.');
  }
  if (has(t, ['cosa porto', 'cosa portare', 'cosa mi porto', 'attrezzatura', 'tappetino', 'asciugamano', 'scarpe', 'guantoni', 'racchetta', 'racchette', 'docce', 'doccia', 'spogliatoi*'])) {
    return textR('Quasi ovunque ci sono spogliatoi e docce. Allo Zen Studio il tappetino è incluso, alla Palestra Testaccio noleggi i guantoni a €2, per il padel le racchette costano €3. In piscina serve la cuffia.');
  }
  if (has(t, ['preferiti', 'preferito', 'salvati', 'salvato'])) {
    const f = ctx.favorites.map((id) => activities.find((a) => a.id === id)?.title).filter(Boolean);
    return f.length ? textR(`Nei preferiti hai ${f.join(', ')}.`, [{ label: 'Apri Scopri', to: '/scopri' }]) : textR('Non hai ancora preferiti: nella scheda di una struttura tocca il cuore per salvarla.');
  }
  if (has(t, ['come pago', 'pagare', 'pagamento', 'apple pay', 'carta', 'contanti'])) {
    return textR('Paghi in app con Apple Pay quando prenoti. Se disdici entro 2 ore prima ti rimborsiamo sullo stesso metodo.');
  }

  const p = parseQuery(t, ctx.lastQuery);
  // saluti, grazie, aiuto: solo se non c'è anche una richiesta
  if (!p.signal) {
    if (has(t, ['grazie', 'perfetto', 'ottimo', 'top', 'fantastico', 'gentilissimo', 'grande', 'bravo', 'ok', 'va bene', 'okay', 'si', 'certo'])) return textR('Di niente! Se ti serve altro, chiedimi pure.');
    if (has(t, ['ciao', 'buongiorno', 'buonasera', 'salve', 'ehi', 'hey', 'hei', 'hola', 'yo', 'buondi'])) return textR(`Ciao ${user.name}! Dimmi che sport ti va, quando sei libero o quanto vuoi spendere.`, undefined, SUGGESTIONS);
    if (has(t, ['chi sei', 'cosa sai fare', 'cosa puoi fare', 'come funzion*', 'aiuto', 'help', 'aiutami', 'che fai', 'a cosa servi'])) return textR('Sono Movi: ti trovo lezioni e campi vicino a te e li prenoti da qui. Dimmi uno sport, un orario o quanto vuoi spendere.', undefined, SUGGESTIONS);
    if (has(t, ['no', 'niente', 'non mi va', 'lascia stare', 'basta'])) return textR('Va bene. Quando ti va, sono qui.');
    return off();
  }

  let q = p.q;
  let cards = search(q);
  let lead = p.lead;
  let note = '';
  // niente con questi criteri: allarga un vincolo alla volta e dillo
  if (!cards.length && q.page > 0) return { ...textR('Non ho altre proposte con questi criteri. Prova un altro orario o un altro sport.', undefined, SUGGESTIONS.slice(0, 2)), thinking: thinkingFor(q), search: true, query: q };
  if (!cards.length && q.near) { q = { ...q, near: false }; cards = search(q); if (cards.length) note = 'Proprio qui vicino non trovo niente, ecco le più vicine.'; }
  if (!cards.length && q.maxPrice != null) { const mp = q.maxPrice; q = { ...q, maxPrice: undefined, cheap: true }; cards = search(q); if (cards.length) note = `Sotto i ${euro(mp)} non trovo niente: ecco le più economiche.`; }
  if (!cards.length && q.indoor != null) { const was = q.indoor; q = { ...q, indoor: undefined }; cards = search(q); if (cards.length) note = `${was ? 'Al chiuso' : 'All\'aperto'} non trovo niente: ecco cosa c'è.`; }
  const cap = (x: string) => `${x.charAt(0).toUpperCase()}${x.slice(1)}`;
  if (!cards.length && (q.from > 0 || q.to < 24 * 60)) {
    // orario stretto: prima gli altri orari dello stesso giorno
    const day = q.dayId === 'oggi' ? 'oggi' : (days.find((d) => d.id === q.dayId)!.sentence);
    const q2 = { ...q, from: 0, to: 24 * 60, timePhrase: day };
    const c2 = search(q2);
    if (c2.length) { note = `${cap(q.timePhrase)} non c'è posto: ecco gli altri orari.`; q = q2; cards = c2; }
  }
  if (!cards.length) {
    const asked = q.timePhrase;
    for (const d of days.filter((x) => x.id !== q.dayId)) {
      const q2 = { ...q, dayId: d.id, timePhrase: q.from === 0 && q.to === 24 * 60 ? d.sentence : `${d.sentence} ${q.from >= 18 * 60 ? 'sera' : q.to <= 12 * 60 ? 'mattina' : q.from >= 12 * 60 && q.to <= 14 * 60 + 31 ? 'a pranzo' : ''}`.trim() };
      const c2 = search(q2);
      if (c2.length) { q = q2; cards = c2; note = `${cap(asked)} non c'è più posto.`; break; }
    }
  }
  if (!cards.length) {
    const sp = q.sports?.length ? q.sports.map((s) => SPORT_NAME[s]).join(' o ') : 'niente';
    return { ...textR(`Non trovo ${sp === 'niente' ? 'niente' : sp} con questi criteri. Prova a cambiare orario o sport.`, undefined, SUGGESTIONS.slice(0, 2)), thinking: thinkingFor(p.q), search: true, query: p.q };
  }
  if (p.missing) { note = p.missing.alt.length ? `${p.missing.name}${p.missing.name.endsWith('ma') ? '' : ' per ora non c\'è vicino a te.'} ${p.missing.why}.` : `${p.missing.name} per ora non c'è su Movitae.`; lead = undefined; }
  if (p.missing && !p.missing.alt.length) return { ...off(), text: `${p.missing.name} per ora non c'è su Movitae. Posso cercarti altro:` };
  const head = header(cards, q, lead);
  return { text: note ? `${note} ${head}` : head, cards, thinking: thinkingFor(p.q), search: true, query: q };
}

/** Riga dopo la prenotazione (flusso-movi/4): "Prenotato: Yoga Flow, oggi alle 18:30." */
export const bookedLine = (activityId: string, dayId: string, time: string) =>
  `Prenotato: ${activities.find((a) => a.id === activityId)!.title}, ${dayName(dayId)} alle ${time}.`;
