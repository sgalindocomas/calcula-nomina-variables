const data = {
    conceptos_comunes: { 
        plus_asistencia_puntualidad: 126.40,
        precio_domingo: 0.61,
        precio_festivo_local: 2.49,
        precio_festivo_no_local: 3.11,
        precio_festivo_especial: 6.24,
        precio_dieta: 12.47 
    },
    categorias: {
        tes_conductor: {
            nombre: "TES Conductor",
            salario_base: 1622.32, 
            comp_formacion: 279.80,
            precio_nocturnidad: 0.83,
            trienios: { "0": 0.00, "1": 27.48, "2": 54.95, "3": 82.42, "4": 109.88, "5": 137.35, "6": 164.82, "7": 192.29 },
            precio_hora: { "0": 16.29, "1": 16.52, "2": 16.76, "3": 16.99, "4": 17.23, "5": 17.46, "6": 17.70, "7": 17.93 }
        },
        tes_ayudante: {
            nombre: "TES Ayudante",
            salario_base: 1512.13, 
            comp_formacion: 260.36,
            precio_nocturnidad: 0.71,
            trienios: { "0": 0.00, "1": 23.93, "2": 47.88, "3": 71.80, "4": 95.75, "5": 119.68, "6": 143.62, "7": 167.56 },
            precio_hora: { "0": 15.18, "1": 15.38, "2": 15.59, "3": 15.79, "4": 16.00, "5": 16.20, "6": 16.41, "7": 16.61 }
        },
        tes_portalliteras: {
            nombre: "TES Portalliteras",
            salario_base: 1467.04, 
            comp_formacion: 252.39,
            precio_nocturnidad: 0.67,
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
