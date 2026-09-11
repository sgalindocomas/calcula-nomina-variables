<script>
    import { generatePayrollCycle } from '../../lib/payroll-logic.js';
    import { t } from '../../lib/i18n/index.svelte.js';
    
    let { period = $bindable() } = $props();

    // Run on init to populate dates
    $effect(() => {
        if (period.year && period.month && period.dates.length === 0) {
            period.dates = generatePayrollCycle(period.year, period.month);
        }
    });

    function handleMonthChange() {
        if (period.year && period.month) {
            period.dates = generatePayrollCycle(period.year, period.month);
        }
    }
    
    let formattedStart = $derived(
        period.dates.length > 0 ? period.dates[0].toLocaleDateString('es-ES') : ''
    );
    let formattedEnd = $derived(
        period.dates.length > 0 ? period.dates[period.dates.length - 1].toLocaleDateString('es-ES') : ''
    );
</script>

<section class="step-pane active">
    <h2>{t('calc.step2.title')}</h2>
    <p class="mb-15">{t('calc.step2.desc')}</p>
    <div class="form-group">
        <label>{t('calc.step2.month_label')}</label>
        <div style="display: flex; gap: 1rem;">
            <select bind:value={period.month} onchange={handleMonthChange} style="flex: 2;">
                {#each Array(12) as _, i}
                    <option value={i + 1}>{t(`common.months.${i + 1}`)}</option>
                {/each}
            </select>
            <input type="number" bind:value={period.year} onchange={handleMonthChange} style="flex: 1;" min="2000" max="2100">
        </div>
    </div>
    {#if period.dates.length > 0}
    <div class="results-card text-center font-600 text-primary" id="period-info">
        {@html t('calc.step2.info', { start: formattedStart, end: formattedEnd })}
    </div>
    {/if}
</section>
