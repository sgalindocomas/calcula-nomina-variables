export function generateClaimText(shifts, totals, monthText, owedData, abonadoData, t) {
    const sortedDates = Object.keys(shifts).sort();
    const monthNames = [
        t('common.months_short.1'), t('common.months_short.2'), t('common.months_short.3'),
        t('common.months_short.4'), t('common.months_short.5'), t('common.months_short.6'),
        t('common.months_short.7'), t('common.months_short.8'), t('common.months_short.9'),
        t('common.months_short.10'), t('common.months_short.11'), t('common.months_short.12')
    ];
    
    let ordText = [];
    let compText = [];
    
    sortedDates.forEach(dateStr => {
        const shift = shifts[dateStr];
        if (shift.type === 'none') return;
        
        const d = new Date(dateStr);
        const formatStr = `${d.getDate()}/${monthNames[d.getMonth()]} ${shift.unidad || ''} ${shift.duration}h`;
        
        if (shift.type === 'ordinaria') {
            ordText.push(formatStr.trim());
        } else if (shift.type === 'complementaria') {
            compText.push(formatStr.trim());
        }
    });
    
    const fmt = num => Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
    
    const pushItems = (arr, comp, prolong, night, sunday, flocal, fespecial, fnolocal, dietas) => {
        if (comp > 0) arr.push(t('generators.items.comp', { amount: fmt(comp) }));
        if (night > 0) arr.push(t('generators.items.night', { amount: fmt(night) }));
        if (sunday > 0) arr.push(t('generators.items.sunday', { amount: fmt(sunday) }));
        if (flocal > 0) arr.push(t('generators.items.flocal', { amount: fmt(flocal) }));
        if (fespecial > 0) arr.push(t('generators.items.fespecial', { amount: fmt(fespecial) }));
        if (fnolocal > 0) arr.push(t('generators.items.fnolocal', { amount: fmt(fnolocal) }));
        if (prolong > 0) arr.push(t('generators.items.prolong', { amount: fmt(prolong) }));
        if (dietas > 0) arr.push(t('generators.items.dietas', { amount: fmt(dietas) }));
    };
    
    let genArr = [];
    pushItems(genArr, totals.comp_hours, totals.prolongation_mins, totals.night_hours, totals.sunday_hours, totals.f_local_hours, totals.f_especial_hours, totals.f_no_local_hours, totals.diets);
    
    const hasOwed = owedData.hasOwed;
    const owedComp = hasOwed ? (parseFloat(owedData.comp) || 0) : 0;
    const owedProlong = hasOwed ? (parseFloat(owedData.prolong) || 0) : 0;
    const owedNight = hasOwed ? (parseFloat(owedData.night) || 0) : 0;
    const owedSunday = hasOwed ? (parseFloat(owedData.sunday) || 0) : 0;
    const owedFLocal = hasOwed ? (parseFloat(owedData.flocal) || 0) : 0;
    const owedFEspecial = hasOwed ? (parseFloat(owedData.fespecial) || 0) : 0;
    const owedFEstatal = hasOwed ? (parseFloat(owedData.festatal) || 0) : 0;
    const owedDietas = hasOwed ? (parseFloat(owedData.dietas) || 0) : 0;

    let owedArr = [];
    pushItems(owedArr, owedComp, owedProlong, owedNight, owedSunday, owedFLocal, owedFEspecial, owedFEstatal, owedDietas);

    const abonadoComp = parseFloat(abonadoData.comp) || 0;
    const abonadoProlong = parseFloat(abonadoData.prolong) || 0;
    const abonadoNight = parseFloat(abonadoData.night) || 0;
    const abonadoSunday = parseFloat(abonadoData.sunday) || 0;
    const abonadoFLocal = parseFloat(abonadoData.flocal) || 0;
    const abonadoFEspecial = parseFloat(abonadoData.fespecial) || 0;
    const abonadoFEstatal = parseFloat(abonadoData.festatal) || 0;
    const abonadoDietas = parseFloat(abonadoData.dietas) || 0;
    
    let abnArr = [];
    pushItems(abnArr, abonadoComp, abonadoProlong, abonadoNight, abonadoSunday, abonadoFLocal, abonadoFEspecial, abonadoFEstatal, abonadoDietas);
    
    const sumComp = (totals.comp_hours || 0) + owedComp;
    const sumNight = (totals.night_hours || 0) + owedNight;
    const sumSunday = (totals.sunday_hours || 0) + owedSunday;
    const sumFLocal = (totals.f_local_hours || 0) + owedFLocal;
    const sumFEspecial = (totals.f_especial_hours || 0) + owedFEspecial;
    const sumFEstatal = (totals.f_no_local_hours || 0) + owedFEstatal;
    const sumProlong = (totals.prolongation_mins || 0) + owedProlong;
    const sumDietas = (totals.diets || 0) + owedDietas;

    let sumArr = [];
    pushItems(sumArr, sumComp, sumProlong, sumNight, sumSunday, sumFLocal, sumFEspecial, sumFEstatal, sumDietas);

    const claimComp = Math.max(0, sumComp - abonadoComp);
    const claimNight = Math.max(0, sumNight - abonadoNight);
    const claimSunday = Math.max(0, sumSunday - abonadoSunday);
    const claimFLocal = Math.max(0, sumFLocal - abonadoFLocal);
    const claimFEspecial = Math.max(0, sumFEspecial - abonadoFEspecial);
    const claimFEstatal = Math.max(0, sumFEstatal - abonadoFEstatal);
    const claimProlong = Math.max(0, sumProlong - abonadoProlong);
    const claimDietas = Math.max(0, sumDietas - abonadoDietas);
    
    let recArr = [];
    pushItems(recArr, claimComp, claimProlong, claimNight, claimSunday, claimFLocal, claimFEspecial, claimFEstatal, claimDietas);

    let text = t('generators.claim.intro', { month: monthText });
    
    if (ordText.length > 0) {
        text += t('generators.claim.ord', { days: ordText.join(', ') });
    }
    
    if (compText.length > 0) {
        text += t('generators.claim.comp', { days: compText.join(', ') });
    }
    
    if (ordText.length > 0 || compText.length > 0) text += '\n';
    
    if (genArr.length > 0) {
        text += t('generators.claim.gen_some', { items: genArr.join(', ') });
    } else {
        text += t('generators.claim.gen_none');
    }
    
    if (hasOwed && owedArr.length > 0) {
        text += t('generators.claim.owed', { items: owedArr.join(', ') });
        text += t('generators.claim.sum', { items: sumArr.join(', ') });
    }
    
    if (abnArr.length > 0) {
        text += t('generators.claim.abn_some', { items: abnArr.join(', ') });
    } else {
        text += t('generators.claim.abn_none');
    }

    if (recArr.length > 0) {
        text += t('generators.claim.rec_some', { items: recArr.join(', ') });
    } else {
        text += t('generators.claim.rec_none');
    }
    
    return text.trim();
}

export function generateInfoText(shifts, totals, monthText, t) {
    const sortedDates = Object.keys(shifts).sort();
    const monthNames = [
        t('common.months_short.1'), t('common.months_short.2'), t('common.months_short.3'),
        t('common.months_short.4'), t('common.months_short.5'), t('common.months_short.6'),
        t('common.months_short.7'), t('common.months_short.8'), t('common.months_short.9'),
        t('common.months_short.10'), t('common.months_short.11'), t('common.months_short.12')
    ];
    
    let ordText = [];
    let compText = [];
    
    sortedDates.forEach(dateStr => {
        const shift = shifts[dateStr];
        if (shift.type === 'none') return;
        
        const d = new Date(dateStr);
        const formatStr = `${d.getDate()}/${monthNames[d.getMonth()]} ${shift.unidad || ''} ${shift.duration}h`;
        
        if (shift.type === 'ordinaria') {
            ordText.push(formatStr.trim());
        } else if (shift.type === 'complementaria') {
            compText.push(formatStr.trim());
        }
    });
    
    const fmt = num => Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
    
    const pushItems = (arr, comp, prolong, night, sunday, flocal, fespecial, fnolocal, dietas) => {
        if (comp > 0) arr.push(t('generators.items.comp', { amount: fmt(comp) }));
        if (night > 0) arr.push(t('generators.items.night', { amount: fmt(night) }));
        if (sunday > 0) arr.push(t('generators.items.sunday', { amount: fmt(sunday) }));
        if (flocal > 0) arr.push(t('generators.items.flocal', { amount: fmt(flocal) }));
        if (fespecial > 0) arr.push(t('generators.items.fespecial', { amount: fmt(fespecial) }));
        if (fnolocal > 0) arr.push(t('generators.items.fnolocal', { amount: fmt(fnolocal) }));
        if (prolong > 0) arr.push(t('generators.items.prolong', { amount: fmt(prolong) }));
        if (dietas > 0) arr.push(t('generators.items.dietas', { amount: fmt(dietas) }));
    };
    
    let genArr = [];
    pushItems(genArr, totals.comp_hours, totals.prolongation_mins, totals.night_hours, totals.sunday_hours, totals.f_local_hours, totals.f_especial_hours, totals.f_no_local_hours, totals.diets);
    
    let text = t('generators.info.intro', { month: monthText });
    
    if (ordText.length > 0) {
        text += t('generators.info.ord', { days: ordText.join(', ') });
    }
    
    if (compText.length > 0) {
        text += t('generators.info.comp', { days: compText.join(', ') });
    }
    
    if (ordText.length > 0 || compText.length > 0) text += '\n';
    
    if (genArr.length > 0) {
        text += t('generators.info.gen', { items: genArr.join(', ') });
    }
    
    return text.trim();
}
