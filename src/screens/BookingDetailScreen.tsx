import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { VOUCHER, activity, days, endTime, euro, fmtPoints, venueOf } from '../data/data';
import { checkInPoints, store, useAppState } from '../state/bookings';
import { PageHeader } from '../ui/PageHeader';
import { SystemAlert } from '../ui/SystemAlert';
import { Icon } from '../ui/Icon';
import { ActionsCard, ActivityBlock, QR } from '../ui/booking/BookingParts';
import './BookingDetailScreen.css';

// Dettaglio — prenotazioni/3 (QR), /4 (check-in fatto), /5 (avviso disdetta), conferme/3 e /4 (dopo il limite, senza rimborso).
const minus2h = (t: string) => { const [h, m] = t.split(':').map(Number); return `${String(h - 2).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };

export function BookingDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const app = useAppState();
  const b = app.bookings.find((x) => x.id === id);
  const [alert, setAlert] = useState(false);
  if (!b) return <Navigate to="/prenotazioni" replace />;
  const a = activity(b.activityId);
  const v = venueOf(a);
  const d = days.find((x) => x.id === b.dayId);
  const end = endTime(a, b.time);
  const when = b.pastLabel ? b.pastLabel : `${d!.long} · ${end ? `${b.time}–${end}` : `dalle ${b.time}`}`;
  const limit = minus2h(b.time);
  // il limite conta solo per le prenotazioni di oggi; per i giorni dopo la disdetta è sempre gratuita
  const late = b.dayId === 'oggi' && app.demo.clock === 'after';
  const refundText = b.voucher ? `Ti rimborsiamo ${euro(b.paid)} e il buono da €${VOUCHER.value} torna disponibile.` : `Ti rimborsiamo ${euro(b.paid)}.`;
  const lateText = b.voucher
    ? `Non ti rimborsiamo i ${euro(b.paid)}, i punti in arrivo si annullano e il buono non torna.`
    : `Non ti rimborsiamo i ${euro(b.paid)} e i punti in arrivo si annullano.`;

  const cancel = () => {
    store.updateBooking(b.id, { status: 'cancelled', refunded: !late });
    setAlert(false);
    navigate('/prenotazioni?tab=passate', { replace: true });
  };

  return (
    <div className="booking-detail">
      <PageHeader title="Prenotazione" type="C" />
      <div className="card ticket">
        <ActivityBlock photo={a.photo} title={a.title} when={when} where={`${v.name} · ${v.street}`} />
        <div className="ticket__sep" />
        <AnimatePresence mode="wait" initial={false}>
          {b.status === 'checked-in' ? (
            <motion.div key="ok" className="checkin" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', visualDuration: 0.5, bounce: 0.3 }}>
              <span className="checkin__icon"><Icon name="UI/Check" size={40} /></span>
              <span className="t-title-2">Check-in fatto</span>
              <span className="earn-pill t-headline" style={{ padding: '4px 12px' }}>+{fmtPoints(checkInPoints(b))} pt</span>
            </motion.div>
          ) : b.status === 'cancelled' ? (
            <div key="x" className="ticket__qr"><span className="t-headline secondary">Disdetta</span></div>
          ) : (
            <motion.div key="qr" className="ticket__qr" exit={{ opacity: 0, scale: 0.9 }}>
              <QR value={`MOVITAE-${b.id}`} />
              <span className="t-footnote secondary">Mostralo all'ingresso</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ActionsCard mapsQuery={`${v.name}, ${v.street}, ${v.city}`} />
      {b.status === 'upcoming' && (
        <div>
          <button className="card cancel-row t-body pressable" onClick={() => setAlert(true)}>Disdici prenotazione</button>
          <p className="t-footnote secondary cancel-note">{late ? `La disdetta gratuita è scaduta alle ${limit}.` : `Puoi disdire gratis fino alle ${limit}.`}</p>
        </div>
      )}
      <AnimatePresence>
        {alert && (
          <SystemAlert title={late ? 'Vuoi disdire senza rimborso?' : `Vuoi disdire ${a.title}?`} message={late ? lateText : refundText}
            action="Disdici" onCancel={() => setAlert(false)} onConfirm={cancel} />
        )}
      </AnimatePresence>
    </div>
  );
}
