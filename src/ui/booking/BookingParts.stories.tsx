import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ActionsCard, ActivityBlock, Button, Chip, QR, Toggle } from './BookingParts';
import { Icon } from '../Icon';

const meta: Meta = { title: 'Prenotazione/Componenti' };
export default meta;

export const Capsule: StoryObj = {
  render: () => {
    const [t, setT] = useState('19:30');
    return <div style={{ display: 'flex', gap: 8 }}>{['18:00', '19:30', '21:00'].map((x, i) => <Chip key={x} big label={x} selected={t === x} disabled={i === 2} onPress={() => setT(x)} />)}</div>;
  },
};
export const Pulsanti: StoryObj = { render: () => <div style={{ display: 'flex', gap: 12 }}><Button kind="secondary" icon={<Icon name="Map/Directions" size={20} />}>Indicazioni</Button><Button fill>Prenota alle 19:30</Button></div> };
export const PulsanteSpento: StoryObj = { render: () => <Button fill disabled>Scegli un orario</Button> };
export const BloccoAttivita: StoryObj = { render: () => <div className="card"><ActivityBlock photo="foto/yoga" title="Yoga Flow" when="Venerdì 13 novembre · 18:30–19:30" where="Zen Studio · Via Marmorata 12" /></div> };
export const Interruttore: StoryObj = { render: () => { const [v, setV] = useState(false); return <Toggle checked={v} onChange={setV} label="Usa il buono" />; } };
export const CodiceQR: StoryObj = { render: () => <div className="card ticket__qr"><QR value="MOVITAE-123" /></div> };
export const Azioni: StoryObj = { render: () => <ActionsCard mapsQuery="Zen Studio, Via Marmorata 12, Roma" /> };
