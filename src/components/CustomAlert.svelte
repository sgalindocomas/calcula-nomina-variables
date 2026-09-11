<script>
import { alertState, closeAlert } from '../lib/alert.svelte.js';
import { t } from '../lib/i18n/index.svelte.js';
</script>
{#if alertState.visible}
<div class="custom-modal-overlay" onclick={closeAlert}>
  <div class="custom-modal" onclick={(e) => e.stopPropagation()}>
    <div class="modal-icon">⚠️</div>
    <div class="modal-message">{alertState.message}</div>
    <button class="btn btn-primary" onclick={closeAlert}>{t('calc.step4.btn_close')}</button>
  </div>
</div>
{/if}
<style>
.custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px); }
.custom-modal { background: var(--color-surface); padding: 2rem; border-radius: 12px; max-width: 400px; width: 90%; text-align: center; box-shadow: var(--shadow-lg); border-top: 5px solid var(--color-primary); animation: modal-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.modal-icon { font-size: 3rem; margin-bottom: 1rem; }
.modal-message { font-size: 1.1rem; color: var(--color-text); margin-bottom: 1.5rem; line-height: 1.5; font-weight: 500; }
@keyframes modal-pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
</style>