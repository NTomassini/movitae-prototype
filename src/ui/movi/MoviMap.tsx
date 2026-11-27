import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useNav } from '../../app/nav';
import { activity, euro, user, venueOf } from '../../data/data';
import type { Card } from '../../movi/engine';
import { Icon } from '../Icon';
import { MapView, type MapPinData } from '../scopri/MapView';
import { sportIcon } from '../scopri/ScopriParts';
import { ActivityCard, ChatInput } from './MoviParts';

/**
 * Mappa in Movi (flusso-movi/5): le lezioni della risposta sulla mappa, con le stesse card in un carosello.
 * Pin e card sono collegati: scorrere il carosello sceglie il pin, toccare un pin porta alla sua card.
 */
export function MoviMap({ cards, booked, selected, onClose, onOpen, onTime, onSend }: {
  cards: Card[]; booked: (activityId: string) => string | null; selected: (activityId: string) => string | null;
  onClose: () => void; onOpen: (c: Card) => void; onTime: (c: Card, time: string) => void; onSend: (t: string) => void;
}) {
  const navigate = useNav();
  const [current, setCurrent] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const pins: MapPinData[] = useMemo(() => cards.map((c) => {
    const a = activity(c.activityId); const v = venueOf(a);
    return { id: c.activityId, lat: v.lat, lng: v.lng, icon: sportIcon[a.sport], label: `${a.title} · ${euro(a.pricePerPerson ?? a.price)}` };
  }), [cards]);

  // carosello → pin
  useEffect(() => {
    const el = strip.current; if (!el) return;
    let t = 0;
    const on = () => { clearTimeout(t); t = window.setTimeout(() => setCurrent(Math.round(el.scrollLeft / 366)), 60); };
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, []);
  // pin → carosello
  const pick = (id: string | null) => {
    const i = cards.findIndex((c) => c.activityId === id);
    if (i < 0) return;
    setCurrent(i);
    strip.current?.scrollTo({ left: i * 366, behavior: 'smooth' });
  };

  return (
    <motion.div className="movi-map" role="dialog" aria-label="Lezioni sulla mappa"
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: 'spring', visualDuration: 0.35, bounce: 0 }}>
      <MapView center={user.location} pins={pins} selected={cards[current]?.activityId ?? null} onSelect={pick} />
      <button className="movi-map__close glass-control pressable" aria-label="Chiudi la mappa" onClick={onClose}><Icon name="UI/Close" size={18} /></button>
      <button className="movi-map__all glass-control pressable t-subheadline-emphasized" onClick={() => navigate('/scopri', { state: { list: true } })}>Vedi tutte in Scopri</button>
      <div className="movi-carousel" ref={strip}>
        {cards.map((c) => (
          <ActivityCard key={c.activityId} card={c} bookedTime={booked(c.activityId)} selected={selected(c.activityId)}
            onOpen={() => onOpen(c)} onTime={(t) => onTime(c, t)} />
        ))}
      </div>
      <ChatInput className="movi-input--map" onSend={onSend} />
    </motion.div>
  );
}
