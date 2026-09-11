<script>
    import { data, getCategoryData, getPriceHour } from '../../lib/data.js';
    import { generateClaimText, generateInfoText } from '../../lib/text-generators.js';
    import { t } from '../../lib/i18n/index.svelte.js';
    import { showToastMsg, customAlert } from '../../lib/alert.svelte.js';

    let { totals, shifts, employee, monthText, goNext } = $props();

    const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
    const fmt = num => Number.isInteger(num) ? num : parseFloat(num.toFixed(2));

    let p_hora = $derived(getPriceHour(employee.categoryKey, employee.trienio));
    let p_nocturnidad = $derived(getCategoryData(employee.categoryKey)?.precio_nocturnidad || 0);
    let p_domingo = data.conceptos_comunes.precio_domingo;
    let p_dieta = data.conceptos_comunes.precio_dieta;
    
    let prolongation_hours = $derived(totals.prolongation_mins / 60);
    
    let f_comp = $derived(totals.comp_hours * p_hora); 
    let f_prolong = $derived(prolongation_hours * p_hora);
    let f_night = $derived(totals.night_hours * p_nocturnidad);
    let f_sunday = $derived(totals.sunday_hours * p_domingo);
    let f_diets = $derived(totals.diets * p_dieta);
    
    let prices = {
        local: data.conceptos_comunes.precio_festivo_local,
        especial: data.conceptos_comunes.precio_festivo_especial,
        no_local: data.conceptos_comunes.precio_festivo_no_local
    };

    let f_flocal = $derived(totals.f_local_hours * prices.local);
    let f_fespecial = $derived(totals.f_especial_hours * prices.especial);
    let f_fnolocal = $derived(totals.f_no_local_hours * prices.no_local);
    
    let subTotalVariables = $derived(f_comp + f_prolong + f_night + f_sunday + f_flocal + f_fespecial + f_fnolocal + f_diets);
    let aCuentaConvenio = $derived(subTotalVariables * 0.0404);
    let totalFin = $derived(subTotalVariables + aCuentaConvenio);

    // UI state
    let activeSection = $state('none'); // 'none', 'info', 'claim'
    let generatedText = $state('');

    // Claim form state
    let claimHasOwed = $state(false);
    let owedData = $state({ comp:0, prolong:0, night:0, sunday:0, flocal:0, fespecial:0, festatal:0, dietas:0 });
    let abonadoData = $state({ comp:0, prolong:0, night:0, sunday:0, flocal:0, fespecial:0, festatal:0, dietas:0 });

    function openInfo() {
        activeSection = 'info';
        generatedText = generateInfoText(shifts, totals, monthText, t);
    }

    function openClaim() {
        activeSection = 'claim';
        generatedText = ''; // Clear until user clicks generate
    }

    function doGenerateClaim() {
        generatedText = generateClaimText(shifts, totals, monthText, { hasOwed: claimHasOwed, ...owedData }, abonadoData, t);
    }

    function copyText() {
        navigator.clipboard.writeText(generatedText).then(() => {
            showToastMsg(t('calc.step4.toast_copy'));
        });
    }
</script>

<section class="step-pane active">
    <h2>{t('calc.step4.title')}</h2>
    
    <div class="results-card">
        <h3 style="margin-bottom:1rem; border-bottom:1px solid #eee; padding-bottom:0.5rem;">{t('calc.step4.breakdown')}</h3>
        
        {#if totals.comp_hours > 0}
            <div class="result-row">
                <span>{t('calc.step4.comp_hours')} <span class="result-breakdown">{fmt(totals.comp_hours)} h x {eur.format(p_hora)}</span></span>
                <strong>{eur.format(f_comp)}</strong>
            </div>
        {/if}
        {#if totals.prolongation_mins > 0}
            <div class="result-row">
                <span>{t('calc.step4.prolongation')} <span class="result-breakdown">{fmt(prolongation_hours)} h x {eur.format(p_hora)}</span></span>
                <strong>{eur.format(f_prolong)}</strong>
            </div>
        {/if}
        {#if totals.night_hours > 0}
            <div class="result-row">
                <span>{t('calc.step4.night_hours')} <span class="result-breakdown">{fmt(totals.night_hours)} h x {eur.format(p_nocturnidad)}</span></span>
                <strong>{eur.format(f_night)}</strong>
            </div>
        {/if}
        {#if totals.sunday_hours > 0}
            <div class="result-row">
                <span>{t('calc.step4.sunday_hours')} <span class="result-breakdown">{fmt(totals.sunday_hours)} h x {eur.format(p_domingo)}</span></span>
                <strong>{eur.format(f_sunday)}</strong>
            </div>
        {/if}
        {#if totals.diets > 0}
            <div class="result-row">
                <span>{t('calc.step4.diets')} <span class="result-breakdown">{fmt(totals.diets)} uds x {eur.format(p_dieta)}</span></span>
                <strong>{eur.format(f_diets)}</strong>
            </div>
        {/if}
        {#if totals.f_local_hours > 0}
            <div class="result-row">
                <span>{t('calc.step4.flocal')} <span class="result-breakdown">{fmt(totals.f_local_hours)} h x {eur.format(prices.local)}</span></span>
                <strong>{eur.format(f_flocal)}</strong>
            </div>
        {/if}
        {#if totals.f_especial_hours > 0}
            <div class="result-row">
                <span>{t('calc.step4.fespecial')} <span class="result-breakdown">{fmt(totals.f_especial_hours)} h x {eur.format(prices.especial)}</span></span>
                <strong>{eur.format(f_fespecial)}</strong>
            </div>
        {/if}
        {#if totals.f_no_local_hours > 0}
            <div class="result-row">
                <span>{t('calc.step4.fnolocal')} <span class="result-breakdown">{fmt(totals.f_no_local_hours)} h x {eur.format(prices.no_local)}</span></span>
                <strong>{eur.format(f_fnolocal)}</strong>
            </div>
        {/if}
        {#if aCuentaConvenio > 0}
            <div class="result-row" style="color: var(--color-primary); font-weight: 600;">
                <span>{t('calc.step4.acuenta')}</span>
                <strong>{eur.format(aCuentaConvenio)}</strong>
            </div>
        {/if}
        
        <div class="result-total">
            {eur.format(totalFin)}
        </div>
    </div>
    <p style="font-size:0.8rem; color:var(--color-text-muted); text-align:center;">
        {t('calc.step4.note', { hours: totals.ord_hours })}
    </p>

    <div class="flex-col gap-15 mt-2">
        {#if activeSection === 'none'}
            <div class="flex-col flex-center gap-1">
                <div style="position: relative; display: inline-block; width: 100%; max-width: 240px;">
                    <button type="button" class="btn btn-outline text-md w-full" onclick={openClaim}>{t('calc.step4.btn_claim')}</button>
                    <button type="button" class="btn-info-icon" style="position: absolute; right: -35px; top: 50%; transform: translateY(-50%);" title="{t('calc.step4.btn_claim')}..." onclick={() => customAlert(t('calc.step4.tooltip_claim'))}>i</button>
                </div>
                <div style="position: relative; display: inline-block; width: 100%; max-width: 240px;">
                    <button type="button" class="btn btn-outline text-md w-full" onclick={openInfo}>{t('calc.step4.btn_info')}</button>
                    <button type="button" class="btn-info-icon" style="position: absolute; right: -35px; top: 50%; transform: translateY(-50%);" title="{t('calc.step4.btn_info')}..." onclick={() => customAlert(t('calc.step4.tooltip_info'))}>i</button>
                </div>
            </div>
        {/if}
        
        <div class="flex-center mt-1">
            <button type="button" class="btn btn-primary" style="width: 100%; max-width: 240px;" onclick={goNext}>{t('calc.step4.btn_calc')}</button>
        </div>
    </div>

    {#if activeSection === 'info'}
        <div class="bg-surface p-15 rounded-lg border-border mt-1">
            <h3 class="text-lg text-primary mb-1">{t('calc.step4.info_title')}</h3>
            <textarea readonly class="w-full h-150 text-md p-05 border-border rounded-md bg-bg mb-1 resize-none" value={generatedText}></textarea>
            <button type="button" class="btn btn-primary w-full" onclick={copyText}>{t('calc.step4.btn_copy')}</button>
            <button type="button" class="btn btn-outline w-full mt-05" onclick={() => activeSection = 'none'}>{t('calc.step4.btn_close')}</button>
        </div>
    {/if}

    {#if activeSection === 'claim'}
        <div class="bg-surface p-15 rounded-lg border-border mt-1">
            <h3 class="text-lg text-primary mb-1">{t('calc.step4.claim_title')}</h3>
            
            <div class="flex-between bg-surface p-05-1 rounded-md border-border mb-1">
                <label for="claim-has-owed" class="mb-0 cursor-pointer">{t('calc.step4.claim_owed')}</label>
                <input type="checkbox" id="claim-has-owed" class="checkbox-md accent-primary" bind:checked={claimHasOwed}>
            </div>

            {#if claimHasOwed}
                <div class="mb-1 p-1 bg-bg rounded-md border-dashed">
                    <p class="text-sm mb-1">{t('calc.step4.owed_desc')}</p>
                    <div class="grid-2-col gap-05">
                        <div><label class="text-sm">{t('calc.step4.h_comp_ad')}</label><input type="number" bind:value={owedData.comp} min="0"></div>
                        <div><label style="font-size: 0.7rem;">{t('calc.step4.prolong_ad')}</label><input type="number" bind:value={owedData.prolong} min="0"></div>
                        <div><label style="font-size: 0.7rem;">{t('calc.step4.night_ad')}</label><input type="number" step="0.1" bind:value={owedData.night} min="0"></div>
                        <div><label style="font-size: 0.7rem;">{t('calc.step4.sunday_ad')}</label><input type="number" step="0.1" bind:value={owedData.sunday} min="0"></div>
                        <div><label style="font-size: 0.7rem;">{t('calc.step4.flocal_ad')}</label><input type="number" step="0.1" bind:value={owedData.flocal} min="0"></div>
                        <div><label style="font-size: 0.7rem;">{t('calc.step4.fespecial_ad')}</label><input type="number" step="0.1" bind:value={owedData.fespecial} min="0"></div>
                        <div><label style="font-size: 0.7rem;">{t('calc.step4.fnolocal_ad')}</label><input type="number" step="0.1" bind:value={owedData.festatal} min="0"></div>
                        <div><label style="font-size: 0.7rem;">{t('calc.step4.diets_ad')}</label><input type="number" bind:value={owedData.dietas} min="0"></div>
                    </div>
                </div>
            {/if}

            <p style="font-size: 0.8rem;">{t('calc.step4.abonado_desc')}</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                <div><label style="font-size: 0.7rem;">{t('calc.step4.h_comp_ab')}</label><input type="number" bind:value={abonadoData.comp} min="0"></div>
                <div><label style="font-size: 0.7rem;">{t('calc.step4.prolong_ab')}</label><input type="number" bind:value={abonadoData.prolong} min="0"></div>
                <div><label style="font-size: 0.7rem;">{t('calc.step4.night_ab')}</label><input type="number" step="0.1" bind:value={abonadoData.night} min="0"></div>
                <div><label style="font-size: 0.7rem;">{t('calc.step4.sunday_ab')}</label><input type="number" step="0.1" bind:value={abonadoData.sunday} min="0"></div>
                <div><label style="font-size: 0.7rem;">{t('calc.step4.flocal_ab')}</label><input type="number" step="0.1" bind:value={abonadoData.flocal} min="0"></div>
                <div><label style="font-size: 0.7rem;">{t('calc.step4.fespecial_ab')}</label><input type="number" step="0.1" bind:value={abonadoData.fespecial} min="0"></div>
                <div><label style="font-size: 0.7rem;">{t('calc.step4.fnolocal_ab')}</label><input type="number" step="0.1" bind:value={abonadoData.festatal} min="0"></div>
                <div><label style="font-size: 0.7rem;">{t('calc.step4.diets_ab')}</label><input type="number" bind:value={abonadoData.dietas} min="0"></div>
            </div>
            
            <button type="button" class="btn btn-outline w-full mb-1 text-sm" onclick={doGenerateClaim}>{t('calc.step4.btn_gen_text')}</button>
            
            <textarea readonly style="width: 100%; height: 150px; font-size: 0.8rem; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg); margin-bottom: 1rem; resize: none;" value={generatedText}></textarea>
            
            {#if generatedText}
                <button type="button" class="btn btn-primary w-full" onclick={copyText}>{t('calc.step4.btn_copy')}</button>
            {/if}
            <button type="button" class="btn btn-outline w-full mt-05" onclick={() => activeSection = 'none'}>{t('calc.step4.btn_close')}</button>
        </div>
    {/if}
</section>
