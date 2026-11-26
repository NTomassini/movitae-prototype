import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Icon } from '../Icon';
import { Img } from '../Img';
import './booking.css';

/** Capsula di scelta (standard di scelta): non scelta bianca con bordo, scelta rossa piena, esaurita grigia barrata. */
export function Chip({ label, selected, disabled, onPress, big }: { label: string; selected?: boolean; disabled?: boolean; onPress?: () => void; big?: boolean }) {
  return (
    <button className={`chip${selected ? ' is-selected' : ''} ${big ? 't-headline' : 't-subheadline-emphasized'}`} disabled={disabled}
      aria-pressed={selected} onClick={onPress}>
      {label}
      {disabled && <span className="sr-only"> (esaurito)</span>}
    </button>
  );
}

export function Button({ children, kind = 'primary', fill, disabled, onPress, icon }: { children: React.ReactNode; kind?: 'primary' | 'secondary'; fill?: boolean; disabled?: boolean; onPress?: () => void; icon?: React.ReactNode }) {
  return (
    <button className={`button button--${kind}${fill ? ' button--fill' : ''} t-headline`} disabled={disabled} onClick={onPress}>
      {icon}{children}
    </button>
  );
}

/** ActivityBlock — foto 64 centrata, tre righe: nome, giorno e orario, struttura e via. */
export function ActivityBlock({ photo, title, when, where }: { photo: string; title: string; when: string; where: string }) {
  return (
    <div className="activity-block">
      <Img name={photo} style={{ width: 64, height: 64, borderRadius: 12, flex: 'none' }} />
      <div className="activity-block__text">
        <span className="t-headline">{title}</span>
        <span className="t-subheadline" style={{ marginTop: 4 }}>{when}</span>
        <span className="t-subheadline secondary" style={{ marginTop: 8 }}>{where}</span>
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button role="switch" aria-checked={checked} aria-label={label} className="toggle" onClick={() => onChange(!checked)} />;
}

/** QR vero (codice della prenotazione), disegnato come SVG. */
export function QR({ value }: { value: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => { QRCode.toString(value, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } }).then(setSvg); }, [value]);
  return <span role="img" aria-label="Codice QR della prenotazione" dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Evento per il calendario (Q50): file .ics vero; su iPhone si apre "Aggiungi a Calendario". */
export type CalEvent = { id: string; title: string; dayId: string; time: string; minutes: number; location: string };
const icsDate = (dayId: string, time: string, plus = 0) => {
  const day = dayId === 'oggi' ? 13 : Number(dayId) || 13;
  const [h, m] = time.split(':').map(Number);
  const d = new Date(2026, 10, day, h, m + plus);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
};
const addToCalendar = (e: CalEvent) => {
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Movitae//Prototipo//IT', 'BEGIN:VEVENT', `UID:${e.id}@movitae`,
    `DTSTART;TZID=Europe/Rome:${icsDate(e.dayId, e.time)}`, `DTEND;TZID=Europe/Rome:${icsDate(e.dayId, e.time, e.minutes)}`,
    `SUMMARY:${e.title}`, `LOCATION:${e.location}`, 'DESCRIPTION:Prenotato con Movitae. Mostra il QR all’ingresso.', 'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Tra un’ora', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'movitae-prenotazione.ics';
  document.body.appendChild(a); a.click(); a.remove();
};
const CAL_KEY = 'movitae-calendario';
const added = () => { try { return JSON.parse(sessionStorage.getItem(CAL_KEY) || '[]') as string[]; } catch { return []; } };

export function ActionsCard({ mapsQuery, event }: { mapsQuery: string; event?: CalEvent }) {
  const [done, setDone] = useState(() => !!event && added().includes(event.id));
  const add = () => {
    if (!event || done) return;
    addToCalendar(event);
    try { sessionStorage.setItem(CAL_KEY, JSON.stringify([...added(), event.id])); } catch { /* ignora */ }
    setDone(true);
  };
  return (
    <div className="card actions-card">
      <button className="pressable" onClick={add} aria-disabled={done}>
        <Icon name="UI/Calendar" size={24} />
        {done
          ? <span className="t-body" style={{ flex: 1, color: 'var(--earn-default)', display: 'flex', alignItems: 'center', gap: 4 }}>Aggiunto al calendario<Icon name="UI/Check" size={18} /></span>
          : <span className="t-body" style={{ flex: 1 }}>Aggiungi al calendario</span>}
        {!done && <Icon name="UI/Chevron-Right" size={18} className="chevron" />}
      </button>
      <div className="sep" />
      <a className="pressable" href={`https://maps.apple.com/?q=${encodeURIComponent(mapsQuery)}`} target="_blank" rel="noreferrer">
        <Icon name="Map/Directions" size={24} />
        <span className="t-body" style={{ flex: 1 }}>Indicazioni</span>
        <Icon name="UI/Chevron-Right" size={18} className="chevron" />
      </a>
    </div>
  );
}

/** Logo Apple per il pulsante Apple Pay (in un'app iOS si usa il pulsante di sistema). */
export const AppleLogo = () => (
  <svg width="17" height="20" viewBox="0 0 17 20" aria-hidden="true" fill="currentColor">
    <path d="M14.2 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9C3.7 4.8 2 5.8 1.1 7.4c-1.9 3.3-.5 8.1 1.3 10.8.9 1.3 2 2.7 3.3 2.7 1.3-.1 1.8-.9 3.4-.9s2 .9 3.4.8c1.4 0 2.3-1.3 3.2-2.6 1-1.5 1.4-2.9 1.4-3-.1 0-2.9-1.1-2.9-4.6ZM11.6 3c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.1.1 2.3-.6 3-1.5Z" />
  </svg>
);
