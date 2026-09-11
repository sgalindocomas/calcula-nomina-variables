<script>
    import { onMount } from 'svelte';
    import { calculateTotals } from '../lib/payroll-logic.js';
    import Stepper from '../components/Calculadora/Stepper.svelte';
    import StepEmployee from '../components/Calculadora/StepEmployee.svelte';
    import StepPeriod from '../components/Calculadora/StepPeriod.svelte';
    import StepCalendar from '../components/Calculadora/StepCalendar.svelte';
    import StepVariables from '../components/Calculadora/StepVariables.svelte';
    import StepNomina from '../components/Calculadora/StepNomina.svelte';
    import CustomAlert from '../components/CustomAlert.svelte';
    import GlobalToast from '../components/GlobalToast.svelte';
    import { t } from '../lib/i18n/index.svelte.js';
    import { customAlert } from '../lib/alert.svelte.js';

    let currentStep = $state(1);
    const totalSteps = 5;

    let employee = $state({
        categoryKey: '',
        trienio: ''
    });

    const now = new Date();
    let period = $state({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        dates: [] // Will be populated in StepPeriod or here
    });

    let shifts = $state({});
    let localHolidays = $state({});

    let monthText = $derived.by(() => {
        if (!period.year || !period.month) return '';
        return `${t(`common.months.${period.month}`)} de ${period.year}`;
    });

    let totals = $derived(calculateTotals(shifts, localHolidays));

    function validateStep(step) {
        if (step === 1) {
            if (!employee.categoryKey || employee.trienio === '') {
                customAlert(t('calc.step1.alert_missing'));
                return false;
            }
        }
        if (step === 2) {
            if (!period.year || !period.month) {
                customAlert(t('calc.step2.alert_missing'));
                return false;
            }
        }
        return true;
    }

    function goNext() {
        if (!validateStep(currentStep)) return;
        
        if (currentStep < totalSteps) {
            currentStep++;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function goPrev() {
        if (currentStep > 1) {
            currentStep--;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
</script>

<div class="app-container shadow-glass">
    <!-- Header -->
    <header class="header cursor-pointer" onclick={() => window.location.href='./index.html'} title="{t('common.back_home')}">
        <div class="flex-center gap-08 mb-15">
            <span class="vt-header-title font-inter text-base font-800 text-black">{t('common.title')}</span>
            <img src="./ccoo.png" alt="Logo CCOO Catalunya" class="vt-header-logo h-35 mb-0">
        </div>
        <h1 class="mt-0">{t('calc.header.title')}</h1>
        <p>{t('calc.header.subtitle')}</p>
    </header>

    <Stepper {currentStep} />

    <main class="step-content-container">
        {#if currentStep === 1}
            <StepEmployee bind:employee />
        {:else if currentStep === 2}
            <StepPeriod bind:period />
        {:else if currentStep === 3}
            <StepCalendar bind:period bind:shifts bind:localHolidays />
        {:else if currentStep === 4}
            <StepVariables {totals} {shifts} {employee} {monthText} {goNext} />
        {:else if currentStep === 5}
            <StepNomina {totals} {employee} />
        {/if}
    </main>

    <footer class="stepper-actions">
        <button type="button" class="btn btn-secondary" style="visibility: {currentStep === 1 ? 'hidden' : 'visible'}" onclick={goPrev}>{t('calc.nav.back')}</button>
        {#if currentStep < 4}
            <button type="button" class="btn btn-primary" onclick={goNext}>{t('calc.nav.next')}</button>
        {:else if currentStep === 5}
            <button type="button" class="btn btn-primary" style="visibility: hidden;">{t('calc.nav.finish')}</button>
        {/if}
    </footer>

    <!-- Affiliation Banner -->
    <div class="affiliation-banner">
        <h3>{t('common.affiliation.title')}</h3>
        <p>{t('common.affiliation.text')}</p>
        <a href="https://www.ccoo.cat/afiliat" target="_blank" class="btn-white">{t('common.affiliation.btn')}</a>
    </div>
</div>

<CustomAlert />
<GlobalToast />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<footer class="global-footer cursor-pointer" onclick={() => window.location.href='./index.html'} title="{t('common.back_home')}">
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
