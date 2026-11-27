import { SectionBar, useLargeTitleFade } from '../ui/SectionBar';
import { RollingNumber } from '../ui/RollingNumber';
import { TLink } from '../app/TLink';
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useNav } from '../app/nav';
import { achievements, fmtPoints, user, vouchers } from '../data/data';
import { balance, store, useBookings } from '../state/bookings';
import { Icon } from '../ui/Icon';
import { Img } from '../ui/Img';
import { ModalSheet } from '../ui/ModalSheet';
import { Button } from '../ui/booking/BookingParts';
import { SectionHeader } from '../ui/home/HomeParts';
import './PremiScreen.css';

// Premi — DS · Schermate › "premi — chiaro" (1461:915); sheet del buono (flusso-buono/2, 1461:2141) e "Come arrivarci" (premi/1, 1461:5332).
export function PremiScreen() {
  const bal = balance(useBookings(), user.points, user.saved);
  const navigate = useNav();
  const shown = ['risparmio-10', 'punti-5k', 'serie-7', 'lezioni-1'].map((id) => achievements.find((a) => a.id === id)!).filter((a) => a.unlocked);
  const [sheet, setSheet] = useState<null | { kind: 'use' } | { kind: 'path'; id: string }>(null);
  const next = vouchers.find((v) => v.points > bal.points) ?? vouchers[vouchers.length - 1];
  const progress = Math.min(bal.points / next.points, 1);
  const fade = useLargeTitleFade();

  return (
    <div className="premi">
      <SectionBar small="Premi" />
      <h1 className="t-large-title premi__title" data-large-title style={{ opacity: fade }}>Premi</h1>

      <section className="balance-card" aria-label={`Il tuo saldo: ${fmtPoints(bal.points)} punti`}>
        <span className="t-headline balance-card__muted">Il tuo saldo</span>
        <span className="balance-card__amount"><span className="balance-card__number"><RollingNumber id="points-premi" value={bal.points} format={fmtPoints} /></span><span className="balance-card__unit"> pt</span></span>
        <span className="balance-card__bar"><span style={{ width: `${progress * 100}%` }} /></span>
        <span className="t-body balance-card__muted">Ancora {fmtPoints(next.points - bal.points)} pt per il buono da €{next.value}</span>
      </section>

      <section className="premi__section">
        <h2 className="t-title-2">I tuoi buoni</h2>
        <div className="card voucher-list">
          {vouchers.map((v) => {
            const ready = bal.points >= v.points;
            const content = (
              <>
                <Img name={v.image} style={{ width: 48, height: 48, flex: 'none' }} />
                <span className="voucher-row__text">
                  <span className="t-headline">Buono da €{v.value}</span>
                  <span className="t-subheadline secondary">{v.name} · {fmtPoints(v.points)} pt</span>
                  {!ready && <span className="t-footnote-emphasized" style={{ color: 'var(--text-tertiary)' }}>Mancano {fmtPoints(v.points - bal.points)} pt</span>}
                </span>
              </>
            );
            return ready ? (
              <div key={v.id} className="voucher-row">
                {content}
                <button className="use-button t-subheadline-emphasized pressable" onClick={() => setSheet({ kind: 'use' })}>Usa</button>
              </div>
            ) : (
              <button key={v.id} className="voucher-row pressable" onClick={() => setSheet({ kind: 'path', id: v.id })}>
                {content}
                <Icon name="UI/Chevron-Right" size={16} className="chevron" />
              </button>
            );
          })}
        </div>
      </section>

      <div className="stat-tiles">
        <div className="stat-tile small-tile"><span className="t-footnote-emphasized stat-tile__label">Hai risparmiato</span><span className="number-28" style={{ color: 'var(--earn-default)' }}><RollingNumber id="saved-premi" value={bal.saved} format={(n) => `€${n}`} /></span></div>
        <div className="stat-tile small-tile"><span className="t-footnote-emphasized stat-tile__label">Punti in totale</span><span className="number-28">{fmtPoints(user.totalPoints)}</span></div>
      </div>

      <section className="premi__section">
        <SectionHeader title="Traguardi" link="Vedi tutti" to="/premi/traguardi" />
        {shown.length ? (
          <div className="trophies">
            {shown.map((a) => (
              <TLink key={a.id} to={`/premi/traguardi?t=${a.id}`} className="trophy pressable">
                <Img name={a.image} style={{ width: 64, height: 64 }} />
                <Img name="img/stella" style={{ width: 18, height: 18 }} />
                <span className="t-footnote-emphasized secondary">{a.label}</span>
              </TLink>
            ))}
          </div>
        ) : (
          // Q94: utente nuovo, nessun traguardo ancora: invito a muoversi o a vedere tutti i traguardi
          <div className="trophies-empty">
            <Img name="img/trLezioni" style={{ width: 56, height: 56, opacity: 0.5, filter: 'grayscale(1)' }} />
            <p className="t-headline">Nessun traguardo per ora</p>
            <p className="t-subheadline secondary">Prenota la prima lezione o completa la missione di oggi: i traguardi si sbloccano da soli.</p>
            <Button onPress={() => navigate('/scopri', { state: { list: true } })}>Trova un'attività</Button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {sheet?.kind === 'use' && (
          <ModalSheet visible={404} label="Buono da €5" onClose={() => setSheet(null)}>
            {(close) => (
              <div className="voucher-sheet">
                <Img name="img/buono-bronzo" style={{ width: 84, height: 84 }} />
                <h2 className="t-title-1">Buono da €5</h2>
                <p className="t-body secondary">Vale su qualsiasi prenotazione. I 2.500 pt si scalano quando paghi.</p>
                <div style={{ height: 8 }} />
                <Button onPress={() => { store.setVoucherActive(true); close(); setTimeout(() => navigate('/scopri', { state: { list: true } }), 250); }}>Trova un'attività</Button>
                <button className="t-headline voucher-sheet__later" onClick={close}>Non ora</button>
              </div>
            )}
          </ModalSheet>
        )}
        {sheet?.kind === 'path' && (() => {
          const v = vouchers.find((x) => x.id === sheet.id)!;
          return (
            <ModalSheet visible={628} label={`Buono da €${v.value}`} onClose={() => setSheet(null)}>
              {(close) => (
                <div className="path-sheet">
                  <Img name={v.image} style={{ width: 84, height: 84, alignSelf: 'center' }} />
                  <h2 className="t-title-2" style={{ marginTop: 12, textAlign: 'center' }}>Buono da €{v.value}</h2>
                  <p className="t-subheadline secondary" style={{ marginTop: 4, textAlign: 'center' }}>Ti mancano {fmtPoints(v.points - bal.points)} pt</p>
                  <span className="path-sheet__bar"><span style={{ width: `${Math.min(bal.points / v.points, 1) * 100}%` }} /></span>
                  <div className="path-sheet__ends t-footnote-emphasized"><span className="secondary">{fmtPoints(bal.points)} pt</span><span style={{ color: 'var(--text-tertiary)' }}>{fmtPoints(v.points)} pt</span></div>
                  <h3 className="t-headline" style={{ marginTop: 24 }}>Come guadagnare punti</h3>
                  <div className="ways">
                    <div className="way"><span className="t-body">Prenota un'attività</span><span className="t-subheadline-emphasized earn">10 pt per ogni €1</span></div>
                    <div className="way"><span className="t-body">Fai il check-in</span><span className="t-subheadline-emphasized earn">+50 pt</span></div>
                    <div className="way"><span className="t-body">Completa la missione del giorno</span><span className="t-subheadline-emphasized earn">fino a +25 pt</span></div>
                    <div className="way"><span className="t-body">Tieni viva la serie</span><span className="t-subheadline-emphasized earn">+10 / +25 / +100 pt</span></div>
                  </div>
                  <div style={{ alignSelf: 'center', marginTop: 24 }}>
                    <Button onPress={() => { close(); setTimeout(() => navigate('/scopri', { state: { list: true } }), 250); }}>Trova un'attività</Button>
                  </div>
                </div>
              )}
            </ModalSheet>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
