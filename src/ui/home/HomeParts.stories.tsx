import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookingCard, SectionHeader, SportShelfItem, StatTile, VenueCard } from './HomeParts';
import { MissionCard, StreakDay } from '../mission/Mission';

const meta: Meta = { title: 'Home/Componenti' };
export default meta;

export const MissioneAttiva: StoryObj = { render: () => <MissionCard state="active" /> };
export const MissionePrimoGiorno: StoryObj = { render: () => <MissionCard state="first-day" /> };
export const MissioneSenzaSalute: StoryObj = { render: () => <MissionCard state="no-health" /> };
export const MissioneCompletata: StoryObj = { render: () => <MissionCard state="completed" /> };
export const GiorniSerie: StoryObj = { render: () => <div style={{ display: 'flex', gap: 16 }}><StreakDay letter="L" state="done" /><StreakDay letter="M" state="pause" /><StreakDay letter="V" state="today" /><StreakDay letter="S" state="future" /></div> };
export const TitoloSezione: StoryObj = { render: () => <SectionHeader title="Cosa ti va oggi?" link="Altro" /> };
export const SportScaffale: StoryObj = { render: () => <div style={{ display: 'flex', gap: 8 }}><SportShelfItem label="Padel" image="img/padel" to="#" /><SportShelfItem label="Yoga" image="img/yoga" to="#" /></div> };
export const Prenotazione: StoryObj = { render: () => <BookingCard title="Yoga Flow" subtitle="Oggi, 18:30 · Zen Studio" photo="img/yoga" to="#" /> };
export const Riquadri: StoryObj = {
  render: () => (
    <div className="stat-tiles">
      <StatTile kind="points" points={2700} nextVoucher={8000} note="Hai un buono da €5" to="#" />
      <StatTile kind="savings" amount={25} note="Con 3 buoni usati da settembre" to="#" />
    </div>
  ),
};
export const CardAttivita: StoryObj = { render: () => <VenueCard title="Boxe per iniziare" place="Palestra Testaccio · 800 m" price="€15" points={150} photo="foto/boxe" to="#" /> };
