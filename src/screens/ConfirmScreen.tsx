import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useNav } from '../app/nav';
import { motion } from 'motion/react';
import { VOUCHER, activity, days, endTime, fmtPoints, user, venueOf } from '../data/data';
import { balance, bookings } from '../state/bookings';
import { useScreenChrome } from '../app/chrome';
import { ActionsCard, ActivityBlock, Button, QR } from '../ui/booking/BookingParts';

/** Conferma a biglietto (flusso-movi/3): "Prenotato", biglietto con QR, risparmio se c'è il buono, azioni, "Fatto". */
export function ConfirmScreen() {
  const { id } = useParams();
  const navigate = useNav();
  // "Fatto" riporta da dove sei partito: Scopri, oppure la chat di Movi (flusso-movi/4)
  const from = useSearchParams()[0].get('from');
  useScreenChrome({ tabBar: false, bottomEdge: false, pageScroll: false });
  const b = id ? bookings.get(id) : undefined;
  if (!b) return <Navigate to="/" replace />;
  const a = activity(b.activityId);
  const v = venueOf(a);
  const d = days.find((x) => x.id === b.dayId)!;
  const end = endTime(a, b.time);
  const left = balance(bookings.all(), user.points, user.saved).points;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 25 }}>
    <motion.div className="confirm" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', visualDuration: 0.5, bounce: 0 }}>
      <h1 className="t-large-title" style={{ marginBottom: -12 }}>Prenotato</h1>
      <div className="card ticket">
        <ActivityBlock photo={a.photo} title={a.title} when={`${d.long} · ${end ? `${b.time}–${end}` : `dalle ${b.time}`}`} where={`${v.name} · ${v.street}`} />
        <div className="ticket__sep" />
        <div className="ticket__qr">
          <QR value={`MOVITAE-${b.id}`} />
          <span className="t-footnote secondary">Mostralo all'ingresso</span>
        </div>
      </div>
      {b.voucher && (
        <div className="card savings">
          <span className="t-headline" style={{ color: 'var(--earn-default)' }}>Hai risparmiato €{VOUCHER.value}</span>
          <span className="t-subheadline secondary">Ti restano {fmtPoints(left)} pt. Altri {fmtPoints(b.points)} arrivano al check-in.</span>
        </div>
      )}
      <ActionsCard mapsQuery={`${v.name}, ${v.street}, ${v.city}`} event={{ id: b.id, title: `${a.title} · ${v.name}`, dayId: b.dayId, time: b.time, minutes: parseInt(a.duration, 10) || 60, location: `${v.name}, ${v.street}, ${v.city}` }} />
    </motion.div>
    <div className="confirm__done">
      <Button onPress={() => navigate(from === 'movi' ? '/movi' : '/scopri', { replace: true })}>Fatto</Button>
    </div>
    </div>
  );
}
