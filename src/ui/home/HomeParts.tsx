import { Link } from 'react-router-dom';
import { Icon } from '../Icon';
import { Img } from '../Img';
import { fmtPoints } from '../../data/data';
import './home.css';

// Nomi = componenti Figma (DS · Componenti). Props = proprietà dei componenti.

/** Avatar 44: tocco = profilo; pressione lunga (0,6 s) = pannello demo (solo strumento, Q33). */
export function Avatar({ initial, label, onPress, onLongPress }: { initial: string; label: string; onPress?: () => void; onLongPress?: () => void }) {
  let timer: number | undefined;
  let long = false;
  const down = () => { long = false; timer = window.setTimeout(() => { long = true; onLongPress?.(); }, 600); };
  const up = () => window.clearTimeout(timer);
  return (
    <button className="avatar pressable t-headline" aria-label={label}
      onPointerDown={down} onPointerUp={up} onPointerLeave={up} onContextMenu={(e) => e.preventDefault()}
      onClick={() => { if (!long) onPress?.(); }}>{initial}</button>
  );
}

export function SectionHeader({ title, link, to }: { title: string; link?: string; to?: string }) {
  return (
    <div className="section-header">
      <h2 className="t-title-2">{title}</h2>
      {link && <Link to={to ?? '#'} className="section-header__link t-subheadline-emphasized">{link}</Link>}
    </div>
  );
}

/** MissionCard state=active — anello: spessore 6 (innerRadius 0,89), parte da ore 12, estremi piatti. */
export function MissionCard({ goal, steps, points, streak, onPress }: { goal: number; steps: number; points: number; streak: number; onPress?: () => void }) {
  const left = Math.max(goal - steps, 0);
  const progress = Math.min(steps / goal, 1);
  const r = 53;
  const c = 2 * Math.PI * r;
  return (
    <button className="mission-card pressable" onClick={onPress} aria-label={`Missione di oggi: ${fmtPoints(goal)} passi, ne mancano ${fmtPoints(left)}. ${streak} giorni di fila.`}>
      <span className="mission-card__text">
        <span className="mission-card__lines">
          <span className="t-footnote-emphasized mission-card__muted">Missione di oggi</span>
          <span className="t-title-3">{fmtPoints(goal)} passi · +{points} pt</span>
          <span className="t-subheadline mission-card__muted">Ne mancano {fmtPoints(left)}</span>
        </span>
        <span className="mission-card__streak">
          <span className="mission-card__flame"><Img name="img/fiamma" style={{ width: 20, height: 20 }} /></span>
          <span className="t-subheadline-emphasized">{streak} giorni di fila</span>
        </span>
      </span>
      <span className="mission-card__ring" aria-hidden="true">
        <svg width="112" height="112" viewBox="0 0 112 112">
          <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="6" />
          <circle cx="56" cy="56" r={r} fill="none" stroke="#fff" strokeWidth="6" strokeDasharray={`${c * progress} ${c}`} />
        </svg>
        <span className="mission-card__ring-label">
          <span className="t-number-large">{fmtPoints(steps)}</span>
          <span className="t-caption mission-card__muted">passi</span>
        </span>
      </span>
    </button>
  );
}

export function SportShelfItem({ label, image, to }: { label: string; image: string; to: string }) {
  return (
    <Link to={to} className="sport-tile pressable" aria-label={label}>
      <Img name={image} style={{ width: 46, height: 46 }} />
      <span className="t-caption">{label}</span>
    </Link>
  );
}

export function BookingCard({ title, subtitle, photo, to }: { title: string; subtitle: string; photo: string; to: string }) {
  return (
    <Link to={to} className="booking-card pressable">
      <Img name={photo} style={{ width: 48, height: 48, borderRadius: 12, flex: 'none' }} />
      <span className="booking-card__body">
        <span className="t-headline">{title}</span>
        <span className="t-subheadline secondary">{subtitle}</span>
      </span>
      <Icon name="UI/Chevron-Right" size={20} className="chevron" />
    </Link>
  );
}

type StatTileProps =
  | { kind: 'points'; points: number; nextVoucher: number; note: string; to: string }
  | { kind: 'savings'; amount: number; note: string; to: string };

/** StatTile kind=points | savings, hasChevron=true (porta altrove → freccia in alto a destra). */
export function StatTile(p: StatTileProps) {
  return (
    <Link to={p.to} className="stat-tile pressable" style={{ textDecoration: 'none' }}>
      <Icon name="UI/Chevron-Right" size={18} className="stat-tile__chevron" />
      <span className="t-footnote-emphasized stat-tile__label">{p.kind === 'points' ? 'I tuoi punti' : 'Hai risparmiato'}</span>
      {p.kind === 'points' ? (
        <>
          <span style={{ lineHeight: '34px', height: 34 }}><span className="t-number-large" style={{ lineHeight: 'inherit' }}>{fmtPoints(p.points)}</span><span className="t-headline" style={{ lineHeight: 'inherit', letterSpacing: '-0.02em' }}> pt</span></span>
          <span className="stat-tile__progress"><span style={{ width: `${Math.min(p.points / p.nextVoucher, 1) * 100}%` }} /></span>
        </>
      ) : (
        <span className="t-number-large" style={{ color: 'var(--earn-default)' }}>€{p.amount}</span>
      )}
      <span className="t-footnote stat-tile__label" style={{ fontWeight: 400 }}>{p.note}</span>
    </Link>
  );
}

export function VenueCard({ title, place, price, points, photo, to }: { title: string; place: string; price: string; points: number; photo: string; to: string }) {
  return (
    <Link to={to} className="venue-card pressable" style={{ textDecoration: 'none' }}>
      <Img name={photo} style={{ width: 240, height: 180, borderRadius: 16 }} />
      <span className="venue-card__body">
        <span className="t-headline">{title}</span>
        <span className="t-subheadline secondary">{place}</span>
        <span className="venue-card__price">
          <span className="t-subheadline-emphasized">{price}</span>
          <span className="points-badge t-footnote-emphasized">+{fmtPoints(points)} pt</span>
        </span>
      </span>
    </Link>
  );
}
