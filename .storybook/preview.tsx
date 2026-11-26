import type { Preview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import '../src/styles/base.css';

// Tema dalla barra di Storybook (Chiaro/Scuro), come le modalità delle variabili Figma.
const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Modalità',
      toolbar: { title: 'Modalità', items: [{ value: 'light', title: 'Chiaro' }, { value: 'dark', title: 'Scuro' }], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, ctx) => {
      document.documentElement.dataset.theme = ctx.globals.theme ?? 'light';
      return (
        <MemoryRouter>
          <div style={{ background: 'var(--bg-default)', padding: 16, width: 402, minHeight: 200 }}>
            <Story />
          </div>
        </MemoryRouter>
      );
    },
  ],
  parameters: { layout: 'fullscreen' },
};
export default preview;
