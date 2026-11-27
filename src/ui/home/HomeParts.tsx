import { RollingNumber } from '../RollingNumber';
import { TLink } from '../../app/TLink';
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
    <button className="avatar glass-control glass-system t-headline" aria-label={label}
      onPointerDown={down} onPointerUp={up} onPointerLeave={up} onContextMenu={(e) => e.preventDefault()}
      onClick={() => { if (!long) onPress?.(); }}>{initial}</button>
  );
}

export function SectionHeader({ title, link, to }: { title: string; link?: string; to?: string }) {
  return (
    <div className="section-header">
      <h2 className="t-title-2">{title}</h2>
      {link && <TLink to={to ?? '#'} className="section-header__link t-subheadline-emphasized">{link}</TLink>}
    </div>
  );
}

export function SportShelfItem({ label, image, to }: { label: string; image: string; to: string }) {
  return (
    <TLink to={to} className="sport-tile pressable" aria-label={label}>
      <Img name={image} style={{ width: 46, height: 46 }} />
      <span className="t-caption">{label}</span>
    </TLink>
  );
}

export function BookingCard({ title, subtitle, photo, to }: { title: string; subtitle: string; photo: string; to: string }) {
  return (
    <TLink to={to} className="booking-card pressable">
      <Img name={photo} style={{ width: 48, height: 48, borderRadius: 12, flex: 'none' }} />
      <span className="booking-card__body">
        <span className="t-headline">{title}</span>
        <span className="t-subheadline secondary">{subtitle}</span>
      </span>
      <Icon name="UI/Chevron-Right" size={20} className="chevron" />
    </TLink>
  );
}

type StatTileProps =
  | { kind: 'points'; points: number; nextVoucher: number; note: string; to: string }
  | { kind: 'savings'; amount: number; note: string; to: string };

/** StatTile kind=points | savings, hasChevron=true (porta altrove → freccia in alto a destra). */
export function StatTile(p: StatTileProps) {
  return (
    <TLink to={p.to} className="stat-tile pressable" style={{ textDecoration: 'none' }}>
      <Icon name="UI/Chevron-Right" size={18} className="stat-tile__chevron" />
      <span className="t-footnote-emphasized stat-tile__label">{p.kind === 'points' ? 'I tuoi punti' : 'Hai risparmiato'}</span>
      {p.kind === 'points' ? (
        <>
          <span style={{ lineHeight: '34px', height: 34 }}><span className="t-number-large" style={{ lineHeight: 'inherit' }}><RollingNumber id="points" value={p.points} format={fmtPoints} /></span><span className="t-headline" style={{ lineHeight: 'inherit', letterSpacing: '-0.02em' }}> pt</span></span>
          <span className="stat-tile__progress"><span style={{ width: `${Math.min(p.points / p.nextVoucher, 1) * 100}%` }} /></span>
        </>
      ) : (
        <span className="t-number-large" style={{ color: 'var(--earn-default)' }}><RollingNumber id="saved" value={p.amount} format={(n) => `€${n}`} /></span>
      )}
      <span className="t-footnote stat-tile__label" style={{ fontWeight: 400 }}>{p.note}</span>
    </TLink>
  );
}

export function VenueCard({ title, place, price, points, photo, to }: { title: string; place: string; price: string; points: number; photo: string; to: string }) {
  return (
    <TLink to={to} className="venue-card pressable" style={{ textDecoration: 'none' }}>
      <Img name={photo} style={{ width: 240, height: 180, borderRadius: 16 }} />
      <span className="venue-card__body">
        <span className="t-headline">{title}</span>
        <span className="t-subheadline secondary">{place}</span>
        <span className="venue-card__price">
          <span className="t-subheadline-emphasized">{price}</span>
          <span className="points-badge t-footnote-emphasized">+{fmtPoints(points)} pt</span>
        </span>
      </span>
    </TLink>
  );
}
