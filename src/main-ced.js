import './app.css'
import Ced from './pages/Ced.svelte'
import { mount } from 'svelte'
import { initPWA } from './lib/pwa.svelte.js'

initPWA()

const app = mount(Ced, {
  target: document.getElementById('app'),
})

export default app
