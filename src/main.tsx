import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/base.css';
import './app/shell.css';
import { App } from './app/App';

// Tema: segue iOS (Aspetto chiaro/scuro). ?theme=dark|light lo forza, utile per i confronti con Figma.
const forced = new URLSearchParams(location.search).get('theme');
const mq = matchMedia('(prefers-color-scheme: dark)');
const applyTheme = () => {
  document.documentElement.dataset.theme = forced ?? (mq.matches ? 'dark' : 'light');
};
applyTheme();
mq.addEventListener('change', applyTheme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
