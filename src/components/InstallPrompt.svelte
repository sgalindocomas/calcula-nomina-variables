<script>
    import { pwaState, installPWA, dismissPWA, openPWA } from '../lib/pwa.svelte.js';
    import { t } from '../lib/i18n/index.svelte.js';
</script>

{#if pwaState.showPrompt && !pwaState.isInstalled}
    <div class="pwa-prompt-overlay" role="dialog" aria-modal="true" aria-labelledby="pwa-title">
        <div class="pwa-prompt-card shadow-lg">
            <button class="pwa-close-btn" onclick={dismissPWA} aria-label="Cerrar aviso de instalación">
                ✕
            </button>
            
            <div class="pwa-prompt-header">
                <img src="./icons/android/launchericon-192x192.png" alt="App Icon" class="pwa-app-icon" />
                <div class="pwa-header-text">
                    <span class="pwa-badge">{t('pwa.badge')}</span>
                    <h3 id="pwa-title" class="pwa-title">
                        {pwaState.isIOS ? t('pwa.ios_title') : t('pwa.install_title')}
                    </h3>
                </div>
            </div>

            <div class="pwa-prompt-body">
                {#if pwaState.isIOS}
                    <p class="pwa-desc">{t('pwa.ios_desc')}</p>
                    <div class="ios-instruction-box">
                        <div class="ios-step">
                            <span class="ios-step-icon">📤</span>
                            <span>1. Pulsa el botón <strong>Compartir</strong> en Safari</span>
                        </div>
                        <div class="ios-step">
                            <span class="ios-step-icon">➕</span>
                            <span>2. Selecciona <strong>"Añadir a pantalla de inicio"</strong></span>
                        </div>
                    </div>
                {:else}
                    <p class="pwa-desc">{t('pwa.install_desc')}</p>
                {/if}
            </div>

            <div class="pwa-prompt-actions">
                {#if !pwaState.isIOS}
                    <button class="btn-primary pwa-btn" onclick={installPWA}>
                        <span class="btn-icon">📲</span>
                        {t('pwa.btn_install')}
                    </button>
                    <button class="btn-secondary pwa-btn" onclick={dismissPWA}>
                        {t('pwa.btn_continue_web')}
                    </button>
                {:else}
                    <button class="btn-primary pwa-btn" onclick={dismissPWA}>
                        {t('pwa.ios_btn_ok')}
                    </button>
                    <button class="btn-secondary pwa-btn" onclick={dismissPWA}>
                        {t('pwa.btn_continue_web')}
                    </button>
                {/if}
            </div>
        </div>
    </div>
{/if}

<!-- Botón flotante discreto si el banner se descartó pero el usuario decide instalarla más tarde -->
{#if !pwaState.showPrompt && !pwaState.isInstalled && (pwaState.isInstallable || pwaState.isIOS)}
    <button 
        class="pwa-fab-install" 
        onclick={openPWA} 
        title={t('pwa.install_tooltip')}
        aria-label={t('pwa.install_tooltip')}
    >
        <span class="fab-icon">📲</span>
        <span class="fab-text">{t('pwa.btn_install')}</span>
    </button>
{/if}

<style>
    .pwa-prompt-overlay {
        position: fixed;
        bottom: 1.5rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        width: calc(100% - 2rem);
        max-width: 460px;
        animation: pwaSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes pwaSlideUp {
        from {
            opacity: 0;
            transform: translate(-50%, 25px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }

    .pwa-prompt-card {
        background: #ffffff;
        border-radius: 16px;
        padding: 1.25rem;
        border: 1px solid rgba(0, 0, 0, 0.08);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18), 0 4px 8px rgba(0, 0, 0, 0.06);
        position: relative;
    }

    .pwa-close-btn {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        background: transparent;
        border: none;
        color: #888;
        font-size: 1.2rem;
        cursor: pointer;
        line-height: 1;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s, color 0.15s;
    }

    .pwa-close-btn:hover {
        background: #f1f3f5;
        color: #333;
    }

    .pwa-prompt-header {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        margin-bottom: 0.65rem;
    }

    .pwa-app-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        object-fit: contain;
        background: #fff;
        padding: 2px;
        border: 1px solid #f0f0f0;
    }

    .pwa-header-text {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    .pwa-badge {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 700;
        color: var(--color-primary, #e63946);
        background: rgba(230, 57, 70, 0.08);
        padding: 2px 8px;
        border-radius: 12px;
        display: inline-block;
        width: fit-content;
    }

    .pwa-title {
        font-size: 1.05rem;
        font-weight: 700;
        margin: 0;
        color: #1a1a1a;
    }

    .pwa-prompt-body {
        margin-bottom: 1.1rem;
    }

    .pwa-desc {
        font-size: 0.875rem;
        color: #495057;
        margin: 0;
        line-height: 1.45;
    }

    .ios-instruction-box {
        margin-top: 0.65rem;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 10px;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        font-size: 0.825rem;
        color: #333;
    }

    .ios-step {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .ios-step-icon {
        font-size: 1.1rem;
    }

    .pwa-prompt-actions {
        display: flex;
        gap: 0.65rem;
        align-items: center;
    }

    .pwa-btn {
        flex: 1;
        padding: 0.6rem 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        transition: all 0.2s;
        border: none;
    }

    .btn-primary {
        background: var(--color-primary, #e63946);
        color: #ffffff;
    }

    .btn-primary:hover {
        background: var(--color-primary-hover, #d62828);
    }

    .btn-secondary {
        background: #f1f3f5;
        color: #495057;
    }

    .btn-secondary:hover {
        background: #e9ecef;
        color: #212529;
    }

    /* Floating Action Button si el usuario cierra el banner */
    .pwa-fab-install {
        position: fixed;
        bottom: 1.25rem;
        right: 1.25rem;
        z-index: 999;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        background: var(--color-primary, #e63946);
        color: white;
        border: none;
        border-radius: 30px;
        padding: 0.55rem 0.95rem;
        font-size: 0.825rem;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(230, 57, 70, 0.35);
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        animation: pwaFadeIn 0.3s ease;
    }

    @keyframes pwaFadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }

    .pwa-fab-install:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(230, 57, 70, 0.45);
    }

    @media (max-width: 480px) {
        .pwa-prompt-actions {
            flex-direction: column-reverse;
        }
        .pwa-btn {
            width: 100%;
        }
    }
</style>
