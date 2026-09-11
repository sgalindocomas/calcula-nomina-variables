<script>
    import { formatDate, getHolidayInfo } from '../../lib/payroll-logic.js';
    import DayModal from './DayModal.svelte';
    import { t } from '../../lib/i18n/index.svelte.js';
    import { customAlert } from '../../lib/alert.svelte.js';

    let { period = $bindable(), shifts = $bindable(), localHolidays = $bindable() } = $props();

    let DAYS_OF_WEEK = $derived(t('common.days'));
    let monthNames = $derived([
        t('common.months_short.1'), t('common.months_short.2'), t('common.months_short.3'),
        t('common.months_short.4'), t('common.months_short.5'), t('common.months_short.6'),
        t('common.months_short.7'), t('common.months_short.8'), t('common.months_short.9'),
        t('common.months_short.10'), t('common.months_short.11'), t('common.months_short.12')
    ]);

    let paintMode = $state(false);
    let defaultUnidad = $state('');
    let defaultTime = $state('07:00');
    let defaultDuration = $state(24);

    let startDayOffset = $derived.by(() => {
        if (!period.dates || period.dates.length === 0) return 0;
        let day = period.dates[0].getDay() - 1;
        if (day < 0) day = 6;
        return day;
    });
    
    let blanks = $derived(Array(startDayOffset).fill(null));

    // Modal state
    let showModal = $state(false);
    let editingDateObj = $state(null);

    function handleDayClick(date) {
        const dateStr = formatDate(date);
        const shift = shifts[dateStr];

        if (paintMode) {
            const unidad = defaultUnidad.trim();
            if (shift && shift.type !== 'none') {
                delete shifts[dateStr];
            } else {
                if (!unidad) {
                    customAlert(t('calc.step3.alert_unit'));
                    return;
                }
                shifts[dateStr] = {
                    type: 'ordinaria',
                    time: defaultTime,
                    duration: defaultDuration,
                    unidad: unidad,
                    prolongation: 0,
                    diets: 0
                };
            }
        } else {
            editingDateObj = date;
            showModal = true;
        }
    }

    function clearCalendar() {
        shifts = {};
    }
</script>

<section class="step-pane active">
    <h2>{t('calc.step3.title')}</h2>
    <p class="mb-1 text-md">{t('calc.step3.desc')}</p>
    
    <div class="bg-bg p-1 rounded-lg border-border mb-1">
        <div class="flex-row gap-05 mb-075">
            <div class="flex-2">
                <label for="default-unidad" class="text-sm">{t('calc.step3.unit_label')}</label>
                <input type="text" id="default-unidad" placeholder="{t('calc.step3.unit_placeholder')}" bind:value={defaultUnidad}>
            </div>
            <div class="flex-1">
                <label for="default-time" class="text-sm">{t('calc.step3.time_label')}</label>
                <input type="time" id="default-time" bind:value={defaultTime}>
            </div>
            <div class="flex-1">
                <label for="default-duration" class="text-sm">{t('calc.step3.duration_label')}</label>
                <input type="number" id="default-duration" bind:value={defaultDuration} min="1" max="24">
            </div>
        </div>
        <div class="flex-between bg-surface p-05-1 rounded-md border-primary-light">
            <label for="toggle-paint-mode" class="mb-0 cursor-pointer text-primary font-700">{t('calc.step3.paint_mode')}</label>
            <input type="checkbox" id="toggle-paint-mode" class="checkbox-md accent-primary" bind:checked={paintMode}>
        </div>
    </div>

    <div class="calendar-container">
        <div class="calendar-grid">
            {#each DAYS_OF_WEEK as d}
                <div class="calendar-day-header">{d}</div>
            {/each}
            
            {#each blanks as _}
                <div class="calendar-day" style="visibility: hidden;"></div>
            {/each}

            {#each period.dates as date}
                {@const dateStr = formatDate(date)}
                {@const shift = shifts[dateStr]}
                {@const isSunday = date.getDay() === 0}
                {@const holType = getHolidayInfo(date, localHolidays)}
                
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div 
                    class="calendar-day"
                    class:selected={shift && shift.type !== 'none'}
                    class:ordinaria={shift?.type === 'ordinaria'}
                    class:complementaria={shift?.type === 'complementaria'}
                    class:festivo={!!holType}
                    class:festivo-local={holType === 'local'}
                    class:festivo-especial={holType === 'especial'}
                    class:festivo-no_local={holType === 'no_local'}
                    style="color: {isSunday && !(shift && shift.type !== 'none') ? 'var(--color-primary)' : ''}"
                    onclick={() => handleDayClick(date)}
                >
                    <span class="day-num">{date.getDate()}</span>
                    <span class="day-month">{monthNames[date.getMonth()]}</span>
                    {#if shift && shift.type !== 'none' && shift.unidad}
                        <span class="shift-unidad">{shift.unidad}</span>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
    
    <div class="calendar-legend flex-wrap flex-center mt-15 text-sm text-muted" style="gap: 0.5rem 1rem;">
        <div class="flex-center gap-05"><span class="legend-color-box bg-primary"></span> {t('calc.step3.legend_ord')}</div>
        <div class="flex-center gap-05"><span class="legend-color-box bg-secondary"></span> {t('calc.step3.legend_comp')}</div>
        <div class="flex-center gap-05"><span class="legend-color-box border-festivo-local"></span> {t('calc.step3.legend_flocal')}</div>
        <div class="flex-center gap-05"><span class="legend-color-box border-festivo-especial"></span> {t('calc.step3.legend_fespec')}</div>
        <div class="flex-center gap-05"><span class="legend-color-box border-festivo-nolocal"></span> {t('calc.step3.legend_fnolocal')}</div>
    </div>
    
    <div class="mt-1 text-center">
        <button type="button" class="btn btn-outline text-md p-04-08" onclick={clearCalendar}>{t('calc.step3.btn_clear')}</button>
    </div>
</section>

<DayModal bind:show={showModal} dateObj={editingDateObj} bind:shifts bind:localHolidays />
