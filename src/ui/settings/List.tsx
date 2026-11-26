import type { ReactNode } from 'react';
import { Icon } from '../Icon';
import './settings.css';

/**
 * ListGroup + ListRow (DS · Componenti): card bianca raggio 24, righe 52 (74 con sottotitolo), padding 14/16,
 * separatore che parte dal testo, freccia › 24 grigia. Etichetta 13 Semi Bold a x 32, 8 sopra; nota 13 grigia 8 sotto.
 */
export function ListGroup({ label, note, children, className = '' }: { label?: string; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`list-group ${className}`}>
      {label && <h2 className="list-group__label t-footnote-emphasized">{label}</h2>}
      <div className="list-group__card">{children}</div>
      {note && <p className="list-group__note t-footnote">{note}</p>}
    </section>
  );
}

export function ListRow({ title, subtitle, value, chevron = true, tone, onPress, right, leading, titleClass = 't-body', label }: {
  title: ReactNode; subtitle?: ReactNode; value?: ReactNode; chevron?: boolean; tone?: 'accent' | 'error';
  onPress?: () => void; right?: ReactNode; leading?: ReactNode; titleClass?: string; label?: string;
}) {
  const inner = (
    <>
      {leading}
      <span className="list-row__texts">
        <span className={titleClass} style={tone ? { color: tone === 'accent' ? 'var(--brand-accent)' : 'var(--feedback-error)' } : undefined}>{title}</span>
        {subtitle && <span className="t-subheadline secondary">{subtitle}</span>}
      </span>
      {value != null && <span className="list-row__value t-body">{value}</span>}
      {right}
      {chevron && onPress && <Icon name="UI/Chevron-Right" size={24} className="list-row__chevron" />}
    </>
  );
  return onPress
    ? <button className="list-row pressable-row" onClick={onPress} aria-label={label}>{inner}</button>
    : <div className="list-row">{inner}</div>;
}
