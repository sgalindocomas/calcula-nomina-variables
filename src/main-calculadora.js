import './app.css'
import Calculadora from './pages/Calculadora.svelte'
import { mount } from 'svelte'
import { initPWA } from './lib/pwa.svelte.js'

initPWA()

const app = mount(Calculadora, {
  target: document.getElementById('app'),
})

export default app
