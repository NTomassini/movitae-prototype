import { useState } from 'react';
import { activity, euro, fmtPoints, venueOf } from '../../data/data';
import type { Card } from '../../movi/engine';
import { Icon } from '../Icon';
import { Img } from '../Img';
import { Chip } from '../booking/BookingParts';
import './movi.css';

/** userMsg — bolla a destra, fill/tertiary, raggio 20, padding 12/16, testo body. */
export function UserMsg({ text }: { text: string }) {
  return <div className="movi-user"><p className="t-body">{text}</p></div>;
}

/** moviMsg — avatar 40 + testo headline, gap 8, centrati in verticale. */
export function MoviMsg({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <div className="movi-msg">
      <Img name="img/movi-avatar" style={{ width: 40, height: 40, flex: 'none' }} />
      <p className={`t-headline${muted ? ' secondary' : ''}`}>{text}</p>
    </div>
  );
}

/** sugg — riga 56, bg/surface, raggio 24, testo body e freccia. */
export function Suggestion({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <button className="movi-sugg pressable" onClick={onPress}>
      <span className="t-body">{text}</span>
      <Icon name="UI/Chevron-Right" size={18} className="chevron" />
    </button>
  );
}

/** Capsula grigia (Vedi sulla mappa, Vedi prenotazione, Riprova). */
export function Pill({ children, onPress, big }: { children: React.ReactNode; onPress: () => void; big?: boolean }) {
  return <button className={`movi-pill pressable ${big ? 't-headline movi-pill--big' : 't-subheadline-emphasized'}`} onClick={onPress}>{children}</button>;
}

/**
 * card — la lezione con gli orari da toccare (movi — risposta). Toccare la riga in alto apre la scheda;
 * toccare un orario lo sceglie (rosso) e apre il riepilogo. Dopo il pagamento: "Prenotato alle …" in verde.
 */
export function ActivityCard({ card, selected, bookedTime, onOpen, onTime }: {
  card: Card; selected?: string | null; bookedTime?: string | null;
  onOpen: () => void; onTime: (time: string) => void;
}) {
  const a = activity(card.activityId);
  const v = venueOf(a);
  const sold = (t: string) => card.dayId === 'oggi' && a.slots.find((s) => s.time === t)?.soldOut;
  return (
    <div className="movi-card">
      <button className="movi-card__top" onClick={onOpen} aria-label={`${a.title}, ${v.name}: apri la scheda`}>
        <Img name={a.photo} style={{ width: 56, height: 56, borderRadius: 12, flex: 'none' }} />
        <span className="movi-card__text">
          <span className="t-headline">{a.title}</span>
          <span className="t-subheadline secondary">{v.short ?? v.name} · {v.distance}</span>
        </span>
        <span className="movi-card__price">
          <span className="t-headline">{euro(a.price)}</span>
          <span className="movi-points t-footnote-emphasized">+{fmtPoints(a.points)} pt</span>
        </span>
        <Icon name="UI/Chevron-Right" size={18} className="chevron" />
      </button>
      {bookedTime ? (
        <div className="movi-card__booked">
          <span className="movi-dot" />
          <span className="t-subheadline-emphasized">Prenotato alle {bookedTime}</span>
        </div>
      ) : (
        <div className="movi-card__times" role="group" aria-label={`Orari di ${a.title}`}>
          <span className="t-footnote-emphasized secondary">Prenota alle</span>
          {card.slots.map((t) => <Chip key={t} label={t} selected={selected === t} disabled={!!sold(t)} onPress={() => onTime(t)} />)}
        </div>
      )}
    </div>
  );
}

/** card/segnaposto — mentre Movi "sta pensando". */
export function SkeletonCard() {
  return (
    <div className="movi-card movi-skeleton" aria-hidden="true">
      <div className="movi-skeleton__top"><i style={{ width: 56, height: 56, borderRadius: 12 }} /><div><i style={{ width: 150 }} /><i style={{ width: 100 }} /></div></div>
      <div className="movi-skeleton__chips"><i /><i /><i /></div>
    </div>
  );
}

/** input — capsula di vetro 50, "Chiedi a Movi", freccia in un cerchio 38 (spenta finché è vuoto). */
export function ChatInput({ onSend, disabled, className = '' }: { onSend: (t: string) => void; disabled?: boolean; className?: string }) {
  const [v, setV] = useState('');
  const can = v.trim().length > 0 && !disabled;
  const send = () => { if (!can) return; onSend(v.trim()); setV(''); };
  return (
    <form className={`movi-input ${className}`} onSubmit={(e) => { e.preventDefault(); send(); }}>
      <input className="t-body" value={v} onChange={(e) => setV(e.target.value)} placeholder="Chiedi a Movi" aria-label="Chiedi a Movi" enterKeyHint="send" autoComplete="off" />
      <button type="submit" className={`movi-send${can ? ' is-on' : ''}`} disabled={!can} aria-label="Invia">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 15V3.75M13.875 8.625L9 3.75L4.125 8.625" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </form>
  );
}
