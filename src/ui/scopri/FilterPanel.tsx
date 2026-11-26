import { useState } from 'react';
import { motion } from 'motion/react';
import { activities, days, euro, shelfSports, type Sport } from '../../data/data';
import { Img } from '../Img';
import { Chip } from '../booking/BookingParts';
import { SegmentedControl } from '../../screens/BookingsScreen';
import { NO_FILTERS, apply, countFilters, dist, kmLabel, unitPrice, type Filters, type Moment } from './filters';
import './filters.css';

type Tab = 'sport' | 'prezzo' | 'quando' | 'distanza';
const TABS: { v: Tab; l: string }[] = [{ v: 'sport', l: 'Sport' }, { v: 'prezzo', l: 'Prezzo' }, { v: 'quando', l: 'Quando' }, { v: 'distanza', l: 'Distanza' }];

/**
 * Pannello dei filtri (flusso-filtri/2–3b): vetro spesso sotto la barra, la mappa resta visibile.
 * Ogni cambio aggiorna subito pin e lista; "Mostra N attività" chiude il pannello, "Azzera" toglie tutto.
 */
export function FilterPanel({ value, onChange, onClose }: { value: Filters; onChange: (f: Filters) => void; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('sport');
  const n = apply(value).length;
  const set = (p: Partial<Filters>) => onChange({ ...value, ...p });
  return (
    <motion.div className={`filter-panel glass-control${tab === 'sport' ? ' is-sport' : ''}`} role="dialog" aria-label="Filtri"
      style={{ transformOrigin: '92% 0%' }}
      initial={{ opacity: 0, scale: 0.92, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: -6 }}
      transition={{ type: 'spring', visualDuration: 0.35, bounce: 0.12 }}>
      <div className="filter-tabs" role="tablist" aria-label="Filtri">
        {TABS.map((t) => <button key={t.v} role="tab" aria-selected={tab === t.v} className={`t-footnote-emphasized${tab === t.v ? ' is-on' : ''}`} onClick={() => setTab(t.v)}>{t.l}</button>)}
      </div>

      {tab === 'sport' && (
        <>
          <div className="filter-sports" role="group" aria-label="Sport">
            {shelfSports.map((s) => {
              const on = value.sports.includes(s.sport);
              return (
                <button key={s.sport} className={`filter-sport pressable${on ? ' is-on' : ''}`} aria-pressed={on}
                  onClick={() => set({ sports: on ? value.sports.filter((x) => x !== s.sport) : [...value.sports, s.sport as Sport] })}>
                  <Img name={s.image} style={{ width: 40, height: 40 }} />
                  <span className="t-caption" style={{ fontWeight: on ? 600 : undefined }}>{s.label}</span>
                </button>
              );
            })}
          </div>
          <div className="filter-field">
            <span className="t-footnote-emphasized secondary">Dove</span>
            <SegmentedControl label="Dove" value={value.indoor == null ? 'tutti' : value.indoor ? 'chiuso' : 'aperto'}
              onChange={(v) => set({ indoor: v === 'tutti' ? null : v === 'chiuso' })}
              options={[{ v: 'tutti', l: 'Tutti' }, { v: 'chiuso', l: 'Al chiuso' }, { v: 'aperto', l: 'All’aperto' }]} />
          </div>
        </>
      )}

      {tab === 'prezzo' && (
        <RangeFilter label="Prezzo massimo" min={0} max={60} step={1}
          value={value.maxPrice} onChange={(v) => set({ maxPrice: v })}
          valueLabel={value.maxPrice == null ? 'Qualsiasi' : `Fino a ${euro(value.maxPrice)}`}
          ends={['€0', '€60+']} data={apply(value, 'maxPrice').map(unitPrice)} />
      )}

      {tab === 'distanza' && (
        <RangeFilter label="Distanza massima" min={0.5} max={10} step={0.5}
          value={value.maxDist} onChange={(v) => set({ maxDist: v })}
          valueLabel={value.maxDist == null ? 'Qualsiasi' : `Entro ${kmLabel(value.maxDist)}`}
          ends={['500 m', '10 km']} data={apply(value, 'maxDist').map(dist)} />
      )}

      {tab === 'quando' && (
        <>
          <div className="filter-field">
            <span className="t-footnote-emphasized secondary">Giorno</span>
            <div className="chips filter-chips" role="group" aria-label="Giorno">
              {days.map((d) => <Chip key={d.id} label={d.short} selected={value.day === d.id} onPress={() => set({ day: value.day === d.id ? null : d.id })} />)}
            </div>
          </div>
          <div className="filter-field">
            <span className="t-footnote-emphasized secondary">Momento</span>
            <div className="filter-moments" role="group" aria-label="Momento">
              {(['mattina', 'pomeriggio', 'sera'] as Moment[]).map((m) => (
                <Chip key={m} label={m.charAt(0).toUpperCase() + m.slice(1)} selected={value.moment === m} onPress={() => set({ moment: value.moment === m ? null : m })} />
              ))}
            </div>
          </div>
        </>
      )}

      <div className="filter-foot">
        <button className="t-subheadline-emphasized filter-reset" disabled={!countFilters(value)} onClick={() => onChange(NO_FILTERS)}>Azzera</button>
        <button className="button button--primary t-subheadline-emphasized filter-show" onClick={onClose} disabled={n === 0}>
          {n === 0 ? 'Nessuna attività' : `Mostra ${n} attività`}
        </button>
      </div>
    </motion.div>
  );
}

/** Istogramma + cursore (Airbnb): le barre fino al valore sono rosse; a fine corsa = nessun limite. */
function RangeFilter({ label, min, max, step, value, onChange, valueLabel, ends, data }: {
  label: string; min: number; max: number; step: number; value: number | null; onChange: (v: number | null) => void;
  valueLabel: string; ends: [string, string]; data: number[];
}) {
  const bins = 24;
  const counts = Array.from({ length: bins }, (_, i) => {
    const lo = min + ((max - min) * i) / bins, hi = min + ((max - min) * (i + 1)) / bins;
    return data.filter((d) => d >= lo && (i === bins - 1 ? true : d < hi)).length;
  });
  // (le attività sono poche: le barre vuote restano basse ma visibili, come nella tavola)
  const top = Math.max(1, ...counts);
  const v = value ?? max;
  return (
    <>
      <div className="filter-range__head">
        <span className="t-subheadline secondary">{label}</span>
        <span className="t-headline">{valueLabel}</span>
      </div>
      <div className="filter-histo" aria-hidden="true">
        {counts.map((c, i) => {
          const at = min + ((max - min) * (i + 0.5)) / bins;
          return <i key={i} style={{ height: 9 + (47 * c) / top }} className={at <= v ? 'is-on' : ''} />;
        })}
      </div>
      <input className="filter-slider" type="range" min={min} max={max} step={step} value={v} aria-label={label} aria-valuetext={valueLabel}
        style={{ ['--p' as string]: `${((v - min) / (max - min)) * 100}%` }}
        onChange={(e) => { const x = Number(e.target.value); onChange(x >= max ? null : x); }} />
      <div className="filter-range__ends"><span className="t-footnote secondary">{ends[0]}</span><span className="t-footnote secondary">{ends[1]}</span></div>
    </>
  );
}

export const allActivitiesCount = activities.length;
