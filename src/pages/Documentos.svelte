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
        <h1 class="text-4xl mt-0">{t('docs.title')}</h1>
        <p class="text-xl mt-05">{t('docs.subtitle')}</p>
    </header>

    <!-- Documents Grid -->
    <main class="tools-grid">
        <a href="./docs/Cinque_Conveni_TS.pdf" target="_blank" class="tool-card">
            <div class="tool-icon">📖</div>
            <h3>{t('docs.convenio_title')}</h3>
            <p>{t('docs.convenio_desc')}</p>
        </a>

        <a href="./docs/Taules_Salarials_2024.pdf" target="_blank" class="tool-card">
            <div class="tool-icon">📊</div>
            <h3>{t('docs.tablas_title')}</h3>
            <p>{t('docs.tablas_desc')}</p>
        </a>
    </main>

    <!-- Navigation -->
    <div class="text-center mt-2 mb-2">
        <a href="./index.html" class="btn btn-secondary" style="text-decoration: none;">
            ← {t('common.back_home')}
        </a>
    </div>

    <!-- Affiliation Banner -->
    <footer class="affiliation-banner" style="margin-top: 2rem;">
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
