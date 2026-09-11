import './app.css'
import Ced from './pages/Ced.svelte'
import { mount } from 'svelte'

const app = mount(Ced, {
  target: document.getElementById('app'),
})

export default app
