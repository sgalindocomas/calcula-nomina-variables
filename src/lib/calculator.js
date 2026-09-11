/**
 * Calcula las variables de nocturnidad y horas en domingo para un turno dado.
 * @param {string} dateStr - Fecha del turno en formato 'YYYY-MM-DD'
 * @param {string} timeStr - Hora de inicio en formato 'HH:mm'
 * @param {number} durationHours - Duración del turno en horas
 * @returns {Object} - { nightHours, sundayHours }
 */
export function calculateShiftVariables(dateStr, timeStr, durationHours) {
    if (!timeStr || !durationHours || durationHours <= 0) {
        return { nightHours: 0, sundayHours: 0 };
    }
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const start = new Date(dateStr);
    start.setHours(hours, minutes, 0, 0);
    
    const end = new Date(start.getTime() + durationHours * 3600000);
    
    let nightHours = 0;
    let sundayHours = 0;
    
    // Iteramos minuto a minuto para máxima precisión y simplicidad
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

/**
 * Genera las fechas del ciclo de nómina (Día 16 del mes anterior al día 15 del mes actual)
 * @param {number} year - Año
 * @param {number} month - Mes (1-12)
 * @returns {Array} - Array de objetos Date
 */
export function generatePayrollCycle(year, month) {
    const dates = [];
    
    // Mes anterior (restamos 1 a month, ya que en JS los meses son 0-11)
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

/**
 * Formatea una fecha a 'YYYY-MM-DD' localmente.
 */
export function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
