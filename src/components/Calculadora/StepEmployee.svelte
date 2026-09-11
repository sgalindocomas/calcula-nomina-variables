<script>
    import { data } from '../../lib/data.js';
    import { t } from '../../lib/i18n/index.svelte.js';
    
    let { employee = $bindable() } = $props();

    const categorias = Object.entries(data.categorias).map(([key, cat]) => ({
        key,
        nombre: cat.nombre,
        trienios: Object.keys(cat.trienios)
    }));

    let selectedCatTrienios = $derived(
        categorias.find(c => c.key === employee.categoryKey)?.trienios || []
    );

    function handleCategoryChange(e) {
        employee.categoryKey = e.target.value;
        employee.trienio = ''; // reset trienio on category change
    }
</script>

<section class="step-pane active">
    <h2>{t('calc.step1.title')}</h2>
    <p class="mb-15">{t('calc.step1.desc')}</p>
    <div class="form-group">
        <label for="employee-category">{t('calc.step1.cat_label')}</label>
        <select id="employee-category" value={employee.categoryKey} onchange={handleCategoryChange}>
            <option value="">{t('calc.step1.cat_placeholder')}</option>
            {#each categorias as cat}
                <option value={cat.key}>{t(`calc.categories.${cat.key}`)}</option>
            {/each}
        </select>
    </div>
    <div class="form-group">
        <label for="employee-seniority">{t('calc.step1.sen_label')}</label>
        <select id="employee-seniority" bind:value={employee.trienio} disabled={!employee.categoryKey}>
            <option value="">{t('calc.step1.sen_placeholder')}</option>
            {#each selectedCatTrienios as trienio}
                <option value={trienio}>{trienio}</option>
            {/each}
        </select>
    </div>
</section>
