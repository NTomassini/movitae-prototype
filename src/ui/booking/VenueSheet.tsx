import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { activity, days, euro, fmtPoints, services, venueOf } from '../../data/data';
import { DetentSheet, type DetentSheetHandle } from '../DetentSheet';
import { Icon } from '../Icon';
import { Img } from '../Img';
import { Button, Chip } from './BookingParts';
import { store, useAppState } from '../../state/bookings';

type D = 'half' | 'large';
// Figma: mezza altezza con il bordo a y 392, grande a y 54 (su 874).
const tops = (h: number) => ({ half: Math.max(h - 482, 54), large: 54 });

/**
 * Scheda della struttura (flusso-sport/3). Toccare un orario lo sceglie; "Prenota alle …" è spento
 * finché non scegli. In fondo restano sempre Indicazioni e Prenota (BottomBar kind=venue).
 */
export function VenueSheet({ activityId, onClose, onBook }: { activityId: string; onClose: () => void; onBook: (dayId: string, time: string) => void }) {
  const a = activity(activityId);
  const v = venueOf(a);
  const [detent, setDetent] = useState<D>('half');
  const [day, setDay] = useState(days[0].id);
  const [time, setTime] = useState<string | null>(null);
  const fav = useAppState().favorites.includes(activityId);
  const setFav = () => store.toggleFavorite(activityId);
  const sheet = useRef<DetentSheetHandle>(null);
  const [closing, setClosing] = useState(false);
  // chiusura animata: lo sheet scende, la barra esce, poi si torna a Scopri
  const close = async (alreadyDown = false) => {
    setClosing(true);
    if (!alreadyDown) await sheet.current?.dismiss();
    onClose();
  };
  const d = days.find((x) => x.id === day)!;
  const sub = [a.people ? `Campo da ${a.people}` : a.title.split(',')[0], a.duration, v.distance].join(' · ');

  return (
    <>
      <DetentSheet ref={sheet} className={`venue-sheet venue-sheet--${detent}`} tops={tops} detent={detent} onDetent={setDetent} label={v.name} onDismiss={() => close(true)}>
        <div className="venue-sheet__grab"><button aria-label="Cambia altezza della scheda" onClick={() => setDetent(detent === 'half' ? 'large' : 'half')} style={{ padding: '0 40px', height: 16, display: 'flex', justifyContent: 'center' }}><span /></button></div>
        <div className="venue-sheet__head">
          <div className="venue-sheet__head-text">
            <h2 className="t-title-2">{v.name}</h2>
            <span className="t-subheadline secondary">{sub}</span>
          </div>
          <div className="venue-sheet__actions">
            <button className={`circle-button pressable${fav ? ' is-on' : ''}`} aria-label={fav ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'} aria-pressed={fav} onClick={setFav}>
              <Icon name="UI/Favorite" size={22} />
            </button>
            <button className="circle-button pressable" aria-label="Chiudi" onClick={() => close()}><Icon name="UI/Close" size={22} /></button>
          </div>
        </div>
        <div className="venue-sheet__body" data-scroll>
          <Img name={a.photo} className="venue-sheet__photo" style={{ width: '100%', height: 150, borderRadius: 20 }} />
          <div className="price-line">
            <span className="t-title-3">{euro(a.price)}{a.people ? ' il campo' : ''}</span>
            <span className="points-pill t-footnote-emphasized">+{fmtPoints(a.points)} pt</span>
          </div>
          {a.pricePerPerson && <p className="t-subheadline secondary" style={{ marginTop: 4 }}>{euro(a.pricePerPerson)} a persona se giocate in {a.people}. Paghi il campo intero.</p>}

          <h3 className="t-headline" style={{ marginTop: 24, marginBottom: 12 }}>Quando vuoi andare?</h3>
          <div className="chips" role="group" aria-label="Giorno">
            {days.map((x) => <Chip key={x.id} label={x.short} selected={x.id === day} onPress={() => { setDay(x.id); setTime(null); }} />)}
          </div>
          <div style={{ marginTop: 16 }}>
            <span className="t-footnote-emphasized secondary">Prenota {d.sentence} alle</span>
            <div className="times" role="group" aria-label="Orario">
              {a.slots.map((s) => <Chip key={s.time} big label={s.time} selected={s.time === time} disabled={s.soldOut && day === 'oggi'} onPress={() => setTime(s.time)} />)}
            </div>
          </div>

          <h3 className="t-headline" style={{ marginTop: 24, marginBottom: 12 }}>Informazioni</h3>
          <div className="info-block"><span className="info-label t-footnote-emphasized">Indirizzo</span><span className="t-body">{v.street}, {v.city} · {v.distance}</span></div>
          <div className="info-block"><span className="info-label t-footnote-emphasized">Servizi</span><span className="t-body">{services[v.id]}</span></div>
          {v.documents && (
            <div className="info-block"><span className="info-label t-footnote-emphasized">Documenti</span>
              <span className="t-body">{v.documents === 'certificate' ? 'Serve il certificato medico' : 'Modulo da firmare al primo ingresso'}</span></div>
          )}
          <div className="info-block"><span className="info-label t-footnote-emphasized">Disdetta</span><span className="t-body">Gratis fino a 2 ore prima</span></div>
        </div>
      </DetentSheet>
      <motion.div className="bottom-bar" initial={{ y: 120 }} animate={{ y: closing ? 120 : 0 }} transition={{ type: 'spring', visualDuration: 0.4, bounce: 0 }}>
        <Button kind="secondary" icon={<Icon name="Map/Directions" size={20} />}
          onPress={() => window.open(`https://maps.apple.com/?q=${encodeURIComponent(`${v.name}, ${v.street}, ${v.city}`)}`, '_blank')}>Indicazioni</Button>
        <Button fill disabled={!time} onPress={() => time && onBook(day, time)}>{time ? `Prenota alle ${time}` : 'Scegli un orario'}</Button>
      </motion.div>
    </>
  );
}
