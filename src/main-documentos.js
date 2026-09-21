import './app.css'
import Documentos from './pages/Documentos.svelte'
import { mount } from 'svelte'

const app = mount(Documentos, {
  target: document.getElementById('app'),
})

export default app
