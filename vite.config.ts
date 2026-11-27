import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // il minificatore CSS predefinito toglieva backdrop-filter senza prefisso (Chrome senza sfocatura): esbuild li tiene entrambi
  build: { cssMinify: 'esbuild' },
})
