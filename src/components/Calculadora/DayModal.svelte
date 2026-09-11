<script>
    import { formatDate } from '../../lib/payroll-logic.js';
    import { t, localeState } from '../../lib/i18n/index.svelte.js';
    import { customAlert } from '../../lib/alert.svelte.js';
    
    let { 
        show = $bindable(false), 
        dateObj, 
        shifts = $bindable(), 
        localHolidays = $bindable() 
    } = $props();

    let dateStr = $derived(dateObj ? formatDate(dateObj) : '');
    
    // Local state for the form
    let isLocalHoliday = $state(false);
    let shiftType = $state('none');
    let unidad = $state('');
    let time = $state('07:00');
    let duration = $state(24);
    let prolongation = $state(0);
    let diets = $state(0);

    // Make title reactive to language
    let titleDate = $derived.by(() => {
        if (!dateObj) return '';
        // Use standard Intl formatting, reactive to localeState
        const locale = localeState.lang === 'ca' ? 'ca-ES' : 'es-ES';
        return dateObj.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
    });

    // When modal opens (dateObj changes), initialize local state
    $effect(() => {
        if (show && dateStr) {
            isLocalHoliday = !!localHolidays[dateStr];
            const currentShift = shifts[dateStr] || { type: 'none', unidad: '', time: '07:00', duration: 24, prolongation: 0, diets: 0 };
            shiftType = currentShift.type;
            unidad = currentShift.unidad || '';
            time = currentShift.time || '07:00';
            duration = currentShift.duration || 24;
            prolongation = currentShift.prolongation || 0;
            diets = currentShift.diets || 0;
        }
    });

    function close() {
        show = false;
    }

    function save() {
        if (isLocalHoliday) {
            localHolidays[dateStr] = true;
        } else {
            delete localHolidays[dateStr];
        }

        const trimmedUnidad = unidad.trim();
        
        if (shiftType !== 'none' && !trimmedUnidad) {
            customAlert(t('calc.modal.alert_unit'));
            return;
        }
        
        if (shiftType === 'none') {
            delete shifts[dateStr];
        } else {
            shifts[dateStr] = {
                type: shiftType,
                unidad: trimmedUnidad,
                time: time,
                duration: parseInt(duration, 10),
                prolongation: parseInt(prolongation, 10),
                diets: parseInt(diets, 10)
            };
        }
        
        show = false;
    }
</script>

{#if show}
<div class="modal-overlay open">
    <div class="modal-content">
        <h3 class="mb-1 text-primary">{titleDate}</h3>
        
        <div class="flex-between mb-15 p-05 bg-primary-light rounded-md">
            <label for="modal-local-holiday" class="mb-0 font-700 text-primary cursor-pointer">{t('calc.modal.is_local_holiday')}</label>
            <input type="checkbox" id="modal-local-holiday" class="checkbox-md accent-primary" bind:checked={isLocalHoliday}>
        </div>
        
        <div class="form-group">
            <label for="modal-shift-type">{t('calc.modal.shift_type')}</label>
            <select id="modal-shift-type" bind:value={shiftType}>
                <option value="none">{t('calc.modal.shift_none')}</option>
                <option value="ordinaria">{t('calc.modal.shift_ord')}</option>
                <option value="complementaria">{t('calc.modal.shift_comp')}</option>
            </select>
        </div>

        {#if shiftType !== 'none'}
            <div>
                <div class="form-group">
                    <label for="modal-unidad">{t('calc.modal.unit')}</label>
                    <input type="text" id="modal-unidad" placeholder="{t('calc.modal.unit_placeholder')}" bind:value={unidad}>
                </div>
                <div class="flex-row gap-05 mb-1">
                    <div class="flex-1">
                        <label for="modal-time">{t('calc.modal.time')}</label>
                        <input type="time" id="modal-time" bind:value={time}>
                    </div>
                    <div class="flex-1">
                        <label for="modal-duration">{t('calc.modal.duration')}</label>
                        <input type="number" id="modal-duration" bind:value={duration} min="1" max="24">
                    </div>
                </div>

                <div class="form-group">
                    <label for="modal-prolongation">{t('calc.modal.prolongation')}</label>
                    <input type="number" id="modal-prolongation" bind:value={prolongation} min="0">
                </div>

                <div class="form-group">
                    <label for="modal-diets">{t('calc.modal.diets')}</label>
                    <select id="modal-diets" bind:value={diets}>
                        <option value="0">{t('calc.modal.diet_0')}</option>
                        <option value="1">{t('calc.modal.diet_1')}</option>
                        <option value="2">{t('calc.modal.diet_2')}</option>
                    </select>
                </div>
            </div>
        {/if}

        <div class="flex-row gap-1 mt-15">
            <button type="button" class="btn btn-secondary flex-1" onclick={close}>{t('calc.modal.btn_cancel')}</button>
            <button type="button" class="btn btn-primary flex-1" onclick={save}>{t('calc.modal.btn_save')}</button>
        </div>
    </div>
</div>
{/if}
