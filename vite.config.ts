import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // il minificatore CSS predefinito toglieva backdrop-filter senza prefisso (Chrome senza sfocatura): esbuild li tiene entrambi
  build: { cssMinify: 'esbuild' },
  // ora della pubblicazione, mostrata nel pannello demo: serve a capire se l'iPhone ha caricato l'ultima versione
  define: { __BUILD__: JSON.stringify(new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) },
})
