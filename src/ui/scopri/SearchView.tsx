import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { activities, pickSports, shelfSports, venueOf, venues, type Sport } from '../../data/data';
import { Icon } from '../Icon';
import { Img } from '../Img';
import './filters.css';

/** Una ricerca recente: cosa riapre. */
export type Pick = { kind: 'sport'; sport: Sport; near?: boolean; label: string } | { kind: 'venue'; id: string; label: string } | { kind: 'activity'; id: string; label: string };
const KEY = 'movitae-ricerche';
const DEFAULT: Pick[] = [
  { kind: 'sport', sport: 'padel', near: true, label: 'Padel vicino a me' },
  { kind: 'venue', id: 'zen', label: 'Zen Studio' },
  { kind: 'activity', id: 'nuoto', label: 'Nuoto libero' },
];
const loadRecent = (): Pick[] => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null') ?? DEFAULT; } catch { return DEFAULT; } };
const saveRecent = (p: Pick) => { const l = [p, ...loadRecent().filter((x) => x.label !== p.label)].slice(0, 5); try { sessionStorage.setItem(KEY, JSON.stringify(l)); } catch { /* ignora */ } };
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Ricerca (scopri/ricerca, errori/6): campo con "Annulla", Recenti e sport; scrivendo compaiono sport,
 * strutture e attività. Senza risultati: cosa non c'è, "Chiedi a Movi" con la stessa parola e gli sport.
 */
export function SearchView({ onClose, onPick, onAskMovi }: { onClose: () => void; onPick: (p: Pick) => void; onAskMovi: (q: string) => void }) {
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { const t = setTimeout(() => input.current?.focus({ preventScroll: true }), 60); return () => clearTimeout(t); }, []);
  const pick = (p: Pick) => { saveRecent(p); onPick(p); };
  const t = norm(q.trim());
  const sportHits = t ? pickSports.filter((s) => norm(s.label).includes(t)) : [];
  const venueHits = t ? venues.filter((v) => norm(v.name).includes(t)) : [];
  const actHits = t ? activities.filter((a) => norm(a.title).includes(t) && !sportHits.some((s) => s.sport === a.sport && norm(a.title) === norm(s.label))) : [];
  const none = t.length > 0 && !sportHits.length && !venueHits.length && !actHits.length;

  const sportsGrid = (
    <section>
      <h2 className="t-title-3" style={{ marginBottom: 12 }}>Sport</h2>
      <div className="search-sports">
        {shelfSports.map((s) => (
          <button key={s.sport} className="search-sport pressable" onClick={() => pick({ kind: 'sport', sport: s.sport, label: s.label })}>
            <Img name={s.image} style={{ width: 36, height: 36 }} /><span className="t-subheadline-emphasized">{s.label}</span>
          </button>
        ))}
      </div>
    </section>
  );

  return (
    <motion.div className="search-view" role="dialog" aria-label="Cerca" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <form className="search-bar" onSubmit={(e) => { e.preventDefault(); const first = sportHits[0] ? { kind: 'sport' as const, sport: sportHits[0].sport, label: sportHits[0].label } : venueHits[0] ? { kind: 'venue' as const, id: venueHits[0].id, label: venueHits[0].name } : actHits[0] ? { kind: 'activity' as const, id: actHits[0].id, label: actHits[0].title } : null; if (first) pick(first); }}>
        <label className="search-input">
          <Icon name="UI/Search-Field" size={20} />
          <input ref={input} className="t-body" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca sport o struttura" enterKeyHint="search" aria-label="Cerca sport o struttura" />
          {q && <button type="button" aria-label="Cancella" onClick={() => setQ('')} className="search-clear"><Icon name="UI/Close" size={16} /></button>}
        </label>
        <button type="button" className="t-body" onClick={onClose}>Annulla</button>
      </form>
      <div className="search-body">
        {!t && (
          <>
            <section>
              <h2 className="t-title-3" style={{ marginBottom: 4 }}>Recenti</h2>
              {loadRecent().map((r) => (
                <button key={r.label} className="search-recent" onClick={() => pick(r)}><Icon name="UI/Clock" size={20} /><span className="t-body">{r.label}</span></button>
              ))}
            </section>
            {sportsGrid}
          </>
        )}
        {t && !none && (
          <section>
            {sportHits.map((s) => (
              <button key={s.sport} className="search-result" onClick={() => pick({ kind: 'sport', sport: s.sport, label: s.label })}>
                <Img name={s.image} style={{ width: 40, height: 40 }} /><span className="search-result__texts"><span className="t-body">{s.label}</span><span className="t-subheadline secondary">Sport</span></span>
              </button>
            ))}
            {venueHits.map((v) => (
              <button key={v.id} className="search-result" onClick={() => pick({ kind: 'venue', id: v.id, label: v.name })}>
                <span className="list-row__icon"><Icon name="UI/Location" size={22} /></span><span className="search-result__texts"><span className="t-body">{v.name}</span><span className="t-subheadline secondary">{v.street} · {v.distance}</span></span>
              </button>
            ))}
            {actHits.map((a) => (
              <button key={a.id} className="search-result" onClick={() => pick({ kind: 'activity', id: a.id, label: a.title })}>
                <Img name={a.photo} style={{ width: 40, height: 40, borderRadius: 10 }} /><span className="search-result__texts"><span className="t-body">{a.title}</span><span className="t-subheadline secondary">{venueOf(a).name} · {venueOf(a).distance}</span></span>
              </button>
            ))}
          </section>
        )}
        {none && (
          <>
            <section className="search-empty">
              <h2 className="t-headline">Nessun risultato per “{q.trim()}”</h2>
              <p className="t-subheadline secondary">Non ci sono strutture con questo sport qui vicino. Prova uno di questi o chiedi a Movi.</p>
              <button className="movi-sugg pressable" style={{ marginTop: 20 }} onClick={() => onAskMovi(q.trim())}>
                <span className="t-body">Chiedi a Movi “{q.trim()}”</span><Icon name="UI/Chevron-Right" size={18} className="chevron" />
              </button>
            </section>
            {sportsGrid}
          </>
        )}
      </div>
    </motion.div>
  );
}
