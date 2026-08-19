document.addEventListener('DOMContentLoaded', initCED);

const VARIABLES = [
    { id: 'comp', label: 'H. Complementarias' },
    { id: 'night', label: 'Nocturnidad' },
    { id: 'sunday', label: 'Domingos' },
    { id: 'flocal', label: 'Festivos Locales' },
    { id: 'fespecial', label: 'Festivos Especiales' },
    { id: 'fnolocal', label: 'Festivos No Locales' },
    { id: 'prolong', label: 'Prolongación' },
    { id: 'dietas', label: 'Dietas' }
];

const MONTHS = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
];

const MINIMO_CED = 219.31;

function initCED() {
    const container = document.getElementById('months-container');
    const btnCalcular = document.getElementById('btn-calcular');

    // Generate month blocks
    MONTHS.forEach((month, mIndex) => {
        const details = document.createElement('details');
        details.className = 'month-details';
        // Open the first month by default for better UX
        if (mIndex === 0) details.open = true;

        const summary = document.createElement('summary');
        summary.textContent = month;
        details.appendChild(summary);

        const content = document.createElement('div');
        content.className = 'month-content';

        VARIABLES.forEach(variable => {
            const group = document.createElement('div');
            group.className = 'input-group';

            const label = document.createElement('label');
            label.textContent = variable.label;
            label.setAttribute('for', `m${mIndex}-${variable.id}`);

            const input = document.createElement('input');
            input.type = 'number';
            input.id = `m${mIndex}-${variable.id}`;
            input.min = '0';
            input.step = '0.01';
            input.value = '0';
            // Auto select content on focus for quick typing
            input.addEventListener('focus', function() { this.select(); });

            group.appendChild(label);
            group.appendChild(input);
            content.appendChild(group);
        });

        details.appendChild(content);
        container.appendChild(details);
    });

    btnCalcular.addEventListener('click', calculateCED);
}

function calculateCED() {
    const resultsDetails = document.getElementById('results-details');
    const resultTotal = document.getElementById('result-total');
    const resultNote = document.getElementById('result-note');
    const resultsBox = document.getElementById('results-box');

    resultsDetails.innerHTML = '';
    
    let sumOfAverages = 0;
    
    const calcGroups = [
        { label: 'H. Complementarias', ids: ['comp'] },
        { label: 'Nocturnidad', ids: ['night'] },
        { label: 'Domingos y Festivos', ids: ['sunday', 'flocal', 'fespecial', 'fnolocal'] },
        { label: 'Prolongación', ids: ['prolong'] },
        { label: 'Dietas', ids: ['dietas'] }
    ];
    
    // Process each variable group
    calcGroups.forEach(group => {
        let sum = 0;
        let monthsWithAmount = 0;
        
        // Loop through all 12 months for this group
        for (let m = 0; m < 12; m++) {
            let monthSum = 0;
            group.ids.forEach(id => {
                const input = document.getElementById(`m${m}-${id}`);
                if (input) {
                    monthSum += parseFloat(input.value) || 0;
                }
            });
            
            if (monthSum > 0) {
                sum += monthSum;
                monthsWithAmount++;
            }
        }
        
        const avg = sum / 12;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'result-item';
        
        if (monthsWithAmount >= 6) {
            sumOfAverages += avg;
            itemDiv.innerHTML = `
                <span><strong>${group.label}</strong> (Cobrado ${monthsWithAmount} meses)</span>
                <span>${avg.toFixed(2)} €</span>
            `;
        } else {
            itemDiv.className += ' rejected';
            itemDiv.innerHTML = `
                <span><strong>${group.label}</strong> (Solo ${monthsWithAmount} meses, min 6)</span>
                <span>0.00 €</span>
            `;
        }
        
        resultsDetails.appendChild(itemDiv);
    });
    
    // Final check against minimum
    let finalAmount = sumOfAverages;
    let noteText = '';
    
    if (sumOfAverages < MINIMO_CED) {
        finalAmount = MINIMO_CED;
        noteText = `La suma de las medias (${sumOfAverages.toFixed(2)} €) es inferior al mínimo estipulado. Se abona el importe mínimo.`;
    } else {
        noteText = `La suma de las medias supera el mínimo estipulado. Se abona la cantidad sumada.`;
    }
    
    resultTotal.textContent = `${finalAmount.toFixed(2)} €`;
    resultNote.textContent = noteText;
    
    resultsBox.style.display = 'block';
    
    // Scroll to results
    resultsBox.scrollIntoView({ behavior: 'smooth', block: 'end' });
}
