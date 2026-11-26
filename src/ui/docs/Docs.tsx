import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ScreenOverlay } from '../../app/ScreenOverlay';
import { venues } from '../../data/data';
import { store, useAppState, type Certificate } from '../../state/bookings';
import { Icon } from '../Icon';
import { PageSheet } from '../PageSheet';
import { Toggle, Button } from '../booking/BookingParts';
import { SegmentedControl } from '../../screens/BookingsScreen';
import { ListGroup } from '../settings/List';
import './docs.css';

// ---------- date (il prototipo vive venerdì 13 novembre 2026) ----------
export const TODAY = '2026-11-13';
const M = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const ML = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const parts = (d: string) => d.split('-').map(Number);
export const fmtShort = (d: string) => { const [y, m, g] = parts(d); return `${g} ${M[m - 1]} ${y}`; };
export const fmtLong = (d: string) => { const [y, m, g] = parts(d); return `${g} ${ML[m - 1]} ${y}`; };
export const fmtDay = (d: string) => { const [, m, g] = parts(d); return `${g} ${M[m - 1]}`; };
export const plusYear = (d: string) => { const [y, m, g] = parts(d); return `${y + 1}-${String(m).padStart(2, '0')}-${String(g).padStart(2, '0')}`; };
const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
export type CertState = 'valid' | 'soon' | 'expired';
export const certState = (c: Certificate): CertState => (c.expires < TODAY ? 'expired' : days(TODAY, c.expires) <= 30 ? 'soon' : 'valid');

/** Stato del certificato con icona + testo (mai solo colore). */
export function CertStatus({ c }: { c: Certificate }) {
  const st = certState(c);
  if (st === 'expired') return <span className="doc-status doc-status--error t-subheadline"><Icon name="UI/Alert" size={16} />Scaduto il {fmtShort(c.expires)}</span>;
  if (st === 'soon') return <span className="doc-status t-subheadline secondary"><Icon name="UI/Clock" size={16} />Scade tra {days(TODAY, c.expires)} giorni</span>;
  return <span className="doc-status doc-status--ok t-subheadline"><Icon name="UI/Check" size={16} />Valido fino al {fmtShort(c.expires)}</span>;
}
export const DocIcon = () => <span className="list-row__icon"><Icon name="UI/Document" size={24} /></span>;

// ---------- card documenti nel riepilogo (documenti/1, /3, conferme/1–2) ----------
export function DocCard({ venueId, kind, onOpenForm, onUpload }: { venueId: string; kind: 'form' | 'certificate'; onOpenForm: () => void; onUpload: (anchor: HTMLElement) => void }) {
  const { docs } = useAppState();
  const v = venues.find((x) => x.id === venueId)!;
  const link = useRef<HTMLButtonElement>(null);
  if (kind === 'form') {
    const signed = docs.forms[venueId];
    const inner = (
      <>
        <DocIcon />
        <span className="doc-card__texts">
          <span className="t-headline">Modulo di {v.name}</span>
          {signed ? <span className="doc-status doc-status--ok t-subheadline"><Icon name="UI/Check" size={16} />Firmato {signed === TODAY ? 'oggi' : `il ${fmtLong(signed)}`}</span>
            : <span className="t-subheadline secondary">Da firmare prima di pagare</span>}
        </span>
        {!signed && <Icon name="UI/Chevron-Right" size={18} className="chevron" />}
      </>
    );
    return signed ? <div className="card doc-card">{inner}</div> : <button className="card doc-card pressable" onClick={onOpenForm}>{inner}</button>;
  }
  const c = docs.certificate;
  const ok = c && certState(c) !== 'expired';
  return (
    <div className="card doc-card doc-card--column">
      <div className="doc-card__row">
        <DocIcon />
        <span className="doc-card__texts">
          <span className="t-headline">Certificato medico</span>
          {c ? <CertStatus c={c} /> : <span className="t-subheadline secondary">Non l’hai ancora caricato</span>}
        </span>
      </div>
      {!ok && (
        <>
          <p className="t-subheadline secondary">{c ? 'Per prenotare qui serve quello nuovo.' : 'Senza certificato la piscina può non farti entrare.'}</p>
          <button ref={link} className="doc-link t-headline" onClick={() => onUpload(link.current!)}>Caricalo ora</button>
        </>
      )}
    </div>
  );
}

// ---------- modulo della struttura (documenti/2), anche in sola lettura (Q46) ----------
const RULES = [
  'Hai letto il regolamento della palestra e lo rispetti.',
  'Dichiari di stare bene e di poter fare attività fisica.',
  'Usi gli attrezzi come ti indica lo staff.',
  'Se ti fai male o non stai bene, avvisi subito lo staff.',
];
export function FormSheet({ venueId, onClose }: { venueId: string; onClose: () => void }) {
  const { docs } = useAppState();
  const v = venues.find((x) => x.id === venueId)!;
  const signed = docs.forms[venueId];
  const [ok, setOk] = useState(false);
  const [full, setFull] = useState(false);
  return (
    <PageSheet title="Modulo della struttura" onCancel={onClose}
      footer={signed ? undefined : <Button disabled={!ok} onPress={() => { store.signForm(venueId); onClose(); }}>Firma</Button>}>
      <h3 className="t-title-2">{v.name}</h3>
      <p className="t-body secondary" style={{ marginTop: 4 }}>Si firma una volta e vale per tutti i prossimi ingressi.</p>
      <ul className="doc-rules">{RULES.map((r) => <li key={r} className="t-body">{r}</li>)}</ul>
      <button className="doc-link t-headline" style={{ marginTop: 19 }} onClick={() => setFull(!full)} aria-expanded={full}>{full ? 'Nascondi il regolamento' : 'Leggi il regolamento completo'}</button>
      {full && (
        <p className="t-subheadline secondary" style={{ marginTop: 8 }}>
          Regolamento di esempio. Si entra con scarpe pulite e asciugamano. Gli attrezzi vanno rimessi a posto dopo l’uso.
          Lo staff può chiedere di lasciare la sala a chi non rispetta le indicazioni. La struttura non risponde degli oggetti lasciati fuori dagli armadietti.
        </p>
      )}
      {signed ? (
        <p className="doc-status doc-status--ok t-body" style={{ marginTop: 24 }}><Icon name="UI/Check" size={18} />Firmato il {fmtLong(signed)}</p>
      ) : (
        <div className="doc-accept">
          <span className="t-body">Ho letto e accetto</span>
          <Toggle checked={ok} onChange={setOk} label="Ho letto e accetto" />
        </div>
      )}
    </PageSheet>
  );
}

// ---------- menu "Caricalo ora" / "Sostituisci" (documenti/4) ----------
export type Picked = { kind: 'scan' } | { kind: 'file'; url: string; name: string };
export function UploadMenu({ anchor, onPick, onClose }: { anchor: HTMLElement | null; onPick: (p: Picked) => void; onClose: () => void }) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const photo = useRef<HTMLInputElement>(null);
  const file = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    const host = document.getElementById('overlay');
    if (!anchor || !host) return;
    const a = anchor.getBoundingClientRect(); const h = host.getBoundingClientRect();
    const top = Math.min(a.bottom - h.top + 8, h.height - 146 - 120);
    setPos({ left: Math.max(16, a.left - h.left), top });
  }, [anchor]);
  const fromInput = (el: HTMLInputElement | null) => {
    const f = el?.files?.[0]; if (!f) return;
    onPick({ kind: 'file', url: URL.createObjectURL(f), name: f.name });
  };
  return (
    <ScreenOverlay>
      <div className="upload-scrim" onClick={onClose} />
      <AnimatePresence>
        {pos && (
          <motion.div className="upload-menu" role="menu" style={pos}
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', visualDuration: 0.3, bounce: 0.15 }}>
            <button role="menuitem" className="t-body" onClick={() => onPick({ kind: 'scan' })}>Scansiona documento<Icon name="UI/Scan" size={22} /></button>
            <button role="menuitem" className="t-body" onClick={() => photo.current?.click()}>Scegli dalle foto<Icon name="UI/Photo" size={22} /></button>
            <button role="menuitem" className="t-body" onClick={() => file.current?.click()}>Scegli da File<Icon name="UI/Folder" size={22} /></button>
            <input ref={photo} type="file" accept="image/*" hidden onChange={(e) => fromInput(e.target)} />
            <input ref={file} type="file" accept="image/*,application/pdf" hidden onChange={(e) => fromInput(e.target)} />
          </motion.div>
        )}
      </AnimatePresence>
    </ScreenOverlay>
  );
}

// ---------- "Controlla i dati" (documenti/5, errori/4) ----------
export function CertificateSheet({ picked, initial, onCancel, onSaved }: { picked: Picked; initial?: Certificate | null; onCancel: () => void; onSaved: () => void }) {
  const [type, setType] = useState<'non' | 'ago'>(initial?.type ?? 'non');
  const [issued, setIssued] = useState(initial?.issued ?? '2026-09-12');
  const [expires, setExpires] = useState(initial?.expires ?? plusYear('2026-09-12'));
  const expired = expires < TODAY;
  return (
    <PageSheet title="Certificato medico" onCancel={onCancel}
      footer={<Button onPress={() => { store.setCertificate({ type, issued, expires }); onSaved(); }}>Salva</Button>}>
      <div className="cert-thumb">
        {picked.kind === 'file' && /\.pdf$/i.test(picked.name) ? <span className="t-footnote secondary">{picked.name}</span>
          : picked.kind === 'file' ? <img src={picked.url} alt="Certificato scelto" />
            : <span aria-label="Certificato scansionato" role="img"><i style={{ width: 60, height: 6, marginTop: 20 }} /><i style={{ width: 88, marginTop: 10 }} /><i style={{ width: 80 }} /><i style={{ width: 84 }} /><i style={{ width: 88, marginTop: 14 }} /><i style={{ width: 70 }} /><i style={{ width: 86 }} /><i style={{ width: 44, height: 8, marginTop: 30, alignSelf: 'flex-end' }} /></span>}
      </div>
      <ListGroup label="Tipo" className="cert-group">
        <SegmentedControl value={type} onChange={setType} label="Tipo di certificato" options={[{ v: 'non', l: 'Non agonistico' }, { v: 'ago', l: 'Agonistico' }]} />
      </ListGroup>
      <ListGroup label="Date" className="cert-group"
        note={expired ? undefined : 'Di solito vale un anno dal rilascio. Controlla la data scritta sul certificato.'}>
        <label className="list-row cert-date"><span className="list-row__texts"><span className="t-body">Rilasciato il</span><span className="t-subheadline secondary">{fmtShort(issued)}</span></span>
          <input type="date" value={issued} max={TODAY} onChange={(e) => { if (!e.target.value) return; setIssued(e.target.value); setExpires(plusYear(e.target.value)); }} aria-label="Rilasciato il" /></label>
        <label className="list-row cert-date"><span className="list-row__texts"><span className="t-body">Scade il</span><span className={`t-subheadline ${expired ? 'cert-date--error' : 'secondary'}`}>{fmtShort(expires)}</span></span>
          <input type="date" value={expires} onChange={(e) => e.target.value && setExpires(e.target.value)} aria-label="Scade il" /></label>
      </ListGroup>
      {expired && <p className="doc-error t-subheadline" role="alert"><Icon name="UI/Alert" size={16} />Questo certificato è scaduto il {fmtDay(expires)}: per prenotare qui serve quello nuovo.</p>}
    </PageSheet>
  );
}

/** Flusso completo "Caricalo ora": menu → Controlla i dati → card aggiornata. */
export function useUpload() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const ui = (
    <>
      {anchor && <UploadMenu anchor={anchor} onClose={() => setAnchor(null)} onPick={(p) => { setAnchor(null); setTimeout(() => setPicked(p), 150); }} />}
      <AnimatePresence>{picked && <CertificateSheet key="cert" picked={picked} initial={null} onCancel={() => setPicked(null)} onSaved={() => setPicked(null)} />}</AnimatePresence>
    </>
  );
  return { open: (el: HTMLElement) => setAnchor(el), ui, setPicked };
}
