<script>
    import { t } from '../../lib/i18n/index.svelte.js';
    let { currentStep } = $props();
    let steps = $derived([
        { num: 1, label: t('calc.steps.1') },
        { num: 2, label: t('calc.steps.2') },
        { num: 3, label: t('calc.steps.3') },
        { num: 4, label: t('calc.steps.4') },
        { num: 5, label: t('calc.steps.5') }
    ]);
</script>

<div class="stepper-header" id="stepper-indicators">
    {#each steps as step}
        <div class="step-indicator {currentStep === step.num ? 'active' : ''} {currentStep > step.num ? 'completed' : ''}" data-step={step.num}>
            <div class="step-circle">{step.num}</div>
            <div class="step-label">{step.label}</div>
        </div>
    {/each}
</div>
