import { Icon } from '../Icon';
import { Img } from '../Img';
import type { IconName } from '../icons';
import type { Sport } from '../../data/data';
import { fmtPoints } from '../../data/data';
import '../home/home.css';
import './scopri.css';

export const sportIcon: Record<Sport, IconName> = {
  padel: 'Activity/Padel', yoga: 'Activity/Yoga', pilates: 'Activity/Yoga', palestra: 'Activity/Weightlifting',
  nuoto: 'Activity/Swimming', calcio: 'Activity/Running', tennis: 'Activity/Padel', basket: 'Activity/Running',
  boxe: 'Activity/Boxing', corsa: 'Activity/Running', 'arti-marziali': 'Activity/Martial-Arts',
};

/** SearchField state=idle — apre la ricerca (passo successivo). */
export function SearchField({ placeholder = 'Cerca sport o struttura', onPress }: { placeholder?: string; onPress?: () => void }) {
  return (
    <button className="search-field glass-control pressable" onClick={onPress}>
      <Icon name="UI/Search-Field" size={20} />
      <span className="t-body">{placeholder}</span>
    </button>
  );
}

/** IconButton size=48: style=glass, oppure filled-red con badge quando ci sono filtri attivi. */
export function GlassIconButton({ icon, label, onPress, badge }: { icon: IconName; label: string; onPress?: () => void; badge?: number }) {
  return (
    <button className={`icon-button-glass pressable ${badge ? 'icon-button--filled' : 'glass-control'}`} aria-label={badge ? `${label}, ${badge} attivo` : label} onClick={onPress}>
      <Icon name={icon} size={24} />
      {!!badge && <span className="icon-button__badge" aria-hidden="true">{badge}</span>}
    </button>
  );
}

/** FilterSummary kind=filters — capsula di vetro con il filtro attivo e chevron.down (riapre il pannello). */
export function FilterSummary({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <button className="filter-summary glass-control pressable" onClick={onPress}>
      <span className="t-subheadline-emphasized">{label}</span>
      <Icon name="UI/Chevron-Down" size={20} />
    </button>
  );
}

export function ActivityRow({ title, place, price, points, photo, onPress }: { title: string; place: string; price: string; points: number; photo: string; onPress?: () => void }) {
  return (
    <button className="activity-row pressable" onClick={onPress}>
      <Img name={photo} style={{ width: 72, height: 72, borderRadius: 12, flex: 'none' }} />
      <span className="activity-row__body">
        <span className="t-headline">{title}</span>
        <span className="t-subheadline secondary">{place}</span>
        <span className="venue-card__price">
          <span className="t-subheadline-emphasized">{price}</span>
          <span className="points-badge t-footnote-emphasized">+{fmtPoints(points)} pt</span>
        </span>
      </span>
    </button>
  );
}

/** Elemento DOM del pin per MapLibre (MapPin kind=sport | group | selected). */
export function pinElement(kind: 'sport' | 'group' | 'selected', opts: { icon?: IconName; count?: number; label?: string }, svg: (name: IconName, size: number) => string) {
  const el = document.createElement('button');
  el.className = `map-pin map-pin--${kind}`;
  if (kind === 'sport') el.innerHTML = svg(opts.icon!, 20);
  if (kind === 'group') el.textContent = String(opts.count);
  if (kind === 'selected') {
    // il nome va come testo, mai come HTML
    el.innerHTML = svg(opts.icon!, 20);
    const t = document.createElement('span'); t.className = 't-subheadline-emphasized'; t.textContent = opts.label ?? ''; el.appendChild(t);
  }
  return el;
}
