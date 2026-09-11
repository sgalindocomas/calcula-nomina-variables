<script>
    import { localeState, setLanguage } from '../lib/i18n/index.svelte.js';
</script>

<div class="lang-selector">
    <button 
        class="lang-pill" 
        class:active={localeState.lang === 'ca'} 
        onclick={() => setLanguage('ca')}
        title="Català"
    >
        CAT
    </button>
    <button 
        class="lang-pill" 
        class:active={localeState.lang === 'es'} 
        onclick={() => setLanguage('es')}
        title="Castellano"
    >
        ESP
    </button>
</div>

<style>
    .lang-selector {
        display: inline-flex;
        background: #e9ecef;
        border-radius: 9999px;
        padding: 4px;
        gap: 2px;
    }
    .lang-pill {
        background: transparent;
        border: none;
        border-radius: 9999px;
        padding: 6px 14px;
        font-size: 0.85rem;
        font-weight: 800;
        color: #6c757d;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .lang-pill:hover {
        color: #2b2d42;
    }
    .lang-pill.active {
        background: #ffffff;
        color: #e63946;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
</style>
