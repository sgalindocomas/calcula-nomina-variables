import './app.css'
import Home from './pages/Home.svelte'
import { mount } from 'svelte'
import { initPWA } from './lib/pwa.svelte.js'

initPWA()

const app = mount(Home, {
  target: document.getElementById('app'),
})

export default app
