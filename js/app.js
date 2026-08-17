// --- DATA MODULE ---
const data = {
    conceptos_comunes: { 
        plus_asistencia_puntualidad: 126.40,
        precio_nocturnidad: 0.83,
        precio_domingo: 0.61,
        precio_festivo: 3.11,
        precio_dieta: 10.00 // Placeholder, can be adjusted in future
    },
    categorias: {
        tes_conductor: {
            nombre: "TES Conductor",
            salario_base: 1622.32, 
            comp_formacion: 279.80,
            trienios: { "0": 0.00, "1": 27.48, "2": 54.95, "3": 82.42, "4": 109.88, "5": 137.35, "6": 164.82, "7": 192.29 },
            precio_hora: { "0": 16.29, "1": 16.52, "2": 16.76, "3": 16.99, "4": 17.23, "5": 17.46, "6": 17.70, "7": 17.93 }
        },
        tes_ayudante: {
            nombre: "TES Asistent/Portalliteras",
            salario_base: 1512.13, 
            comp_formacion: 260.36,
            trienios: { "0": 0.00, "1": 23.93, "2": 47.88, "3": 71.80, "4": 95.75, "5": 119.68, "6": 143.62, "7": 167.56 },
            precio_hora: { "0": 15.18, "1": 15.38, "2": 15.59, "3": 15.79, "4": 16.00, "5": 16.20, "6": 16.41, "7": 16.61 }
        },
        tes_portalliteras: {
            nombre: "TES Portalliteras",
            salario_base: 1467.04, 
            comp_formacion: 252.39,
            trienios: { "0": 0.00, "1": 22.50, "2": 45.00, "3": 67.51, "4": 90.00, "5": 112.51, "6": 135.00, "7": 157.50 },
            precio_hora: { "0": 14.72, "1": 14.92, "2": 15.11, "3": 15.30, "4": 15.49, "5": 15.69, "6": 15.88, "7": 16.07 }
        }
    }
};

function getCategoryData(categoryKey) {
    return data.categorias[categoryKey] || null;
}

function getPriceHour(categoryKey, trienio) {
    const cat = getCategoryData(categoryKey);
    return cat ? cat.precio_hora[trienio] || 0 : 0;
}

// --- CALCULATOR MODULE ---
function calculateShiftVariables(dateStr, timeStr, durationHours) {
    if (!timeStr || !durationHours || durationHours <= 0) {
        return { nightHours: 0, sundayHours: 0 };
    }
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const start = new Date(dateStr);
    start.setHours(hours, minutes, 0, 0);
    
    const end = new Date(start.getTime() + durationHours * 3600000);
    
    let nightHours = 0;
    let sundayHours = 0;
    
    const stepMs = 60000; // 1 minuto
    let current = new Date(start.getTime());
    
    while (current < end) {
        const h = current.getHours();
        const day = current.getDay(); // 0 es Domingo
        
        // Nocturnidad: 22:00 a 06:00
        if (h >= 22 || h < 6) {
            nightHours += 1/60;
        }
        
        // Domingos: de 00:00 a 24:00 del domingo
        if (day === 0) {
            sundayHours += 1/60;
        }
        
        current.setTime(current.getTime() + stepMs);
    }
    
    return {
        nightHours: Math.round(nightHours * 100) / 100,
        sundayHours: Math.round(sundayHours * 100) / 100
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
    totalSteps: 4,
    employee: {
        categoryKey: '',
        trienio: ''
    },
    period: {
        year: null,
        month: null,
        dates: []
    },
    shifts: {}
};

// --- DOM ELEMENTS ---
const elements = {
    btnNext: document.getElementById('btn-next'),
    btnPrev: document.getElementById('btn-prev'),
    steps: [
        document.getElementById('step-1'),
        document.getElementById('step-2'),
        document.getElementById('step-3'),
        document.getElementById('step-4')
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
    claimSection: document.getElementById('claim-section'),
    claimAbonadoComp: document.getElementById('claim-abonado-comp'),
    claimAbonadoProlong: document.getElementById('claim-abonado-prolong'),
    claimAbonadoNight: document.getElementById('claim-abonado-night'),
    claimAbonadoSunday: document.getElementById('claim-abonado-sunday'),
    claimAbonadoFestivo: document.getElementById('claim-abonado-festivo'),
    claimAbonadoDietas: document.getElementById('claim-abonado-dietas'),
    btnGenerateClaim: document.getElementById('btn-generate-claim'),
    btnCopyClaim: document.getElementById('btn-copy-claim'),
    claimText: document.getElementById('claim-text')
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
        elements.btnOpenClaim.style.display = 'none';
        
        // Clear text inside when re-opened just in case
        elements.claimText.value = '';
        elements.btnCopyClaim.style.display = 'none';
    });
    
    elements.btnGenerateClaim.addEventListener('click', generateClaimText);
    elements.btnCopyClaim.addEventListener('click', () => {
        navigator.clipboard.writeText(elements.claimText.value).then(() => {
            alert('Texto copiado al portapapeles');
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
        }
        
        const isSunday = date.getDay() === 0;
        if (isSunday) div.style.color = shift && shift.type !== 'none' ? 'white' : 'var(--color-primary)';
        
        div.innerHTML = `
            <span class="day-num">${date.getDate()}</span>
            <span class="day-month">${monthNames[date.getMonth()]}</span>
        `;
        
        if (shift && shift.type !== 'none') {
            const ind = document.createElement('span');
            ind.className = 'shift-indicator';
            ind.textContent = shift.type === 'ordinaria' ? 'Ord' : 'Comp';
            div.appendChild(ind);
            
            if (shift.unidad) {
                const uni = document.createElement('span');
                uni.className = 'shift-unidad';
                uni.textContent = shift.unidad;
                if (isSunday) uni.style.color = '#fff';
                div.appendChild(uni);
            }
        }
        
        div.addEventListener('click', () => {
            if (elements.togglePaintMode.checked) {
                // Paint mode
                const time = elements.inpDefaultTime.value || '07:00';
                const dur = parseInt(elements.inpDefaultDuration.value, 10) || 12;
                const unidad = elements.inpDefaultUnidad.value || '';
                
                // Toggle off if already identically configured? Or just overwrite?
                // Let's just assign/overwrite. If user wants to delete, they can open modal.
                // Or maybe if it's already assigned with paint mode, we delete it?
                // Overwriting is simpler and more predictable for painting.
                state.shifts[dateStr] = {
                    type: 'ordinaria',
                    time: time,
                    duration: dur,
                    unidad: unidad,
                    prolongation: 0,
                    diets: 0
                };
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
    
    const type = elements.modalShiftType.value;
    if (type === 'none') {
        delete state.shifts[currentEditingDate];
    } else {
        state.shifts[currentEditingDate] = {
            type: type,
            unidad: elements.modalUnidad.value,
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
        
        const vars = calculateShiftVariables(dateStr, shift.time, shift.duration);
        totals.night_hours += vars.nightHours;
        totals.sunday_hours += vars.sundayHours;
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
    
    const totalFin = f_comp + f_prolong + f_night + f_sunday + f_diets;
    
    const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
    
    let html = `
        <div class="results-card">
            <h3 style="margin-bottom:1rem; border-bottom:1px solid #eee; padding-bottom:0.5rem;">Desglose de Conceptos</h3>
    `;
    
    if (totals.comp_hours > 0) {
        html += `
            <div class="result-row">
                <span>Horas Complementarias (${totals.comp_hours} h)</span>
                <strong>${eur.format(f_comp)}</strong>
            </div>`;
    }
    
    if (totals.prolongation_mins > 0) {
        html += `
            <div class="result-row">
                <span>Prolongación (${totals.prolongation_mins} min)</span>
                <strong>${eur.format(f_prolong)}</strong>
            </div>`;
    }
    
    if (totals.night_hours > 0) {
        html += `
            <div class="result-row">
                <span>Nocturnidad (${totals.night_hours.toFixed(2)} h)</span>
                <strong>${eur.format(f_night)}</strong>
            </div>`;
    }
    
    if (totals.sunday_hours > 0) {
        html += `
            <div class="result-row">
                <span>Domingos (${totals.sunday_hours.toFixed(2)} h)</span>
                <strong>${eur.format(f_sunday)}</strong>
            </div>`;
    }
    
    if (totals.diets > 0) {
        html += `
            <div class="result-row">
                <span>Dietas (${totals.diets} uds)</span>
                <strong>${eur.format(f_diets)}</strong>
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
    if (totals.prolongation_mins > 0) genArr.push(`${fmt(totals.prolongation_mins)} minutos de prolongación`);
    if (totals.diets > 0) genArr.push(`${fmt(totals.diets)} dietas`);
    
    const abonadoComp = parseFloat(elements.claimAbonadoComp.value) || 0;
    const abonadoProlong = parseFloat(elements.claimAbonadoProlong.value) || 0;
    const abonadoNight = parseFloat(elements.claimAbonadoNight.value) || 0;
    const abonadoSunday = parseFloat(elements.claimAbonadoSunday.value) || 0;
    const abonadoFestivo = parseFloat(elements.claimAbonadoFestivo.value) || 0;
    const abonadoDietas = parseFloat(elements.claimAbonadoDietas.value) || 0;
    
    let abnArr = [];
    if (abonadoComp > 0) abnArr.push(`${fmt(abonadoComp)} horas complementarias`);
    if (abonadoNight > 0) abnArr.push(`${fmt(abonadoNight)} h nocturnidad`);
    if (abonadoSunday > 0) abnArr.push(`${fmt(abonadoSunday)} horas de domingos`);
    if (abonadoFestivo > 0) abnArr.push(`${fmt(abonadoFestivo)} horas de festivos`);
    if (abonadoProlong > 0) abnArr.push(`${fmt(abonadoProlong)} minutos de prolongación`);
    if (abonadoDietas > 0) abnArr.push(`${fmt(abonadoDietas)} dietas`);
    
    let text = `Hola, no he cobrado las variables de la nómina de ${mesTexto}.\n\n`;
    
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

// Bootstrap
document.addEventListener('DOMContentLoaded', init);
