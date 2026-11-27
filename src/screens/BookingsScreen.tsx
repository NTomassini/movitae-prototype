import { HapticLayer } from '../ui/booking/BookingParts';
import { TLink } from '../app/TLink';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNav } from '../app/nav';
import { activity, days, venueOf } from '../data/data';
import { checkInPoints, past, upcoming, useBookings, type Booking } from '../state/bookings';
import { PageHeader } from '../ui/PageHeader';
import { Icon } from '../ui/Icon';
import { Img } from '../ui/Img';
import { Button } from '../ui/booking/BookingParts';
import './BookingsScreen.css';

// Le mie prenotazioni — prenotazioni/1 (1461:5777), /2 (1461:5829), vuote (conferme/7, 1461:7502).
export const whenShort = (b: Booking) => {
  if (b.pastLabel) return b.pastLabel;
  const d = days.find((x) => x.id === b.dayId)!;
  return `${d.id === 'oggi' ? 'Oggi' : d.short}, ${b.time}`;
};

export function SegmentedControl<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; label: string }) {
  const i = options.findIndex((o) => o.v === value);
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      <span className="segmented__thumb" style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${i * 100}%)` }} />
      {options.map((o) => (
        <button key={o.v} role="tab" aria-selected={o.v === value} className="t-subheadline-emphasized" onClick={() => onChange(o.v)}>{o.l}<HapticLayer /></button>
      ))}
    </div>
  );
}

export function BookingsScreen() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as 'arrivo' | 'passate') ?? 'arrivo';
  const setTab = (t: 'arrivo' | 'passate') => setParams(t === 'arrivo' ? {} : { tab: t }, { replace: true });
  const all = useBookings();
  const list = tab === 'arrivo' ? upcoming(all) : past(all);
  const navigate = useNav();
  const [pressed, setPressed] = useState<string | null>(null);
  void pressed;

  return (
    <div className="bookings">
      <PageHeader title="Prenotazioni" type="B" />
      <SegmentedControl label="Prenotazioni" value={tab} onChange={setTab} options={[{ v: 'arrivo', l: 'In arrivo' }, { v: 'passate', l: 'Passate' }]} />
      {list.length === 0 ? (
        <div className="empty-state">
          <Icon name="UI/Calendar" size={48} />
          <h2 className="t-title-2" style={{ marginTop: 16 }}>{tab === 'arrivo' ? 'Nessuna prenotazione in arrivo' : 'Nessuna prenotazione passata'}</h2>
          <p className="t-body secondary">{tab === 'arrivo' ? "Quando prenoti un'attività la trovi qui, con il QR per l'ingresso." : 'Qui trovi le attività a cui sei andato e quelle disdette.'}</p>
          {tab === 'arrivo' && <div style={{ marginTop: 16 }}><Button onPress={() => navigate('/scopri', { state: { list: true } })}>Trova un'attività</Button></div>}
        </div>
      ) : (
        <div className="card booking-list">
          {list.map((b) => {
            const a = activity(b.activityId);
            const v = venueOf(a);
            return (
              <TLink key={b.id} to={`/prenotazioni/${b.id}`} className="booking-row pressable" onPointerDown={() => setPressed(b.id)}>
                <Img name={a.photo} style={{ width: 56, height: 56, borderRadius: 12, flex: 'none' }} />
                <span className="booking-row__text">
                  <span className="t-headline">{a.title}</span>
                  <span className="t-subheadline secondary">{whenShort(b)} · {v.name}</span>
                  {b.status === 'checked-in' && <span className="t-footnote-emphasized" style={{ color: 'var(--earn-default)' }}>Check-in fatto · +{checkInPoints(b)} pt</span>}
                  {b.status === 'cancelled' && <span className="t-footnote-emphasized" style={{ color: 'var(--text-tertiary)' }}>Disdetta</span>}
                </span>
                <Icon name="UI/Chevron-Right" size={b.status === 'upcoming' ? 24 : 18} className="chevron" />
              </TLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
