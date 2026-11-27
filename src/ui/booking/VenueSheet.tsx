import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { peekZoom, type ZoomSource } from './zoom';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { activity, days, euro, fmtPoints, services, venueOf } from '../../data/data';
import { DetentSheet, type DetentSheetHandle } from '../DetentSheet';
import { Icon } from '../Icon';
import { Img } from '../Img';
import { Button, Chip, HapticLayer } from './BookingParts';
import { store, useAppState } from '../../state/bookings';

type D = 'half' | 'large';
// Figma: mezza altezza con il bordo a y 392, grande a y 54 (su 874).
// Q75 (27 nov): la mezza altezza finisce 24 sopra la barra in basso subito dopo il blocco del prezzo (nome, foto,
// prezzo e punti), senza capsule tagliate; misurata sullo sheet (vedi halfOffset). Prima: bordo a y 392 (h − 482).
let halfOffset: number | null = null; // dal bordo dello sheet alla fine del blocco del prezzo + 24 + barra in basso
const tops = (h: number) => ({ half: halfOffset != null ? Math.min(Math.max(h - halfOffset, 54), h - 300) : Math.max(h - 482, 54), large: 54 });
// Da Movi (flusso-movi/6) la scheda parte più alta, con il bordo a y 190, sopra un velo.
const topsMovi = (h: number) => ({ half: Math.max(h - 684, 54), large: 54 });

/**
 * Scheda della struttura (flusso-sport/3). Toccare un orario lo sceglie; "Prenota alle …" è spento
 * finché non scegli. In fondo restano sempre Indicazioni e Prenota (BottomBar kind=venue).
 */
export function VenueSheet({ activityId, onClose, onClosing, onBook, from = 'scopri' }: { activityId: string; onClose: () => void; onClosing?: () => void; onBook: (dayId: string, time: string) => void; from?: 'scopri' | 'movi' }) {
  const a = activity(activityId);
  const v = venueOf(a);
  const [detent, setDetent] = useState<D>('half');
  const [day, setDay] = useState(days[0].id);
  const [time, setTime] = useState<string | null>(null);
  const fav = useAppState().favorites.includes(activityId);
  const setFav = () => store.toggleFavorite(activityId);
  const sheet = useRef<DetentSheetHandle>(null);
  const body = useRef<HTMLDivElement>(null);
  // Q93: lo sheet è alto quanto lo schermo e spostato in giù di y, quindi la sua parte bassa è fuori schermo;
  // il fondo del contenuto = posizione + barra in basso (con l'area sicura) + 24, così l'ultima riga si legge tutta (prima "Gratis fino a 2 ore prima" restava tagliata)
  const sheetY = useMotionValue(10000);
  const [barH, setBarH] = useState(130);
  const bodyPad = useTransform(sheetY, (v) => Math.max(0, Math.min(v, 2000)) + barH + 24);
  // Q87: tornando a mezza altezza il contenuto torna in cima (lì non scorre)
  useEffect(() => { if (detent === 'half') body.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [detent]);
  const [closing, setClosing] = useState(false);
  // Q65: foto che vola dalla card alla scheda (e indietro alla chiusura, se la card è ancora sotto)
  type R = { x: number; y: number; w: number; h: number; r: number };
  const [fly, setFly] = useState<{ from: R; to: R; src: string; done?: () => void } | null>(null);
  const zoom = useRef<ZoomSource | null>(null);
  const measure = () => {
    const el = document.querySelector<HTMLElement>('.venue-sheet');
    const photo = el?.querySelector<HTMLElement>('.venue-sheet__photo');
    const parent = el?.parentElement;
    if (!el || !photo || !parent) return null;
    const P = parent.getBoundingClientRect(), S = el.getBoundingClientRect(), Ph = photo.getBoundingClientRect();
    return { P, S, Ph };
  };
  // Q75: misura della mezza altezza prima che lo sheet entri (gli effetti di layout vengono prima della sua molla)
  useLayoutEffect(() => {
    if (from === 'movi') return;
    const el = document.querySelector<HTMLElement>('.venue-sheet');
    const when = el?.querySelector<HTMLElement>('.venue-sheet__when');
    const bar = document.querySelector<HTMLElement>('.bottom-bar');
    if (!el || !when) return;
    const priceEnd = when.getBoundingClientRect().top - el.getBoundingClientRect().top - 24;
    halfOffset = priceEnd + 24 + (bar?.offsetHeight ?? 96);
  }, [from, activityId]);
  useLayoutEffect(() => {
    const z = peekZoom();
    const m = measure();
    if (!z || !m) return;
    zoom.current = z;
    const finalTop = (from === 'movi' ? topsMovi : tops)(m.P.height).half + (m.Ph.top - m.S.top);
    setFly({ src: z.src,
      from: { x: z.rect.left - m.P.left, y: z.rect.top - m.P.top, w: z.rect.width, h: z.rect.height, r: z.radius },
      to: { x: m.Ph.left - m.P.left, y: finalTop, w: m.Ph.width, h: m.Ph.height, r: 20 } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // chiusura animata: lo sheet scende, la barra esce, poi si torna a Scopri
  const close = async (alreadyDown = false) => {
    setClosing(true);
    onClosing?.(); // Q82: in Scopri la lista comincia a risalire mentre la scheda scende
    const z = zoom.current;
    const m = measure();
    // la foto torna nella card solo se la card è ancora sotto (card di Movi) e la scheda è ancora su.
    // Q82: in Scopri la riga non è più sotto (la lista era scesa e sta risalendo), quindi la foto scende con la scheda.
    const back = !alreadyDown && z && m && from === 'movi' && z.path === '/movi';
    const flown = back ? new Promise<void>((done) => setFly({ src: z!.src, done,
      from: { x: m!.Ph.left - m!.P.left, y: m!.Ph.top - m!.P.top, w: m!.Ph.width, h: m!.Ph.height, r: 20 },
      to: { x: z!.rect.left - m!.P.left, y: z!.rect.top - m!.P.top, w: z!.rect.width, h: z!.rect.height, r: z!.radius } })) : null;
    if (!alreadyDown) await sheet.current?.dismiss();
    if (flown) await flown;
    onClose();
  };
  const d = days.find((x) => x.id === day)!;
  // Da Scopri hai scelto la struttura sulla mappa: titolo = struttura. Da Movi hai scelto una lezione: titolo = lezione.
  const sub = from === 'movi' ? [v.name, a.duration, v.distance].join(' · ') : [a.people ? `Campo da ${a.people}` : a.title.split(',')[0], a.duration, v.distance].join(' · ');
  const title = from === 'movi' ? a.title : v.name;

  return (
    <>
      {fly && (
        <motion.img key={fly.done ? 'back' : 'in'} src={fly.src} alt="" aria-hidden="true" className="zoom-photo"
          initial={{ x: fly.from.x, y: fly.from.y, width: fly.from.w, height: fly.from.h, borderRadius: fly.from.r }}
          animate={{ x: fly.to.x, y: fly.to.y, width: fly.to.w, height: fly.to.h, borderRadius: fly.to.r }}
          transition={{ type: 'spring', visualDuration: 0.45, bounce: 0 }}
          onAnimationComplete={() => { const d = fly.done; if (!d) setFly(null); else d(); }} />
      )}
      <DetentSheet ref={sheet} className={`venue-sheet venue-sheet--${detent}`} tops={from === 'movi' ? topsMovi : tops} detent={detent} onDetent={setDetent} label={title} modal={from === 'movi'} onDismiss={() => close(true)} y={sheetY}>
        <div className="venue-sheet__grab"><button aria-label="Cambia altezza della scheda" onClick={() => setDetent(detent === 'half' ? 'large' : 'half')} style={{ padding: '0 40px', height: 16, display: 'flex', justifyContent: 'center' }}><span /></button></div>
        <div className="venue-sheet__head">
          <div className="venue-sheet__head-text">
            <h2 className="t-title-2">{title}</h2>
            <span className="t-subheadline secondary">{sub}</span>
          </div>
          <div className="venue-sheet__actions">
            <button className={`circle-button pressable${fav ? ' is-on' : ''}`} aria-label={fav ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'} aria-pressed={fav} onClick={setFav}>
              <motion.span key={String(fav)} style={{ display: 'grid' }} initial={fav ? { scale: 0.6 } : false} animate={{ scale: 1 }}
                transition={{ type: 'spring', visualDuration: 0.35, bounce: 0.5 }}><Icon name="UI/Favorite" size={22} /></motion.span>
              <HapticLayer />
            </button>
            <button className="circle-button pressable" aria-label="Chiudi" onClick={() => close()}><Icon name="UI/Close" size={22} /></button>
          </div>
        </div>
        <motion.div className="venue-sheet__body" data-scroll ref={body} style={{ paddingBottom: bodyPad }}>
          <Img name={a.photo} className="venue-sheet__photo" style={{ width: '100%', height: 150, borderRadius: 20, visibility: fly ? 'hidden' : undefined }} />
          <div className="price-line">
            <span className="t-title-3">{euro(a.price)}{a.people ? ' il campo' : ''}</span>
            <span className="points-pill t-footnote-emphasized">+{fmtPoints(a.points)} pt</span>
          </div>
          {a.pricePerPerson && <p className="t-subheadline secondary" style={{ marginTop: 4 }}>{euro(a.pricePerPerson)} a persona se giocate in {a.people}. Paghi il campo intero.</p>}

          <h3 className="t-headline venue-sheet__when" style={{ marginTop: 24, marginBottom: 12 }}>Quando vuoi andare?</h3>
          <div className="chips" role="group" aria-label="Giorno">
            {days.map((x) => <Chip key={x.id} label={x.short} selected={x.id === day} onPress={() => { setDay(x.id); setTime(null); }} />)}
          </div>
          <div style={{ marginTop: 16 }}>
            <span className="t-footnote-emphasized secondary">Prenota {d.sentence} alle</span>
            <div className="times" role="group" aria-label="Orario">
              {a.slots.map((s) => <Chip key={s.time} big label={s.time} selected={s.time === time} disabled={s.soldOut && day === 'oggi'} onPress={() => setTime(s.time)} />)}
            </div>
          </div>

          <h3 className="t-headline" style={{ marginTop: 24, marginBottom: 12 }}>Informazioni</h3>
          <div className="info-block"><span className="info-label t-footnote-emphasized">Indirizzo</span><span className="t-body">{v.street}, {v.city} · {v.distance}</span></div>
          <div className="info-block"><span className="info-label t-footnote-emphasized">Servizi</span><span className="t-body">{services[v.id]}</span></div>
          {v.documents && (
            <div className="info-block"><span className="info-label t-footnote-emphasized">Documenti</span>
              <span className="t-body">{v.documents === 'certificate' ? 'Serve il certificato medico' : 'Modulo da firmare al primo ingresso'}</span></div>
          )}
          <div className="info-block"><span className="info-label t-footnote-emphasized">Disdetta</span><span className="t-body">Gratis fino a 2 ore prima</span></div>
        </motion.div>
      </DetentSheet>
      <motion.div className="bottom-bar" ref={(n) => { if (n && Math.abs(n.offsetHeight - barH) > 1) setBarH(n.offsetHeight); }} initial={{ y: 120 }} animate={{ y: closing ? 120 : 0 }} transition={{ type: 'spring', visualDuration: 0.4, bounce: 0 }}>
        <Button kind="secondary" icon={<Icon name="Map/Directions" size={20} />}
          onPress={() => window.open(`https://maps.apple.com/?q=${encodeURIComponent(`${v.name}, ${v.street}, ${v.city}`)}`, '_blank')}>Indicazioni</Button>
        <Button fill disabled={!time} onPress={() => time && onBook(day, time)}>{time ? `Prenota alle ${time}` : 'Scegli un orario'}</Button>
      </motion.div>
    </>
  );
}
