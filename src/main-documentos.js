import './app.css'
import Documentos from './pages/Documentos.svelte'
import { mount } from 'svelte'
import { initPWA } from './lib/pwa.svelte.js'

initPWA()

const app = mount(Documentos, {
  target: document.getElementById('app'),
})

export default app
