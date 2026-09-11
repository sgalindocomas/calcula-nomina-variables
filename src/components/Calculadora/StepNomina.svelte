<script>
    import { data, getCategoryData, getPriceHour } from '../../lib/data.js';
    import { trackUmamiEvent } from '../../lib/analytics.js';
    import { t } from '../../lib/i18n/index.svelte.js';

    let { totals, employee } = $props();

    const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
    const fmt = num => Number.isInteger(num) ? num : parseFloat(num.toFixed(2));

    let irpfPercent = $state(0);
    let isProrrateada = $state(false);

    let hasSimulated = $state(false);
    let simResult = $state(null);

    function calculateSimulation() {
        trackUmamiEvent('Simular Nomina');
        
        const catData = getCategoryData(employee.categoryKey);
        if (!catData) return;
        
        const salarioBase = catData.salario_base || 0;
        const compFormacion = catData.comp_formacion || 0;
        const antiguedad = catData.trienios[employee.trienio] || 0;
        const plusAsistencia = data.conceptos_comunes.plus_asistencia_puntualidad || 0;
        
        const basePagaExtra = salarioBase + compFormacion + antiguedad;
        const fijosSuma = basePagaExtra + plusAsistencia;
        
        let variablesSuma = 0;
        let prolongationSuma = 0;
        let devengosList = [];
        
        if (totals) {
            const p_hora = getPriceHour(employee.categoryKey, employee.trienio);
            
            const v_comp = totals.comp_hours * p_hora;
            const v_prolong = (totals.prolongation_mins / 60) * p_hora;
            const v_night = totals.night_hours * catData.precio_nocturnidad;
            const v_sunday = totals.sunday_hours * data.conceptos_comunes.precio_domingo;
            const v_flocal = totals.f_local_hours * data.conceptos_comunes.precio_festivo_local;
            const v_fespecial = totals.f_especial_hours * data.conceptos_comunes.precio_festivo_especial;
            const v_fnolocal = totals.f_no_local_hours * data.conceptos_comunes.precio_festivo_no_local;
            const v_diets = totals.diets * data.conceptos_comunes.precio_dieta;
            
            prolongationSuma = v_prolong;
            
            if(v_comp > 0) devengosList.push({ name: t('calc.step4.comp_hours'), val: v_comp, detail: `${fmt(totals.comp_hours)} h x ${eur.format(p_hora)}` });
            if(v_prolong > 0) devengosList.push({ name: t('calc.step4.prolongation'), val: v_prolong, detail: `${fmt(totals.prolongation_mins/60)} h x ${eur.format(p_hora)}` });
            if(v_night > 0) devengosList.push({ name: t('calc.step4.night_hours'), val: v_night, detail: `${fmt(totals.night_hours)} h x ${eur.format(catData.precio_nocturnidad)}` });
            if(v_sunday > 0) devengosList.push({ name: t('calc.step4.sunday_hours'), val: v_sunday, detail: `${fmt(totals.sunday_hours)} h x ${eur.format(data.conceptos_comunes.precio_domingo)}` });
            if(v_flocal > 0) devengosList.push({ name: t('calc.step4.flocal'), val: v_flocal, detail: `${fmt(totals.f_local_hours)} h x ${eur.format(data.conceptos_comunes.precio_festivo_local)}` });
            if(v_fespecial > 0) devengosList.push({ name: t('calc.step4.fespecial'), val: v_fespecial, detail: `${fmt(totals.f_especial_hours)} h x ${eur.format(data.conceptos_comunes.precio_festivo_especial)}` });
            if(v_fnolocal > 0) devengosList.push({ name: t('calc.step4.fnolocal'), val: v_fnolocal, detail: `${fmt(totals.f_no_local_hours)} h x ${eur.format(data.conceptos_comunes.precio_festivo_no_local)}` });
            if(v_diets > 0) devengosList.push({ name: t('calc.step4.diets'), val: v_diets, detail: `${fmt(totals.diets)} uds x ${eur.format(data.conceptos_comunes.precio_dieta)}` });
            
            variablesSuma = v_comp + v_prolong + v_night + v_sunday + v_flocal + v_fespecial + v_fnolocal + v_diets;
        }
        
        const sumaParaAcuenta = fijosSuma + variablesSuma;
        const aCuentaConvenio = sumaParaAcuenta * 0.0404;
        
        const prorrataUnaPaga = basePagaExtra * 1.0404 / 12;
        const prorrataMensualPagasExtras = prorrataUnaPaga * 2;
        
        let totalDevengado = fijosSuma + variablesSuma + aCuentaConvenio;
        
        if (isProrrateada) {
            devengosList.push({ name: t('calc.step5.pp_verano'), val: prorrataUnaPaga, detail: '' });
            devengosList.push({ name: t('calc.step5.pp_invierno'), val: prorrataUnaPaga, detail: '' });
            totalDevengado += prorrataMensualPagasExtras;
        }
        
        const baseIRPF = totalDevengado;
        const baseCC = totalDevengado - prolongationSuma + (isProrrateada ? 0 : prorrataMensualPagasExtras);
        const baseAT = totalDevengado + (isProrrateada ? 0 : prorrataMensualPagasExtras);
        
        const dedIRPF = baseIRPF * (irpfPercent / 100);
        const dedCC = baseCC * 0.047;
        const dedMEI = baseCC * 0.0015;
        const dedFP = baseAT * 0.0010;
        const dedDesempleo = baseAT * 0.0155;
        
        const totalDeducciones = dedIRPF + dedCC + dedMEI + dedFP + dedDesempleo;
        const liquido = totalDevengado - totalDeducciones;

        simResult = {
            salarioBase, compFormacion, antiguedad, plusAsistencia,
            devengosList, aCuentaConvenio, totalDevengado,
            isProrrateada, prorrataMensualPagasExtras,
            baseIRPF, baseCC, baseAT,
            dedIRPF, dedCC, dedMEI, dedFP, dedDesempleo, totalDeducciones,
            liquido
        };
        hasSimulated = true;
    }
</script>

<section class="step-pane active">
    <h2>{t('calc.step5.title')}</h2>
    
    {#if !hasSimulated}
        <div id="sim-form-container">
            <div style="background-color: #fff3cd; color: #856404; border: 1px solid #ffeeba; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem; font-size: 0.85rem;">
                {t('calc.step5.dev_warning')}
            </div>
            
            <p style="margin-top: 1rem; font-size: 0.8rem;">{t('calc.step5.adv_options')}</p>
            <div class="form-group">
                <label for="sim-irpf">{t('calc.step5.irpf')}</label>
                <input type="number" id="sim-irpf" placeholder="{t('calc.step5.irpf_placeholder')}" min="0" max="100" step="0.01" bind:value={irpfPercent}>
            </div>
            <div class="flex-between bg-surface p-05-1 rounded-md border-border mb-15">
                <label for="sim-pagas-extra" class="mb-0 cursor-pointer font-600">{t('calc.step5.prorrata')}</label>
                <input type="checkbox" id="sim-pagas-extra" class="checkbox-md accent-primary" bind:checked={isProrrateada}>
            </div>
            
            <div class="flex-center mt-15">
                <button type="button" class="btn btn-primary w-full max-w-300" onclick={calculateSimulation}>{t('calc.step5.btn_calc')}</button>
            </div>
        </div>
    {:else}
        <div class="mt-1">
            <div style="background: var(--color-primary-light); padding: 1.5rem; border-radius: 6px; border: 2px solid var(--color-primary); text-align: center; margin-bottom: 1rem;">
                <h3 style="color: var(--color-primary); font-size: 1.2rem; margin-bottom: 0.5rem;">{t('calc.step5.liquido')}</h3>
                <strong style="font-size: 2.2rem; color: var(--color-text); font-weight: 900;">{eur.format(simResult.liquido)}</strong>
            </div>

            <div style="background: var(--color-surface); padding: 1rem; border-radius: 6px; border: 1px solid var(--color-border); margin-bottom: 1rem;">
                <h3 style="color: var(--color-primary); font-size: 1.1rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem;">{t('calc.step5.devengos')}</h3>
                <div class="result-row"><span>{t('calc.step5.base')}<span class="result-breakdown">30 d x {eur.format(simResult.salarioBase/30)}</span></span><strong>{eur.format(simResult.salarioBase)}</strong></div>
                <div class="result-row"><span>{t('calc.step5.formacion')}<span class="result-breakdown">30 d x {eur.format(simResult.compFormacion/30)}</span></span><strong>{eur.format(simResult.compFormacion)}</strong></div>
                <div class="result-row"><span>{t('calc.step5.antiguedad')}<span class="result-breakdown">30 d x {eur.format(simResult.antiguedad/30)}</span></span><strong>{eur.format(simResult.antiguedad)}</strong></div>
                <div class="result-row"><span>{t('calc.step5.asistencia')}<span class="result-breakdown">30 d x {eur.format(simResult.plusAsistencia/30)}</span></span><strong>{eur.format(simResult.plusAsistencia)}</strong></div>
                
                {#each simResult.devengosList as devengo}
                    <div class="result-row"><span>{devengo.name}{#if devengo.detail}<span class="result-breakdown">{devengo.detail}</span>{/if}</span><strong>{eur.format(devengo.val)}</strong></div>
                {/each}

                <div class="result-row"><span>{t('calc.step4.acuenta')}</span><strong>{eur.format(simResult.aCuentaConvenio)}</strong></div>
                <div class="result-row" style="border-top: 2px solid var(--color-border); margin-top: 0.5rem; padding-top: 0.5rem;">
                    <span style="font-weight: 700;">{t('calc.step5.total_dev')}</span><strong style="color: var(--color-primary);">{eur.format(simResult.totalDevengado)}</strong>
                </div>
            </div>

            <div style="background: var(--color-surface); padding: 1rem; border-radius: 6px; border: 1px solid var(--color-border); margin-bottom: 1rem;">
                <h3 style="color: var(--color-text-muted); font-size: 1.1rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem;">{t('calc.step5.retenciones')}</h3>
                <div class="result-row"><span>{t('calc.step5.irpf')} ({irpfPercent}%)<span class="result-breakdown">{eur.format(simResult.baseIRPF)} x {irpfPercent}%</span></span><strong>-{eur.format(simResult.dedIRPF)}</strong></div>
                <div class="result-row"><span>{t('calc.step5.cc')}<span class="result-breakdown">{eur.format(simResult.baseCC)} x 4.7%</span></span><strong>-{eur.format(simResult.dedCC)}</strong></div>
                <div class="result-row"><span>{t('calc.step5.mei')}<span class="result-breakdown">{eur.format(simResult.baseCC)} x 0.15%</span></span><strong>-{eur.format(simResult.dedMEI)}</strong></div>
                <div class="result-row"><span>{t('calc.step5.fp')}<span class="result-breakdown">{eur.format(simResult.baseAT)} x 0.10%</span></span><strong>-{eur.format(simResult.dedFP)}</strong></div>
                <div class="result-row"><span>{t('calc.step5.desempleo')}<span class="result-breakdown">{eur.format(simResult.baseAT)} x 1.55%</span></span><strong>-{eur.format(simResult.dedDesempleo)}</strong></div>
                <div class="result-row" style="border-top: 2px solid var(--color-border); margin-top: 0.5rem; padding-top: 0.5rem;">
                    <span style="font-weight: 700;">{t('calc.step5.total_ded')}</span><strong>-{eur.format(simResult.totalDeducciones)}</strong>
                </div>
            </div>

            <div style="background: var(--color-surface); padding: 1rem; border-radius: 6px; border: 1px solid var(--color-border); margin-bottom: 1rem;">
                <h3 style="color: var(--color-text); font-size: 1.1rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem;">{t('calc.step5.bases')}</h3>
                <div class="result-row"><span>{t('calc.step5.base_prorrata')}</span><strong>{simResult.isProrrateada ? '' : eur.format(simResult.prorrataMensualPagasExtras)}</strong></div>
                <div class="result-row"><span>{t('calc.step5.base_irpf')}</span><strong>{eur.format(simResult.baseIRPF)}</strong></div>
                <div class="result-row"><span>{t('calc.step5.base_cc')}</span><strong>{eur.format(simResult.baseCC)}</strong></div>
                <div class="result-row"><span>{t('calc.step5.base_at')}</span><strong>{eur.format(simResult.baseAT)}</strong></div>
            </div>

            <button type="button" class="btn btn-outline w-full mt-15" onclick={() => hasSimulated = false}>{t('calc.step5.btn_adjust')}</button>
        </div>
    {/if}
</section>
