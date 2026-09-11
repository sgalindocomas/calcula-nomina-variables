import './app.css'
import Home from './pages/Home.svelte'
import { mount } from 'svelte'

const app = mount(Home, {
  target: document.getElementById('app'),
})

export default app
