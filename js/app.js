// --- HOLIDAY CALCULATION ---
function getEasterSunday(year) {
    const f = Math.floor,
          G = year % 19,
          C = f(year / 100),
          H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
          I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
          J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
          L = I - J,
          month = 3 + f((L + 40) / 44),
          day = L + 28 - 31 * f(month / 4);
    return new Date(year, month - 1, day);
}

function getHolidayInfo(dateObj, localHolidaysObj) {
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth();
    const d = dateObj.getDate();
    const dateStr = formatDate(dateObj);
    
    if (localHolidaysObj && localHolidaysObj[dateStr]) return 'local';
    
    if (m === 11 && d === 25) return 'especial';
    if (m === 0 && d === 1) return 'especial';
    if (m === 5 && d === 24) return 'especial';
    
    const easter = getEasterSunday(y);
    const viernesSanto = new Date(easter);
    viernesSanto.setDate(easter.getDate() - 2);
    if (m === viernesSanto.getMonth() && d === viernesSanto.getDate()) return 'especial';
    
    const lunesPascua = new Date(easter);
    lunesPascua.setDate(easter.getDate() + 1);
    if (m === lunesPascua.getMonth() && d === lunesPascua.getDate()) return 'especial';
    
    const nonLocalDates = [[0, 6], [4, 1], [7, 15], [8, 11], [9, 12], [10, 1], [11, 6], [11, 8], [11, 26]];
    for (const [hm, hd] of nonLocalDates) {
        if (m === hm && d === hd) return 'no_local';
    }
    return null;
}

// --- CALCULATOR MODULE ---
function calculateShiftVariables(dateStr, timeStr, durationHours, prices, localHolidaysObj) {
    if (!timeStr || !durationHours || durationHours <= 0) {
        return { nightHours: 0, sundayHours: 0, fLocalHours: 0, fEspecialHours: 0, fNoLocalHours: 0 };
    }
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const start = new Date(dateStr);
    start.setHours(hours, minutes, 0, 0);
    
    const end = new Date(start.getTime() + durationHours * 3600000);
    
    let nightHours = 0;
    let sundayHours = 0;
    let fLocalHours = 0;
    let fEspecialHours = 0;
    let fNoLocalHours = 0;
    
    const stepMs = 60000;
    let current = new Date(start.getTime());
    
    while (current < end) {
        const h = current.getHours();
        const day = current.getDay();
        
        if (h >= 22 || h < 6) nightHours += 1/60;
        
        let minPrice = -1;
        let minuteCat = null;
        
        if (day === 0) {
            minPrice = prices.domingo;
            minuteCat = 'sunday';
        }
        
        const holType = getHolidayInfo(current, localHolidaysObj);
        const m = current.getMonth();
        const d = current.getDate();
        const isSpecialEve = (m === 11 && (d === 24 || d === 31) && h >= 22);
        
        if (isSpecialEve || holType === 'especial') {
            if (prices.especial > minPrice) { minPrice = prices.especial; minuteCat = 'especial'; }
        } else if (holType === 'local') {
            if (prices.local > minPrice) { minPrice = prices.local; minuteCat = 'local'; }
        } else if (holType === 'no_local') {
            if (prices.no_local > minPrice) { minPrice = prices.no_local; minuteCat = 'no_local'; }
        }
        
        if (minuteCat === 'sunday') sundayHours += 1/60;
        else if (minuteCat === 'especial') fEspecialHours += 1/60;
        else if (minuteCat === 'local') fLocalHours += 1/60;
        else if (minuteCat === 'no_local') fNoLocalHours += 1/60;
        
        current.setTime(current.getTime() + stepMs);
    }
    
    return {
        nightHours: Math.round(nightHours * 100) / 100,
        sundayHours: Math.round(sundayHours * 100) / 100,
        fLocalHours: Math.round(fLocalHours * 100) / 100,
        fEspecialHours: Math.round(fEspecialHours * 100) / 100,
        fNoLocalHours: Math.round(fNoLocalHours * 100) / 100
    };
}

function generatePayrollCycle(year, month) {
    const dates = [];
    let startMonth = month - 2; 
    let startYear = year;
    if (startMonth < 0) {
        startMonth = 11;
        startYear -= 1;
    }
    
    const startDate = new Date(startYear, startMonth, 16);
    const endDate = new Date(year, month - 1, 15);
    
    let current = new Date(startDate);
    while (current <= endDate) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    
    return dates;
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// --- GLOBAL STATE ---
const state = {
    currentStep: 1,
    totalSteps: 5,
    employee: {
        categoryKey: '',
        trienio: ''
    },
    period: {
        year: null,
        month: null,
        dates: []
    },
    shifts: {},
    localHolidays: {}
};

// --- DOM ELEMENTS ---
const elements = {
    btnNext: document.getElementById('btn-next'),
    btnPrev: document.getElementById('btn-prev'),
    steps: [
        document.getElementById('step-1'),
        document.getElementById('step-2'),
        document.getElementById('step-3'),
        document.getElementById('step-4'),
        document.getElementById('step-5')
    ],
    indicators: document.querySelectorAll('.step-indicator'),
    
    // Step 1
    selCategory: document.getElementById('employee-category'),
    selSeniority: document.getElementById('employee-seniority'),
    
    // Step 2
    inpMonth: document.getElementById('period-month'),
    divPeriodInfo: document.getElementById('period-info'),
    spanPeriodStart: document.getElementById('period-start'),
    spanPeriodEnd: document.getElementById('period-end'),
    
    // Step 3
    calendarGrid: document.getElementById('calendar-grid'),
    inpDefaultUnidad: document.getElementById('default-unidad'),
    inpDefaultTime: document.getElementById('default-time'),
    inpDefaultDuration: document.getElementById('default-duration'),
    togglePaintMode: document.getElementById('toggle-paint-mode'),
    btnClearCalendar: document.getElementById('btn-clear-calendar'),
    
    // Modal
    modalOverlay: document.getElementById('day-modal'),
    modalTitle: document.getElementById('modal-date-title'),
    modalLocalHoliday: document.getElementById('modal-local-holiday'),
    modalShiftType: document.getElementById('modal-shift-type'),
    modalTimeConfig: document.getElementById('modal-time-config'),
    modalUnidad: document.getElementById('modal-unidad'),
    modalTime: document.getElementById('modal-time'),
    modalDuration: document.getElementById('modal-duration'),
    modalProlongation: document.getElementById('modal-prolongation'),
    modalDiets: document.getElementById('modal-diets'),
    btnModalClose: document.getElementById('btn-modal-close'),
    btnModalSave: document.getElementById('btn-modal-save'),
    
    // Step 4
    resultsContainer: document.getElementById('results-container'),
    btnOpenClaim: document.getElementById('btn-open-claim'),
    btnOpenInfo: document.getElementById('btn-open-info'),
    btnSimulatePayroll: document.getElementById('btn-simulate-payroll'),
    actionButtonsContainer: document.getElementById('action-buttons-container'),
    claimSection: document.getElementById('claim-section'),
    infoSection: document.getElementById('info-section'),
    infoText: document.getElementById('info-text'),
    btnCopyInfo: document.getElementById('btn-copy-info'),
    claimAbonadoComp: document.getElementById('claim-abonado-comp'),
    claimAbonadoProlong: document.getElementById('claim-abonado-prolong'),
    claimAbonadoNight: document.getElementById('claim-abonado-night'),
    claimAbonadoSunday: document.getElementById('claim-abonado-sunday'),
    claimAbonadoFLocal: document.getElementById('claim-abonado-flocal'),
    claimAbonadoFEspecial: document.getElementById('claim-abonado-fespecial'),
    claimAbonadoFEstatal: document.getElementById('claim-abonado-festatal'),
    claimAbonadoDietas: document.getElementById('claim-abonado-dietas'),
    btnGenerateClaim: document.getElementById('btn-generate-claim'),
    btnCopyClaim: document.getElementById('btn-copy-claim'),
    claimText: document.getElementById('claim-text'),
    
    // Step 5
    simIrpf: document.getElementById('sim-irpf'),
    simPagasExtra: document.getElementById('sim-pagas-extra'),
    btnDoSimulate: document.getElementById('btn-do-simulate'),
    simResults: document.getElementById('sim-results'),
    
    toastNotification: document.getElementById('toast-notification')
};

let currentEditingDate = null;
let lastCalculatedTotals = null;

// --- INITIALIZATION ---
function init() {
    populateCategories();
    setupEventListeners();
    updateStepperUI();
    
    const now = new Date();
    elements.inpMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    handlePeriodChange();
}

function populateCategories() {
    for (const [key, cat] of Object.entries(data.categorias)) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = cat.nombre;
        elements.selCategory.appendChild(opt);
    }
}

function updateSeniorityOptions(categoryKey) {
    elements.selSeniority.innerHTML = '<option value="">Selecciona trienios...</option>';
    if (!categoryKey) {
        elements.selSeniority.disabled = true;
        return;
    }
    const cat = getCategoryData(categoryKey);
    for (const trienio in cat.trienios) {
        const opt = document.createElement('option');
        opt.value = trienio;
        opt.textContent = trienio;
        elements.selSeniority.appendChild(opt);
    }
    elements.selSeniority.disabled = false;
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    elements.btnNext.addEventListener('click', goNext);
    elements.btnPrev.addEventListener('click', goPrev);
    
    elements.selCategory.addEventListener('change', (e) => {
        state.employee.categoryKey = e.target.value;
        updateSeniorityOptions(e.target.value);
        state.employee.trienio = '';
    });
    
    elements.selSeniority.addEventListener('change', (e) => {
        state.employee.trienio = e.target.value;
    });
    
    elements.inpMonth.addEventListener('change', handlePeriodChange);
    
    elements.btnClearCalendar.addEventListener('click', () => {
        state.shifts = {};
        renderCalendar();
    });
    
    elements.modalShiftType.addEventListener('change', (e) => {
        elements.modalTimeConfig.style.display = (e.target.value !== 'none') ? 'block' : 'none';
    });
    
    elements.btnModalClose.addEventListener('click', closeDayModal);
    elements.btnModalSave.addEventListener('click', saveDayModal);
    
    elements.btnOpenClaim.addEventListener('click', () => {
        elements.claimSection.style.display = 'block';
        elements.actionButtonsContainer.style.display = 'none';
        
        // Clear text inside when re-opened just in case
        elements.claimText.value = '';
        elements.btnCopyClaim.style.display = 'none';
    });

    elements.btnOpenInfo.addEventListener('click', () => {
        elements.infoSection.style.display = 'block';
        elements.actionButtonsContainer.style.display = 'none';
        generateInfoText();
    });

    elements.btnCopyInfo.addEventListener('click', () => {
        navigator.clipboard.writeText(elements.infoText.value).then(() => {
            elements.toastNotification.classList.add('show');
            setTimeout(() => {
                elements.toastNotification.classList.remove('show');
            }, 3000);
        });
    });

    let simulateClicks = 0;
    elements.btnSimulatePayroll.addEventListener('click', () => {
        simulateClicks++;
        if (simulateClicks >= 5) {
            if (state.currentStep === 4) {
                goNext();
            }
            simulateClicks = 0;
        }
    });
    
    elements.btnDoSimulate.addEventListener('click', calculatePayrollSimulation);
    
    elements.btnGenerateClaim.addEventListener('click', generateClaimText);
    elements.btnCopyClaim.addEventListener('click', () => {
        navigator.clipboard.writeText(elements.claimText.value).then(() => {
            elements.toastNotification.classList.add('show');
            setTimeout(() => {
                elements.toastNotification.classList.remove('show');
            }, 3000);
        });
    });
}

// --- NAVIGATION LOGIC ---
function validateStep(step) {
    if (step === 1) {
        if (!state.employee.categoryKey || state.employee.trienio === '') {
            alert("Por favor, selecciona una categoría y antigüedad.");
            return false;
        }
    }
    if (step === 2) {
        if (!state.period.year || !state.period.month) {
            alert("Por favor, selecciona un mes.");
            return false;
        }
    }
    return true;
}

function goNext() {
    if (!validateStep(state.currentStep)) return;
    
    if (state.currentStep < state.totalSteps) {
        state.currentStep++;
        updateStepperUI();
        
        if (state.currentStep === 3) {
            renderCalendar();
        } else if (state.currentStep === 4) {
            calculateResults();
        }
    }
}

function goPrev() {
    if (state.currentStep > 1) {
        state.currentStep--;
        updateStepperUI();
    }
}

function updateStepperUI() {
    elements.btnPrev.style.visibility = state.currentStep === 1 ? 'hidden' : 'visible';
    elements.btnNext.textContent = state.currentStep === state.totalSteps ? 'Finalizar' : 'Siguiente';
    
    if (state.currentStep === state.totalSteps) {
        elements.btnNext.style.display = 'none';
    } else {
        elements.btnNext.style.display = 'inline-flex';
    }

    elements.steps.forEach((pane, index) => {
        if (index + 1 === state.currentStep) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });

    elements.indicators.forEach((ind, index) => {
        const stepNum = index + 1;
        ind.classList.remove('active', 'completed');
        if (stepNum < state.currentStep) {
            ind.classList.add('completed');
        } else if (stepNum === state.currentStep) {
            ind.classList.add('active');
        }
    });
    
    // Auto-scroll to top on step change
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- STEP 2: PERIOD ---
function handlePeriodChange() {
    const val = elements.inpMonth.value;
    if (!val) return;
    const [y, m] = val.split('-');
    state.period.year = parseInt(y, 10);
    state.period.month = parseInt(m, 10);
    
    state.period.dates = generatePayrollCycle(state.period.year, state.period.month);
    
    if (state.period.dates.length > 0) {
        const first = state.period.dates[0];
        const last = state.period.dates[state.period.dates.length - 1];
        
        elements.spanPeriodStart.textContent = first.toLocaleDateString('es-ES');
        elements.spanPeriodEnd.textContent = last.toLocaleDateString('es-ES');
        elements.divPeriodInfo.style.display = 'block';
    }
}

// --- STEP 3: CALENDAR ---
const DAYS_OF_WEEK = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function renderCalendar() {
    elements.calendarGrid.innerHTML = '';
    
    DAYS_OF_WEEK.forEach(d => {
        const div = document.createElement('div');
        div.className = 'calendar-day-header';
        div.textContent = d;
        elements.calendarGrid.appendChild(div);
    });
    
    if (state.period.dates.length === 0) return;
    
    const firstDate = state.period.dates[0];
    let startDay = firstDate.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    for (let i = 0; i < startDay; i++) {
        const div = document.createElement('div');
        elements.calendarGrid.appendChild(div);
    }
    
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    state.period.dates.forEach(date => {
        const dateStr = formatDate(date);
        const shift = state.shifts[dateStr];
        
        const div = document.createElement('div');
        div.className = 'calendar-day';
        if (shift && shift.type !== 'none') {
            div.classList.add('selected');
            div.classList.add(shift.type); // ordinaria o complementaria
        }
        
        const isSunday = date.getDay() === 0;
        const holType = getHolidayInfo(date, state.localHolidays);
        
        if (holType) {
            div.classList.add('festivo');
            div.classList.add(`festivo-${holType}`);
        } else if (isSunday) {
            div.style.color = shift && shift.type !== 'none' ? 'white' : 'var(--color-primary)';
        }
        
        div.innerHTML = `
            <span class="day-num">${date.getDate()}</span>
            <span class="day-month">${monthNames[date.getMonth()]}</span>
        `;
        
        if (shift && shift.type !== 'none') {
            if (shift.unidad) {
                const uni = document.createElement('span');
                uni.className = 'shift-unidad';
                uni.textContent = shift.unidad;
                div.appendChild(uni);
            }
        }
        
        div.addEventListener('click', () => {
            if (elements.togglePaintMode.checked) {
                // Paint mode
                const time = elements.inpDefaultTime.value || '07:00';
                const dur = parseInt(elements.inpDefaultDuration.value, 10) || 12;
                const unidad = elements.inpDefaultUnidad.value.trim();
                
                if (shift && shift.type !== 'none') {
                    delete state.shifts[dateStr];
                } else {
                    if (!unidad) {
                        alert('Debes introducir el nombre de la Unidad antes de pintar el turno.');
                        return;
                    }
                    state.shifts[dateStr] = {
                        type: 'ordinaria', // By default paint mode creates ordinary shifts
                        time: time,
                        duration: dur,
                        unidad: unidad,
                        prolongation: 0,
                        diets: 0
                    };
                }
                renderCalendar();
            } else {
                openDayModal(dateStr, date);
            }
        });
        elements.calendarGrid.appendChild(div);
    });
}

// --- MODAL (DAY ADJUSTMENTS) ---
function openDayModal(dateStr, dateObj) {
    currentEditingDate = dateStr;
    const shift = state.shifts[dateStr] || { type: 'none', unidad: '', time: '07:00', duration: 12, prolongation: 0, diets: 0 };
    
    elements.modalTitle.textContent = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    
    elements.modalLocalHoliday.checked = !!state.localHolidays[dateStr];
    
    elements.modalShiftType.value = shift.type;
    elements.modalTimeConfig.style.display = (shift.type !== 'none') ? 'block' : 'none';
    
    elements.modalUnidad.value = shift.unidad || '';
    elements.modalTime.value = shift.time;
    elements.modalDuration.value = shift.duration;
    elements.modalProlongation.value = shift.prolongation;
    elements.modalDiets.value = shift.diets;
    
    elements.modalOverlay.classList.add('open');
}

function closeDayModal() {
    elements.modalOverlay.classList.remove('open');
    currentEditingDate = null;
}

function saveDayModal() {
    if (!currentEditingDate) return;
    
    if (elements.modalLocalHoliday.checked) {
        state.localHolidays[currentEditingDate] = true;
    } else {
        delete state.localHolidays[currentEditingDate];
    }
    
    const type = elements.modalShiftType.value;
    const unidad = elements.modalUnidad.value.trim();
    
    if (type !== 'none' && !unidad) {
        alert('El campo Unidad es obligatorio para guardar un turno.');
        return;
    }
    
    if (type === 'none') {
        delete state.shifts[currentEditingDate];
    } else {
        state.shifts[currentEditingDate] = {
            type: type,
            unidad: unidad,
            time: elements.modalTime.value,
            duration: parseInt(elements.modalDuration.value, 10),
            prolongation: parseInt(elements.modalProlongation.value, 10),
            diets: parseInt(elements.modalDiets.value, 10)
        };
    }
    
    closeDayModal();
    renderCalendar();
}

// --- STEP 4: RESULTS ---
function calculateResults() {
    let totals = {
        ord_hours: 0,
        comp_hours: 0,
        night_hours: 0,
        sunday_hours: 0,
        f_local_hours: 0,
        f_especial_hours: 0,
        f_no_local_hours: 0,
        prolongation_mins: 0,
        diets: 0
    };
    
    // Accumulate
    for (const [dateStr, shift] of Object.entries(state.shifts)) {
        if (shift.type === 'none') continue;
        
        if (shift.type === 'ordinaria') totals.ord_hours += shift.duration;
        if (shift.type === 'complementaria') totals.comp_hours += shift.duration;
        
        totals.prolongation_mins += shift.prolongation;
        totals.diets += shift.diets;
        
        const prices = {
            domingo: data.conceptos_comunes.precio_domingo,
            local: data.conceptos_comunes.precio_festivo_local,
            especial: data.conceptos_comunes.precio_festivo_especial,
            no_local: data.conceptos_comunes.precio_festivo_no_local
        };
        const vars = calculateShiftVariables(dateStr, shift.time, shift.duration, prices, state.localHolidays);
        totals.night_hours += vars.nightHours;
        totals.sunday_hours += vars.sundayHours;
        totals.f_local_hours += vars.fLocalHours;
        totals.f_especial_hours += vars.fEspecialHours;
        totals.f_no_local_hours += vars.fNoLocalHours;
    }
    
    const p_hora = getPriceHour(state.employee.categoryKey, state.employee.trienio);
    const p_nocturnidad = data.conceptos_comunes.precio_nocturnidad;
    const p_domingo = data.conceptos_comunes.precio_domingo;
    const p_dieta = data.conceptos_comunes.precio_dieta;
    
    const prolongation_hours = totals.prolongation_mins / 60;
    
    const f_comp = totals.comp_hours * p_hora; 
    const f_prolong = prolongation_hours * p_hora;
    const f_night = totals.night_hours * p_nocturnidad;
    const f_sunday = totals.sunday_hours * p_domingo;
    const f_diets = totals.diets * p_dieta;
    
    const prices = {
        local: data.conceptos_comunes.precio_festivo_local,
        especial: data.conceptos_comunes.precio_festivo_especial,
        no_local: data.conceptos_comunes.precio_festivo_no_local
    };
    const f_flocal = totals.f_local_hours * prices.local;
    const f_fespecial = totals.f_especial_hours * prices.especial;
    const f_fnolocal = totals.f_no_local_hours * prices.no_local;
    
    const subTotalVariables = f_comp + f_prolong + f_night + f_sunday + f_flocal + f_fespecial + f_fnolocal + f_diets;
    const aCuentaConvenio = subTotalVariables * 0.0404;
    const totalFin = subTotalVariables + aCuentaConvenio;
    
    const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
    const fmt = num => Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
    
    let html = `
        <div class="results-card">
            <h3 style="margin-bottom:1rem; border-bottom:1px solid #eee; padding-bottom:0.5rem;">Desglose de Conceptos</h3>
    `;
    
    if (totals.comp_hours > 0) {
        html += `
            <div class="result-row">
                <span>Horas Complementarias (${fmt(totals.comp_hours)} h)</span>
                <strong>${eur.format(f_comp)}</strong>
            </div>`;
    }
    
    if (totals.prolongation_mins > 0) {
        html += `
            <div class="result-row">
                <span>Prolongación (${fmt(totals.prolongation_mins)} min)</span>
                <strong>${eur.format(f_prolong)}</strong>
            </div>`;
    }
    
    if (totals.night_hours > 0) {
        html += `
            <div class="result-row">
                <span>Nocturnidad (${fmt(totals.night_hours)} h)</span>
                <strong>${eur.format(f_night)}</strong>
            </div>`;
    }
    
    if (totals.sunday_hours > 0) {
        html += `
            <div class="result-row">
                <span>Domingos (${fmt(totals.sunday_hours)} h)</span>
                <strong>${eur.format(f_sunday)}</strong>
            </div>`;
    }
    
    if (totals.diets > 0) {
        html += `
            <div class="result-row">
                <span>Dietas (${fmt(totals.diets)} uds)</span>
                <strong>${eur.format(f_diets)}</strong>
            </div>`;
    }
    
    if (totals.f_local_hours > 0) {
        html += `<div class="result-row"><span>Festivo Local (${fmt(totals.f_local_hours)} h)</span><strong>${eur.format(f_flocal)}</strong></div>`;
    }
    if (totals.f_especial_hours > 0) {
        html += `<div class="result-row"><span>Festivo Especial (${fmt(totals.f_especial_hours)} h)</span><strong>${eur.format(f_fespecial)}</strong></div>`;
    }
    if (totals.f_no_local_hours > 0) {
        html += `<div class="result-row"><span>Festivo No Local (${fmt(totals.f_no_local_hours)} h)</span><strong>${eur.format(f_fnolocal)}</strong></div>`;
    }
    
    if (aCuentaConvenio > 0) {
        html += `
            <div class="result-row" style="color: var(--color-primary); font-weight: 600;">
                <span>A cuenta convenio (4.04%)</span>
                <strong>${eur.format(aCuentaConvenio)}</strong>
            </div>`;
    }
            
    html += `
            <div class="result-total">
                ${eur.format(totalFin)}
            </div>
        </div>
        <p style="font-size:0.8rem; color:var(--color-text-muted); text-align:center;">
            * Nota: Las horas ordinarias de la cuadrícula (${totals.ord_hours} h) no suman importe extra aquí al estar incluidas en el salario base.
        </p>
    `;
    
    elements.resultsContainer.innerHTML = html;
    
    lastCalculatedTotals = totals;
}

function generateClaimText() {
    if (!lastCalculatedTotals) return;
    
    const sortedDates = Object.keys(state.shifts).sort();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    let ordText = [];
    let compText = [];
    
    sortedDates.forEach(dateStr => {
        const shift = state.shifts[dateStr];
        if (shift.type === 'none') return;
        
        const d = new Date(dateStr);
        const formatStr = `${d.getDate()}/${monthNames[d.getMonth()]} ${shift.unidad || ''} ${shift.duration}h`;
        
        if (shift.type === 'ordinaria') {
            ordText.push(formatStr.trim());
        } else if (shift.type === 'complementaria') {
            compText.push(formatStr.trim());
        }
    });
    
    const mesSeleccionadoParts = elements.inpMonth.value.split('-');
    const monthNamesFull = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesTexto = mesSeleccionadoParts.length === 2 ? `${monthNamesFull[parseInt(mesSeleccionadoParts[1], 10) - 1]} de ${mesSeleccionadoParts[0]}` : elements.inpMonth.value;
    
    const totals = lastCalculatedTotals;
    
    const fmt = num => Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
    
    let genArr = [];
    if (totals.comp_hours > 0) genArr.push(`${fmt(totals.comp_hours)} horas complementarias`);
    if (totals.night_hours > 0) genArr.push(`${fmt(totals.night_hours)} h nocturnidad`);
    if (totals.sunday_hours > 0) genArr.push(`${fmt(totals.sunday_hours)} horas de domingos`);
    if (totals.f_local_hours > 0) genArr.push(`${fmt(totals.f_local_hours)} horas de festivos locales`);
    if (totals.f_especial_hours > 0) genArr.push(`${fmt(totals.f_especial_hours)} horas de festivos especiales`);
    if (totals.f_no_local_hours > 0) genArr.push(`${fmt(totals.f_no_local_hours)} horas de festivos no locales`);
    if (totals.prolongation_mins > 0) genArr.push(`${fmt(totals.prolongation_mins)} minutos de prolongación`);
    if (totals.diets > 0) genArr.push(`${fmt(totals.diets)} dietas`);
    
    const abonadoComp = parseFloat(elements.claimAbonadoComp.value) || 0;
    const abonadoProlong = parseFloat(elements.claimAbonadoProlong.value) || 0;
    const abonadoNight = parseFloat(elements.claimAbonadoNight.value) || 0;
    const abonadoSunday = parseFloat(elements.claimAbonadoSunday.value) || 0;
    const abonadoFLocal = parseFloat(elements.claimAbonadoFLocal.value) || 0;
    const abonadoFEspecial = parseFloat(elements.claimAbonadoFEspecial.value) || 0;
    const abonadoFEstatal = parseFloat(elements.claimAbonadoFEstatal.value) || 0;
    const abonadoDietas = parseFloat(elements.claimAbonadoDietas.value) || 0;
    
    let abnArr = [];
    if (abonadoComp > 0) abnArr.push(`${fmt(abonadoComp)} horas complementarias`);
    if (abonadoNight > 0) abnArr.push(`${fmt(abonadoNight)} h nocturnidad`);
    if (abonadoSunday > 0) abnArr.push(`${fmt(abonadoSunday)} horas de domingos`);
    if (abonadoFLocal > 0) abnArr.push(`${fmt(abonadoFLocal)} horas de festivos locales`);
    if (abonadoFEspecial > 0) abnArr.push(`${fmt(abonadoFEspecial)} horas de festivos especiales`);
    if (abonadoFEstatal > 0) abnArr.push(`${fmt(abonadoFEstatal)} horas de festivos no locales`);
    if (abonadoProlong > 0) abnArr.push(`${fmt(abonadoProlong)} minutos de prolongación`);
    if (abonadoDietas > 0) abnArr.push(`${fmt(abonadoDietas)} dietas`);
    
    let text = `Hola, no he cobrado de forma correcta las variables de la nómina de ${mesTexto}.\n\n`;
    
    if (ordText.length > 0) {
        text += `He trabajado de jornada los siguientes días: ${ordText.join(', ')}.\n`;
    }
    
    if (compText.length > 0) {
        text += `Y los siguientes días de jornada complementaria: ${compText.join(', ')}.\n`;
    }
    
    if (ordText.length > 0 || compText.length > 0) text += '\n';
    
    if (genArr.length > 0) {
        text += `Generando: ${genArr.join(', ')}.\n\n`;
    }
    
    if (abnArr.length > 0) {
        text += `Y solo se me han abonado: ${abnArr.join(', ')}.`;
    } else {
        text += `Y no se me ha abonado ningún concepto variable.`;
    }
    
    elements.claimText.value = text.trim();
    elements.btnCopyClaim.style.display = 'block';
}

function generateInfoText() {
    if (!lastCalculatedTotals) return;
    
    const sortedDates = Object.keys(state.shifts).sort();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    let ordText = [];
    let compText = [];
    
    sortedDates.forEach(dateStr => {
        const shift = state.shifts[dateStr];
        if (shift.type === 'none') return;
        
        const d = new Date(dateStr);
        const formatStr = `${d.getDate()}/${monthNames[d.getMonth()]} ${shift.unidad || ''} ${shift.duration}h`;
        
        if (shift.type === 'ordinaria') {
            ordText.push(formatStr.trim());
        } else if (shift.type === 'complementaria') {
            compText.push(formatStr.trim());
        }
    });
    
    const mesSeleccionadoParts = elements.inpMonth.value.split('-');
    const monthNamesFull = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const mesTexto = mesSeleccionadoParts.length === 2 ? `${monthNamesFull[parseInt(mesSeleccionadoParts[1], 10) - 1]}` : elements.inpMonth.value;
    
    const totals = lastCalculatedTotals;
    
    const fmt = num => Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
    
    let genArr = [];
    if (totals.comp_hours > 0) genArr.push(`${fmt(totals.comp_hours)} horas complementarias`);
    if (totals.night_hours > 0) genArr.push(`${fmt(totals.night_hours)} h nocturnidad`);
    if (totals.sunday_hours > 0) genArr.push(`${fmt(totals.sunday_hours)} horas de domingos`);
    if (totals.f_local_hours > 0) genArr.push(`${fmt(totals.f_local_hours)} horas de festivos locales`);
    if (totals.f_especial_hours > 0) genArr.push(`${fmt(totals.f_especial_hours)} horas de festivos especiales`);
    if (totals.f_no_local_hours > 0) genArr.push(`${fmt(totals.f_no_local_hours)} horas de festivos no locales`);
    if (totals.prolongation_mins > 0) genArr.push(`${fmt(totals.prolongation_mins)} minutos de prolongación`);
    if (totals.diets > 0) genArr.push(`${fmt(totals.diets)} dietas`);
    
    let text = `Hola, informo de las guardias y variables generadas este mes de ${mesTexto}.\n\n`;
    
    if (ordText.length > 0) {
        text += `He trabajado de jornada los siguientes días: ${ordText.join(', ')}.\n`;
    }
    
    if (compText.length > 0) {
        text += `Y los siguientes días de jornada complementaria: ${compText.join(', ')}.\n`;
    }
    
    if (ordText.length > 0 || compText.length > 0) text += '\n';
    
    if (genArr.length > 0) {
        text += `Generando: ${genArr.join(', ')}.`;
    }
    
    elements.infoText.value = text.trim();
}

function calculatePayrollSimulation() {
    const irpfPercent = parseFloat(elements.simIrpf.value) || 0;
    const isProrrateada = elements.simPagasExtra.checked;
    
    const catData = getCategoryData(state.employee.categoryKey);
    if (!catData) {
        alert("Faltan datos de empleado para simular. Vuelve al Paso 1.");
        return;
    }
    
    // --- 1. FIJOS ---
    const salarioBase = catData.salario_base || 0;
    const compFormacion = catData.comp_formacion || 0;
    const antiguedad = catData.trienios[state.employee.trienio] || 0;
    const plusAsistencia = data.conceptos_comunes.plus_asistencia_puntualidad || 0;
    
    const basePagaExtra = salarioBase + compFormacion + antiguedad;
    const fijosSuma = basePagaExtra + plusAsistencia;
    
    // --- 2. VARIABLES ---
    let variablesSuma = 0;
    let prolongationSuma = 0;
    let devengosObj = {};
    
    if (lastCalculatedTotals) {
        const t = lastCalculatedTotals;
        const p_hora = getPriceHour(state.employee.categoryKey, state.employee.trienio);
        
        const v_comp = t.comp_hours * p_hora;
        const v_prolong = (t.prolongation_mins / 60) * p_hora;
        const v_night = t.night_hours * data.conceptos_comunes.precio_nocturnidad;
        const v_sunday = t.sunday_hours * data.conceptos_comunes.precio_domingo;
        const v_flocal = t.f_local_hours * data.conceptos_comunes.precio_festivo_local;
        const v_fespecial = t.f_especial_hours * data.conceptos_comunes.precio_festivo_especial;
        const v_fnolocal = t.f_no_local_hours * data.conceptos_comunes.precio_festivo_no_local;
        const v_diets = t.diets * data.conceptos_comunes.precio_dieta;
        
        prolongationSuma = v_prolong;
        
        if(v_comp > 0) devengosObj['H. Complementarias'] = v_comp;
        if(v_prolong > 0) devengosObj['Prolongación Jornada'] = v_prolong;
        if(v_night > 0) devengosObj['Nocturnidad'] = v_night;
        if(v_sunday > 0) devengosObj['Domingos'] = v_sunday;
        if(v_flocal > 0) devengosObj['Festivos Locales'] = v_flocal;
        if(v_fespecial > 0) devengosObj['Festivos Especiales'] = v_fespecial;
        if(v_fnolocal > 0) devengosObj['Festivos No Locales'] = v_fnolocal;
        if(v_diets > 0) devengosObj['Dietas'] = v_diets;
        
        variablesSuma = v_comp + v_prolong + v_night + v_sunday + v_flocal + v_fespecial + v_fnolocal + v_diets;
    }
    
    // --- 3. 4.04% ---
    const sumaParaAcuenta = fijosSuma + variablesSuma;
    const aCuentaConvenio = sumaParaAcuenta * 0.0404;
    
    // --- 4. PAGAS EXTRAS ---
    const prorrataUnaPaga = basePagaExtra * 1.0404 / 12;
    const prorrataMensualPagasExtras = prorrataUnaPaga * 2;
    
    let totalDevengado = fijosSuma + variablesSuma + aCuentaConvenio;
    
    if (isProrrateada) {
        devengosObj['PP Verano (Prorrateada)'] = prorrataUnaPaga;
        devengosObj['PP Invierno (Prorrateada)'] = prorrataUnaPaga;
        totalDevengado += prorrataMensualPagasExtras;
    }
    
    // --- 5. BASES DE COTIZACIÓN ---
    const baseIRPF = totalDevengado;
    const baseCC = totalDevengado - prolongationSuma + (isProrrateada ? 0 : prorrataMensualPagasExtras);
    const baseAT = totalDevengado + (isProrrateada ? 0 : prorrataMensualPagasExtras);
    
    // --- 6. DEDUCCIONES ---
    const dedIRPF = baseIRPF * (irpfPercent / 100);
    const dedCC = baseCC * 0.047;
    const dedMEI = baseCC * 0.0015;
    const dedFP = baseAT * 0.0010;
    const dedDesempleo = baseAT * 0.0155;
    
    const totalDeducciones = dedIRPF + dedCC + dedMEI + dedFP + dedDesempleo;
    const liquido = totalDevengado - totalDeducciones;
    
    // --- 7. HTML RENDER ---
    const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
    
    let devengosHTML = `
        <div style="background: var(--color-surface); padding: 1rem; border-radius: 6px; border: 1px solid var(--color-border); margin-bottom: 1rem;">
            <h3 style="color: var(--color-primary); font-size: 1.1rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem;">Devengos</h3>
            <div class="result-row"><span>Salario Base</span><strong>${eur.format(salarioBase)}</strong></div>
            <div class="result-row"><span>Comp. Formación</span><strong>${eur.format(compFormacion)}</strong></div>
            <div class="result-row"><span>Antigüedad</span><strong>${eur.format(antiguedad)}</strong></div>
            <div class="result-row"><span>Plus Asistencia y Punt.</span><strong>${eur.format(plusAsistencia)}</strong></div>
    `;
    
    for (const [name, val] of Object.entries(devengosObj)) {
        devengosHTML += `<div class="result-row"><span>${name}</span><strong>${eur.format(val)}</strong></div>`;
    }
    
    devengosHTML += `
            <div class="result-row"><span>A cuenta convenio (4.04%)</span><strong>${eur.format(aCuentaConvenio)}</strong></div>
            <div class="result-row" style="border-top: 2px solid var(--color-border); margin-top: 0.5rem; padding-top: 0.5rem;">
                <span style="font-weight: 700;">TOTAL DEVENGADO</span><strong style="color: var(--color-primary);">${eur.format(totalDevengado)}</strong>
            </div>
        </div>
    `;
    
    let basesHTML = `
        <div style="background: var(--color-surface); padding: 1rem; border-radius: 6px; border: 1px solid var(--color-border); margin-bottom: 1rem;">
            <h3 style="color: var(--color-text); font-size: 1.1rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem;">Bases de Cotización</h3>
            <div class="result-row"><span>Prorrata Pagas Extras</span><strong>${eur.format(prorrataMensualPagasExtras)}</strong></div>
            <div class="result-row"><span>Base IRPF</span><strong>${eur.format(baseIRPF)}</strong></div>
            <div class="result-row"><span>Base CC (Contingencias Comunes)</span><strong>${eur.format(baseCC)}</strong></div>
            <div class="result-row"><span>Base AT y Desempleo</span><strong>${eur.format(baseAT)}</strong></div>
        </div>
    `;
    
    let deduccionesHTML = `
        <div style="background: var(--color-surface); padding: 1rem; border-radius: 6px; border: 1px solid var(--color-border); margin-bottom: 1rem;">
            <h3 style="color: var(--color-text-muted); font-size: 1.1rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem;">Retenciones</h3>
            <div class="result-row"><span>IRPF (${irpfPercent}%)</span><strong>-${eur.format(dedIRPF)}</strong></div>
            <div class="result-row"><span>C. Comunes (4.7%)</span><strong>-${eur.format(dedCC)}</strong></div>
            <div class="result-row"><span>MEI (0.15%)</span><strong>-${eur.format(dedMEI)}</strong></div>
            <div class="result-row"><span>Formación Prof. (0.10%)</span><strong>-${eur.format(dedFP)}</strong></div>
            <div class="result-row"><span>Desempleo (1.55%)</span><strong>-${eur.format(dedDesempleo)}</strong></div>
            <div class="result-row" style="border-top: 2px solid var(--color-border); margin-top: 0.5rem; padding-top: 0.5rem;">
                <span style="font-weight: 700;">TOTAL DEDUCCIONES</span><strong>-${eur.format(totalDeducciones)}</strong>
            </div>
        </div>
    `;
    
    let liquidoHTML = `
        <div style="background: var(--color-primary-light); padding: 1.5rem; border-radius: 6px; border: 2px solid var(--color-primary); text-align: center; margin-bottom: 1rem;">
            <h3 style="color: var(--color-primary); font-size: 1.2rem; margin-bottom: 0.5rem;">Líquido a Percibir</h3>
            <strong style="font-size: 2.2rem; color: var(--color-text); font-weight: 900;">${eur.format(liquido)}</strong>
        </div>
    `;
    
    let actionsHTML = `
        <button type="button" class="btn btn-outline" style="width: 100%; margin-top: 1.5rem;" onclick="document.getElementById('sim-results').style.display='none'; document.getElementById('sim-form-container').style.display='block';">Ajustar parámetros</button>
    `;
    
    // Ordered as requested: Resultado, Devengos, Retenciones, Bases
    elements.simResults.innerHTML = liquidoHTML + devengosHTML + deduccionesHTML + basesHTML + actionsHTML;
    
    // Hide form and show results
    document.getElementById('sim-form-container').style.display = 'none';
    elements.simResults.style.display = 'block';
    
    elements.simResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Override native alert with custom modal
(function() {
    const originalAlert = window.alert;
    window.alert = function(message) {
        const modal = document.getElementById('custom-alert-modal');
        const msgEl = document.getElementById('custom-alert-message');
        if (modal && msgEl) {
            msgEl.textContent = message;
            modal.classList.add('open');
        } else {
            originalAlert(message);
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => {
        const modal = document.getElementById('custom-alert-modal');
        const closeBtn = document.getElementById('btn-custom-alert-close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('open');
            });
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('open');
                }
            });
        }
    });
})();

// Bootstrap
document.addEventListener('DOMContentLoaded', init);
