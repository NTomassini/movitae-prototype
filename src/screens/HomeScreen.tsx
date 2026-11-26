import { balance, upcoming, useBookings } from '../state/bookings';
import { whenShort } from './BookingsScreen';
import { fmtPoints } from '../data/data';
import { activities, activity, euro, homeShelf, nearby, upcomingBooking, user, venueOf } from '../data/data';
import { Avatar, BookingCard, SectionHeader, SportShelfItem, StatTile, VenueCard } from '../ui/home/HomeParts';
import { Celebration, HealthExplain, HealthSystemSheet, MissionCard, StreakSheetContent } from '../ui/mission/Mission';
import { ModalSheet } from '../ui/ModalSheet';
import { AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { store, useAppState } from '../state/bookings';
import { ScrollEdge } from '../ui/ScrollEdge';
import { useScreenScroll } from '../app/useScreenScroll';
import { ScreenOverlay } from '../app/ScreenOverlay';
import { openDemo } from '../app/DemoPanel';
import './HomeScreen.css';

// Home — DS · Schermate › "home — chiaro" (1461:439). Contenuto: padding 16 ai lati, sezioni a 24.
export function HomeScreen() {
  const app = useAppState();
  const mission = app.demo.mission;
  const navigate = useNavigate();
  const [sheet, setSheet] = useState<null | 'streak' | 'health'>(null);
  const [system, setSystem] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  // celebrazione a schermo intero alla prima apertura dopo il traguardo, una volta sola
  useEffect(() => {
    if (mission.startsWith('completed') && app.celebrated !== mission) { setCelebrate(true); store.setCelebrated(mission); }
  }, [mission, app.celebrated]);
  const all = useBookings();
  // primo giorno = utente appena iscritto: niente prenotazioni, 0 pt, €0 (home/stato-primo-giorno)
  // utente appena registrato (onboarding, Q37) o stato "primo giorno" del pannello demo
  const isNew = mission === 'first-day' || (!!app.profile && all.length === 0);
  const bal = isNew ? { points: 0, saved: 0, vouchersUsed: 0 } : balance(all, user.points, user.saved);
  // "Prossima prenotazione" = la prima in arrivo (comprese quelle fatte nel prototipo)
  const made = upcoming(all)[0];
  const booking = made ? activity(made.activityId) : activity(upcomingBooking.activityId);
  const when = made ? whenShort(made) : '';
  void activities;
  // Comportamenti §4: il titolo grande scorre via; quando è sparito compaiono il titolo piccolo
  // centrato e il bordo sfocato in alto (alto 106, quanto la riga d'intestazione). L'avatar resta fisso.
  const y = useScreenScroll();
  const scrolled = y > 40;
  return (
    <div className="home">
      <ScreenOverlay>
        <div className={`home__bar${scrolled ? ' is-scrolled' : ''}`}>
          <ScrollEdge position="top" height={106} />
          <span className="home__bar-title t-headline" aria-hidden={!scrolled}>Ciao, {user.name}</span>
          <span className="home__bar-avatar"><Avatar initial={user.initial} label="Profilo" onLongPress={openDemo} /></span>
        </div>
      </ScreenOverlay>
      <header className="home__header">
        <h1 className="t-large-title">Ciao, {user.name}</h1>
      </header>

      <MissionCard state={mission} onPress={() => setSheet('streak')} onConnect={() => setSheet('health')} />

      <section className="home__section">
        <SectionHeader title="Cosa ti va oggi?" link="Altro" to="/scopri" />
        <div className="shelf">
          {homeShelf(app.profile ? user.favoriteSports : null).map((s) => <SportShelfItem key={s.sport} label={s.label} image={s.image} to={`/scopri?sport=${s.sport}`} />)}
        </div>
      </section>

      {!isNew && made && <section className="home__section">
        <SectionHeader title="Prossima prenotazione" link="Vedi tutte" to="/prenotazioni" />
        <BookingCard title={booking.title} subtitle={`${when} · ${venueOf(booking).name}`} photo={made.id === 's-yoga' ? 'img/yoga' : booking.photo} to={`/prenotazioni/${made.id}`} />
      </section>}

      <div className="stat-tiles">
        <StatTile kind="points" points={bal.points} nextVoucher={bal.points >= 2500 ? 8000 : 2500} note={isNew ? 'Il primo buono a 2.500 pt' : bal.points >= 2500 ? 'Hai un buono da €5' : `Mancano ${fmtPoints(2500 - bal.points)} pt al buono da €5`} to="/premi" />
        <StatTile kind="savings" amount={bal.saved} note={isNew ? 'Qui vedi quanto risparmi con i buoni' : `Con ${3 + bal.vouchersUsed} buoni usati da settembre`} to="/premi" />
      </div>

      <section className="home__section">
        <SectionHeader title="Vicino a te" link="Vedi sulla mappa" to="/scopri" />
        <div className="carousel">
          {nearby.map((id) => {
            const a = activity(id);
            const v = venueOf(a);
            const price = a.pricePerPerson ? `${euro(a.price)} · ${euro(a.pricePerPerson)} a persona` : euro(a.price);
            return <VenueCard key={id} title={a.title} place={`${v.name} · ${v.distance}`} price={price} points={a.points} photo={a.photo} to={`/scopri/${id}`} />;
          })}
        </div>
      </section>

      <AnimatePresence>
        {sheet === 'streak' && (
          <ModalSheet visible={510} label="La tua serie" onClose={() => setSheet(null)}>
            {() => <StreakSheetContent state={mission} />}
          </ModalSheet>
        )}
        {sheet === 'health' && (
          <ModalSheet visible={529} label="Collega Salute" closeButton={false} onClose={() => setSheet(null)}>
            {(close) => <HealthExplain onContinue={() => { close(); setTimeout(() => setSystem(true), 300); }} />}
          </ModalSheet>
        )}
      </AnimatePresence>
      <ScreenOverlay>
        <AnimatePresence>
          {system && (
            <HealthSystemSheet onAllow={() => { setSystem(false); store.setDemo({ mission: 'active' }); }} onDeny={() => setSystem(false)} />
          )}
          {celebrate && (
            <Celebration seven={mission === 'completed-7'} onClose={() => setCelebrate(false)}
              onProposal={() => { setCelebrate(false); navigate('/scopri/yoga-flow'); }} />
          )}
        </AnimatePresence>
      </ScreenOverlay>
    </div>
  );
}
