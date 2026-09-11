import './app.css'
import Calculadora from './pages/Calculadora.svelte'
import { mount } from 'svelte'

const app = mount(Calculadora, {
  target: document.getElementById('app'),
})

export default app
