import { RollingNumber } from '../RollingNumber';
import { useEffect, useId, useState } from 'react';
import { setPushBack } from '../pushback';
import { AnimatePresence, motion } from 'motion/react';
import { DocCard, FormSheet, useUpload } from '../docs/Docs';
import { VOUCHER, activity, days, endTime, euro, euroCents, fmtPoints, user, venueOf } from '../../data/data';
import { Icon } from '../Icon';
import { balance, store, useBookings, useDemo } from '../../state/bookings';
import { Img } from '../Img';
import { ApplePaySheet } from './ApplePaySheet';
import { ActivityBlock, AppleLogo, Chip, HapticLayer, Toggle } from './BookingParts';
import '../modal-sheet.css';
import '../page-header.css';

/**
 * Riepilogo (flusso-movi/2): sheet modale che copre la tab bar, con "Annulla" e titolo.
 * Il buono da €5 c'è ma parte spento (handoff › Punti e premi). Apple Pay simulato.
 */
export function CheckoutSheet({ activityId, dayId, time: chosen, onCancel, onPaid, back }: {
  activityId: string; dayId: string; time: string;
  /** aperto sopra la scheda (flusso-movi/7): freccia indietro e maniglia al posto di "Annulla" */
  back?: boolean;
  onCancel: () => void;
  onPaid: (r: { voucher: boolean; paid: number; points: number; time: string }) => void;
}) {
  const a = activity(activityId);
  const v = venueOf(a);
  const d = days.find((x) => x.id === dayId)!;
  const demo = useDemo();
  // errori/2: con "Orario esaurito" nel pannello demo, l'orario scelto è appena finito; si sceglie un altro orario qui
  const [time, setTime] = useState(chosen);
  const soldOut = demo.soldOut && time === chosen;
  const others = a.slots.filter((s) => s.time !== chosen && !(s.soldOut && dayId === 'oggi')).map((s) => s.time);
  const end = endTime(a, time);
  const bal = balance(useBookings(), user.points, user.saved);
  const canVoucher = bal.points >= VOUCHER.points;
  // dal flusso C il buono arriva già attivo; altrimenti parte spento
  const [voucher, setVoucher] = useState(() => store.get().voucherActive && bal.points >= VOUCHER.points);
  const [paying, setPaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const total = a.price - (voucher ? VOUCHER.value : 0);
  const points = total * 10;
  // Q67: la pagina sotto (scheda, chat) arretra mentre il riepilogo è aperto
  const pid = useId();
  useEffect(() => () => setPushBack(pid, 0), [pid]);
  const label = a.people ? `Campo da ${a.people}` : a.duration === 'ingresso singolo' || a.sport === 'nuoto' ? 'Ingresso' : 'Lezione';

  // documenti richiesti dalla struttura (handoff › Documenti): modulo da firmare o certificato
  const [formOpen, setFormOpen] = useState(false);
  const upload = useUpload();
  const needsForm = v.documents === 'form' && !store.get().docs.forms[v.id];
  const pay = () => {
    if (needsForm) { setFormOpen(true); return; } // Apple Pay resta attivo: senza firma apre prima il modulo
    setFailed(false);
    setPaying(true); // Q64: sale il foglio di Apple Pay
  };

  return (
    <>
      <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
      <motion.div className="checkout" role="dialog" aria-modal="true" aria-label="Riepilogo"
        style={{ top: 'calc(var(--device-top) + 2px)' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', visualDuration: 0.5, bounce: 0 }}
        onUpdate={(l) => setPushBack(pid, 1 - (typeof l.y === 'string' ? parseFloat(l.y) / 100 : Number(l.y) / 800))}>
        {back ? (
          <div className="checkout__head checkout__head--back">
            <span />
            <h2 className="t-headline">Riepilogo</h2>
            <span />
            <span className="modal-sheet__grabber" aria-hidden="true" />
            <button className="back-button pressable" aria-label="Torna alla scheda" onClick={onCancel}><Icon name="UI/Chevron-Left" size={24} /></button>
          </div>
        ) : (
          <div className="checkout__head">
            <button className="t-body" onClick={onCancel}>Annulla</button>
            <h2 className="t-headline">Riepilogo</h2>
            <span />
          </div>
        )}
        <div className="checkout__body">
          <div className="card">
            <ActivityBlock photo={a.photo} title={a.title} when={`${d.long} · ${end ? `${time}–${end}` : `dalle ${time}`}`} where={`${v.name} · ${v.street}`} />
            <AnimatePresence initial={false}>
              {soldOut && (
                <motion.div className="soldout" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', visualDuration: 0.35, bounce: 0 }}>
                  <p className="soldout__error t-subheadline" role="alert"><Icon name="UI/Alert" size={16} />Le {chosen} non sono più disponibili. Scegli un altro orario:</p>
                  <div className="soldout__times" role="group" aria-label="Altri orari">
                    {others.map((t) => <Chip key={t} big label={t} onPress={() => setTime(t)} />)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {v.documents && <DocCard venueId={v.id} kind={v.documents === 'form' ? 'form' : 'certificate'} onOpenForm={() => setFormOpen(true)} onUpload={upload.open} />}
          {canVoucher && (
            <div className="card voucher-card">
              <Img name="img/buono-bronzo" style={{ width: 44, height: 44, flex: 'none' }} />
              <div className="voucher-card__text">
                <span className="t-headline">{voucher ? `Buono da €${VOUCHER.value} attivo` : `Hai un buono da €${VOUCHER.value}`}</span>
                <span className="t-subheadline secondary">{voucher ? `Userai ${fmtPoints(VOUCHER.points)} pt` : `Attivalo e paghi ${euro(a.price - VOUCHER.value)}`}</span>
              </div>
              <Toggle checked={voucher} onChange={setVoucher} label={`Usa il buono da €${VOUCHER.value}`} />
            </div>
          )}
          <div className="card price-card">
            <div className="price-card__row"><span className="t-body secondary">{label}</span><span className="t-headline">{euro(a.price)}</span></div>
            {voucher && <div className="price-card__row"><span className="t-body secondary">Buono</span><span className="t-headline" style={{ color: 'var(--earn-default)' }}>−{euro(VOUCHER.value)}</span></div>}
            <div className="price-card__rule" />
            <div className="price-card__row"><span className="t-title-3">Totale</span><span className="t-title-2"><RollingNumber id="checkout-total" remember={false} value={total} format={euro} /></span></div>
            <span className="points-pill t-footnote-emphasized">+<RollingNumber id="checkout-points" remember={false} value={points} format={fmtPoints} /> pt in arrivo dopo il check-in</span>
          </div>
          <p className="t-footnote secondary">Puoi disdire gratis fino a 2 ore prima: ti rimborsiamo sul metodo di pagamento.</p>
        </div>
        <div className="checkout-bar">
          {failed ? (
            <div className="checkout-bar__error" role="alert">
              <Icon name="UI/Alert" size={20} />
              <div>
                <span className="t-subheadline-emphasized" style={{ color: 'var(--feedback-error)', display: 'block' }}>Pagamento non riuscito</span>
                <span className="t-footnote secondary">Non ti abbiamo addebitato nulla. Riprova o scegli un'altra carta nel Wallet.</span>
              </div>
            </div>
          ) : (
          <div className="checkout-bar__summary">
            <div className="checkout-bar__total">
              <span className="t-footnote secondary">Totale</span>
              <span className="t-title-3">{euroCents(total)}</span>
            </div>
            <button className="pay-method pressable">
              <span className="t-footnote secondary">Paga con</span>
              <span className="t-subheadline-emphasized">Apple Pay</span>
              <Icon name="UI/Chevron-Down" size={16} />
            </button>
          </div>
          )}
          {soldOut ? <button className="button t-headline checkout-bar__pick" disabled>Scegli un orario</button> :
          <button className="apple-pay" onClick={pay} aria-busy={paying} aria-label={`Paga ${euroCents(total)} con Apple Pay`} disabled={paying}>
            <AppleLogo /><span>Pay</span>
            <HapticLayer off={paying} />
          </button>}
        </div>
      </motion.div>
      <AnimatePresence>
        {paying && (
          <ApplePaySheet key="ap" total={total} fail={demo.payment === 'fail'} onCancel={() => setPaying(false)}
            onFail={() => { setPaying(false); setFailed(true); }} // errori/3: il messaggio prende il posto del totale
            onSuccess={() => onPaid({ voucher, paid: total, points, time })} />
        )}
      </AnimatePresence>
      <AnimatePresence>{formOpen && <FormSheet key="form" venueId={v.id} onClose={() => setFormOpen(false)} />}</AnimatePresence>
      {upload.ui}
    </>
  );
}
