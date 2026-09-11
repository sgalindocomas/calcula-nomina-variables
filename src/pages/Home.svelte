<script>
    import { t } from '../lib/i18n/index.svelte.js';
    import LanguageSelector from '../components/LanguageSelector.svelte';
</script>

<div class="app-container shadow-glass max-w-800">
    <!-- Header -->
    <header class="header">
        <div class="flex-center gap-08 mb-15">
            <span class="vt-header-title font-inter text-2xl font-800 text-black">{t('common.title')}</span>
            <img src="./ccoo.png" alt="Logo CCOO Catalunya" class="vt-header-logo h-45 mb-0">
        </div>
        <div style="display: flex; justify-content: center; margin-bottom: 1.5rem;">
            <LanguageSelector />
        </div>
        <h1 class="text-4xl mt-0">{t('home.title')}</h1>
        <p class="text-xl mt-05">{t('home.subtitle')}</p>
    </header>

    <!-- Tools Grid -->
    <main class="tools-grid">
        <a href="./calculadora.html" class="tool-card">
            <div class="tool-icon">💶</div>
            <h3>{t('home.calc_title')}</h3>
            <p>{t('home.calc_desc')}</p>
        </a>

        <a href="./ced.html" class="tool-card">
            <div class="tool-icon">🏖️</div>
            <h3>{t('home.ced_title')}</h3>
            <p>{t('home.ced_desc')}</p>
        </a>
        
        <div class="tool-card future-tool">
            <div class="tool-icon">🛠️</div>
            <h3>{t('home.future_title')}</h3>
            <p>{t('home.future_desc')}</p>
        </div>
    </main>

    <!-- Affiliation Banner -->
    <footer class="affiliation-banner">
        <h3>{t('common.affiliation.title')}</h3>
        <p>{t('common.affiliation.text')}</p>
        <a href="https://www.ccoo.cat/afiliat" target="_blank" class="btn-white">{t('common.affiliation.btn')}</a>
    </footer>
</div>

<!-- Global Footer -->
<footer class="global-footer">
    <div class="footer-content">
        <img src="./ccoo.png" alt="Logo CCOO" class="footer-logo">
        <div class="footer-text">
            <strong>{t('common.subtitle')}</strong><br>
        </div>
    </div>
    <div class="footer-credits">
        {t('common.created_by')}
    </div>
</footer>
