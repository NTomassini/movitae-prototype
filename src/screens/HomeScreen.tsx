import { activities, activity, euro, nearby, shelfSports, upcomingBooking, user, venueOf } from '../data/data';
import { Avatar, BookingCard, MissionCard, SectionHeader, SportShelfItem, StatTile, VenueCard } from '../ui/home/HomeParts';
import { ScrollEdge } from '../ui/ScrollEdge';
import { useScreenScroll } from '../app/useScreenScroll';
import { ScreenOverlay } from '../app/ScreenOverlay';
import './HomeScreen.css';

// Home — DS · Schermate › "home — chiaro" (1461:439). Contenuto: padding 16 ai lati, sezioni a 24.
export function HomeScreen() {
  const booking = activity(upcomingBooking.activityId);
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
          <span className="home__bar-avatar"><Avatar initial={user.initial} label="Profilo" /></span>
        </div>
      </ScreenOverlay>
      <header className="home__header">
        <h1 className="t-large-title">Ciao, {user.name}</h1>
      </header>

      <MissionCard goal={user.mission.goal} steps={user.mission.steps} points={user.mission.points} streak={user.streak} />

      <section className="home__section">
        <SectionHeader title="Cosa ti va oggi?" link="Altro" to="/scopri" />
        <div className="shelf">
          {shelfSports.map((s) => <SportShelfItem key={s.sport} label={s.label} image={s.image} to={`/scopri?sport=${s.sport}`} />)}
        </div>
      </section>

      <section className="home__section">
        <SectionHeader title="Prossima prenotazione" link="Vedi tutte" to="/prenotazioni" />
        <BookingCard title={booking.title} subtitle={`${upcomingBooking.day}, ${upcomingBooking.time} · ${venueOf(booking).name}`} photo="img/yoga" to="/prenotazioni/1" />
      </section>

      <div className="stat-tiles">
        <StatTile kind="points" points={user.points} nextVoucher={8000} note="Hai un buono da €5" to="/premi" />
        <StatTile kind="savings" amount={user.saved} note="Con 3 buoni usati da settembre" to="/premi" />
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
    </div>
  );
}
