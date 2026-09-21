import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        calculadora: 'calculadora.html',
        ced: 'ced.html',
        documentos: 'documentos.html'
      }
    }
  }
})
