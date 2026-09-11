import { data, getCategoryData, getPriceHour } from './data.js';

export function getEasterSunday(year) {
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

export function getHolidayInfo(dateObj, localHolidaysObj) {
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

export function calculateShiftVariables(dateStr, timeStr, durationHours, prices, localHolidaysObj) {
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

export function generatePayrollCycle(year, month) {
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

export function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function calculateTotals(shifts, localHolidays) {
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
    
    for (const [dateStr, shift] of Object.entries(shifts)) {
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
        const vars = calculateShiftVariables(dateStr, shift.time, shift.duration, prices, localHolidays);
        totals.night_hours += vars.nightHours;
        totals.sunday_hours += vars.sundayHours;
        totals.f_local_hours += vars.fLocalHours;
        totals.f_especial_hours += vars.fEspecialHours;
        totals.f_no_local_hours += vars.fNoLocalHours;
    }
    return totals;
}
