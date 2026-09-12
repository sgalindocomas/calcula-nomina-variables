<script>
    import { data } from '../lib/data.js';
    import { jsPDF } from 'jspdf';
    import autoTable from 'jspdf-autotable';
    import { t } from '../lib/i18n/index.svelte.js';

    let VARIABLES = $derived([
        { id: 'comp', label: t('ced.concepts.comp') },
        { id: 'night', label: t('ced.concepts.night') },
        { id: 'sunday', label: t('ced.concepts.sunday') },
        { id: 'flocal', label: t('ced.concepts.flocal') },
        { id: 'fespecial', label: t('ced.concepts.fespecial') },
        { id: 'fnolocal', label: t('ced.concepts.fnolocal') },
        { id: 'prolong', label: t('ced.concepts.prolong') },
        { id: 'dietas', label: t('ced.concepts.dietas') }
    ]);

    let MONTHS = $derived([
        t('common.months.1'), t('common.months.2'), t('common.months.3'), t('common.months.4'), t('common.months.5'), t('common.months.6'),
        t('common.months.7'), t('common.months.8'), t('common.months.9'), t('common.months.10'), t('common.months.11'), t('common.months.12')
    ]);

    let inputs = $state(Array.from({ length: 12 }, () => {
        let monthData = {};
        ['comp','night','sunday','flocal','fespecial','fnolocal','prolong','dietas'].forEach(id => { monthData[id] = 0; });
        return monthData;
    }));

    let results = $state(null);

    function calculateCED() {
        if (window.umami) {
            umami.track('Calcular CED');
        }

        let sumOfAverages = 0;
        let details = [];
        
        const calcGroups = [
            { label: t('ced.concepts.comp'), ids: ['comp'] },
            { label: t('ced.concepts.night'), ids: ['night'] },
            { label: t('ced.concepts.sunday'), ids: ['sunday'] },
            { label: t('ced.concepts.festivos'), ids: ['flocal', 'fespecial', 'fnolocal'] },
            { label: t('ced.concepts.prolong'), ids: ['prolong'] },
            { label: t('ced.concepts.dietas'), ids: ['dietas'] }
        ];
        
        calcGroups.forEach(group => {
            let sum = 0;
            let monthsWithAmount = 0;
            
            for (let m = 0; m < 12; m++) {
                let monthSum = 0;
                group.ids.forEach(id => {
                    monthSum += parseFloat(inputs[m][id]) || 0;
                });
                
                if (monthSum > 0) {
                    sum += monthSum;
                    monthsWithAmount++;
                }
            }
            
            const avg = sum / 11;
            
            if (monthsWithAmount >= 6) {
                sumOfAverages += avg;
                details.push({
                    label: group.label,
                    text: t('ced.logic.cobrado', { months: monthsWithAmount }),
                    amount: avg,
                    rejected: false
                });
            } else {
                details.push({
                    label: group.label,
                    text: t('ced.logic.solo', { months: monthsWithAmount }),
                    amount: 0,
                    rejected: true
                });
            }
        });
        
        const minimoCed = data?.minimo_ced ?? 215.01;
        const isMinimum = sumOfAverages < minimoCed;
        const baseAmount = isMinimum ? minimoCed : sumOfAverages;
        const aCuentaConvenio = baseAmount * 0.0404;
        const finalAmount = baseAmount + aCuentaConvenio;
        let noteText = '';
        
        if (isMinimum) {
            noteText = t('ced.logic.note_min', { 
                amount: sumOfAverages.toFixed(2),
                min: minimoCed.toFixed(2)
            });
        } else {
            noteText = t('ced.logic.note_ok', { 
                amount: sumOfAverages.toFixed(2),
                min: minimoCed.toFixed(2)
            });
        }
        
        results = {
            details,
            sumOfAverages,
            baseAmount,
            isMinimum,
            aCuentaConvenio,
            finalAmount,
            noteText
        };

        setTimeout(() => {
            document.getElementById('results-box')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 50);
    }
    async function generatePDF() {
        try {
        if (!results) return;
        
        const imgUrl = "./ccoo.png";
        let logoDataUrl = null;
        try {
            const response = await fetch(imgUrl);
            const blob = await response.blob();
            logoDataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.warn("Could not load logo for PDF", e);
        }

        const doc = new jsPDF();
        const margin = 14;
        const pageW = doc.internal.pageSize.getWidth();
        
        const addHeader = () => {
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("Agrupació Ambulàncies", margin, 20);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("CCOO - Federació de Serveis a la Ciutadania", margin, 25);
            doc.text(t('ced.header.title') + " (" + t('ced.header.subtitle_1') + ")", margin, 30);
            
            if (logoDataUrl) {
                doc.addImage(logoDataUrl, 'PNG', pageW - margin - 35, 12, 35, 12);
            }
        };

        // --- PAGE 1: DATOS INTRODUCIDOS ---
        addHeader();
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(t('ced.pdf.title_data'), margin, 45);
        
        let currentY = 55;
        
        const tableData = [];
        MONTHS.forEach((month, idx) => {
            const monthVars = [];
            VARIABLES.forEach(v => {
                const val = parseFloat(inputs[idx][v.id]) || 0;
                if (val > 0) monthVars.push(v.label + ": " + val.toFixed(2) + " €");
            });
            if (monthVars.length > 0) {
                tableData.push([month, monthVars.join('\n')]);
            }
        });
        
        if (tableData.length > 0) {
            autoTable(doc, {
                startY: currentY,
                head: [[t('ced.pdf.col_month'), t('ced.pdf.col_vars')]],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [186, 12, 47] },
                styles: { cellPadding: 3, fontSize: 10, valign: 'middle' },
                margin: { top: 40, left: margin, right: margin, bottom: 20 },
                didDrawPage: function(data) {
                    if (data.pageNumber > 1) addHeader();
                }
            });
        } else {
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.text(t('ced.pdf.no_data'), margin, currentY);
        }
        
        // --- PAGE 2: RESULTADO DEL CÁLCULO ---
        doc.addPage();
        addHeader();
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(t('ced.pdf.title_results'), margin, 45);
        
        const calcData = results.details.map(d => [
            d.label,
            d.text,
            d.amount.toFixed(2) + " €",
            d.rejected ? t('ced.pdf.status_rejected') : t('ced.pdf.status_ok')
        ]);
        
        autoTable(doc, {
            startY: 55,
            head: [[t('ced.pdf.col_concept'), t('ced.pdf.col_appearance'), t('ced.pdf.col_avg'), t('ced.pdf.col_status')]],
            body: calcData,
            theme: 'striped',
            headStyles: { fillColor: [186, 12, 47] },
            styles: { cellPadding: 3, fontSize: 10 },
            columnStyles: {
                2: { halign: 'right' },
                3: { halign: 'center' }
            },
            willDrawCell: function(data) {
                if (data.section === 'body' && data.column.index === 3) {
                    if (data.cell.raw === t('ced.pdf.status_rejected')) {
                        doc.setTextColor(200, 0, 0);
                    } else {
                        doc.setTextColor(0, 150, 0);
                    }
                }
            }
        });
        
        const finalY = doc.lastAutoTable.finalY + 12;
        
        doc.setFontSize(10);
        doc.setTextColor(60);
        doc.setFont("helvetica", "normal");
        doc.text(t('ced.pdf.sum_avg') + ": " + results.sumOfAverages.toFixed(2) + " €", margin, finalY);
        doc.text(t('ced.pdf.min_guaranteed') + ": " + (data.minimo_ced || 215.01).toFixed(2) + " €", margin, finalY + 6);
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(t('ced.pdf.base_applied') + ": " + results.baseAmount.toFixed(2) + " €", margin, finalY + 13);
        
        doc.setTextColor(186, 12, 47);
        doc.text(t('ced.pdf.acuenta') + ": +" + results.aCuentaConvenio.toFixed(2) + " €", margin, finalY + 20);
        
        doc.setDrawColor(186, 12, 47);
        doc.setLineWidth(0.5);
        doc.line(margin, finalY + 24, pageW - margin, finalY + 24);
        
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text(t('ced.pdf.total_pay') + ":", margin, finalY + 32);
        
        doc.setFontSize(16);
        doc.setTextColor(186, 12, 47);
        doc.text(results.finalAmount.toFixed(2) + " €", margin + 85, finalY + 32);
        
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.setFont("helvetica", "italic");
        doc.text(results.noteText, margin, finalY + 40, { maxWidth: pageW - (margin * 2) });
        
        doc.save("Calculo_CED.pdf");
        } catch(err) { alert("Error en PDF: " + err.message + "\n" + err.stack); }
    }

</script>

<div class="app-container shadow-glass max-w-800">
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
    <header class="header cursor-pointer" onclick={() => window.location.href='./index.html'} title="Volver al inicio">
        <div class="flex-center gap-08 mb-15">
            <span class="vt-header-title font-inter text-base font-800 text-black">Agrupació Ambulàncies</span>
            <img src="./ccoo.png" alt="Logo CCOO Catalunya" class="vt-header-logo h-35 mb-0">
        </div>
        <h1 class="text-3xl mt-0 mb-05">{t('ced.header.title')}</h1>
        <p class="text-base mt-0 mb-0">{t('ced.header.subtitle_1')}</p>
        <p class="text-base mt-0 mb-0">{t('ced.header.subtitle_2')}</p>
    </header>

    <main class="p-2">
        <div class="bg-success-light rounded-lg p-1 mb-2 text-md border-success">
            <strong class="text-success">{t('ced.instructions.title')}:</strong> {t('ced.instructions.text')}
        </div>

        <form id="ced-form">
            <div id="months-container">
                {#each MONTHS as month, mIndex}
                    <details class="month-details" open={mIndex === 0}>
                        <summary>{month}</summary>
                        <div class="month-content">
                            {#each VARIABLES as variable}
                                <div class="input-group">
                                    <label for="m{mIndex}-{variable.id}">{variable.label}</label>
                                    <input 
                                        type="number" 
                                        id="m{mIndex}-{variable.id}" 
                                        min="0" step="0.01" 
                                        bind:value={inputs[mIndex][variable.id]}
                                        onfocus={(e) => e.target.select()}
                                    />
                                </div>
                            {/each}
                        </div>
                    </details>
                {/each}
            </div>

            <div class="text-center mt-2">
                <button type="button" class="btn btn-primary w-full max-w-300 text-xl p-1" onclick={calculateCED}>{t('ced.btn_calc')}</button>
            </div>
        </form>

        {#if results}
            <div id="results-box" class="results-box" style="display: block;">
                <h3 class="text-primary mb-1 text-center">{t('ced.results.title')}</h3>
                <div id="results-details">
                    {#each results.details as item}
                        <div class="result-item" class:rejected={item.rejected}>
                            <span><strong>{item.label}</strong> {item.text}</span>
                            <span>{item.amount.toFixed(2)} €</span>
                        </div>
                    {/each}
                </div>

                <div class="ced-breakdown mt-15 pt-1" style="border-top: 2px solid var(--color-primary-light);">
                    {#if results.isMinimum}
                        <div class="result-row" style="opacity: 0.75; font-size: 0.9rem;">
                            <span>{t('ced.results.sum_avg')}</span>
                            <span>{results.sumOfAverages.toFixed(2)} €</span>
                        </div>
                        <div class="result-row">
                            <span><strong>{t('ced.results.base_applied_min')}</strong></span>
                            <strong>{results.baseAmount.toFixed(2)} €</strong>
                        </div>
                    {:else}
                        <div class="result-row">
                            <span><strong>{t('ced.results.base_applied_avg')}</strong></span>
                            <strong>{results.baseAmount.toFixed(2)} €</strong>
                        </div>
                    {/if}

                    <div class="result-row" style="color: var(--color-primary); font-weight: 600;">
                        <span>{t('ced.results.acuenta')}</span>
                        <strong>+ {results.aCuentaConvenio.toFixed(2)} €</strong>
                    </div>
                </div>

                <div class="result-total-ced" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border);">
                    <div style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted); margin-bottom: 0.35rem;">
                        {t('ced.results.total_label')}
                    </div>
                    {results.finalAmount.toFixed(2)} €
                </div>
                <div class="result-note">
                    {results.noteText}
                </div>
                <div class="text-center mt-15">
                    <button type="button" class="btn btn-outline w-full max-w-300" onclick={generatePDF}>📄 {t('ced.results.btn_pdf')}</button>
                </div>
            </div>
        {/if}
    </main>

    <!-- Affiliation Banner -->
    <div class="affiliation-banner">
        <h3>{t('common.affiliation.title')}</h3>
        <p>{t('common.affiliation.text')}</p>
        <a href="https://www.ccoo.cat/afiliat" target="_blank" class="btn-white">{t('common.affiliation.btn')}</a>
    </div>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<footer class="global-footer cursor-pointer" onclick={() => window.location.href='./index.html'} title="Volver al inicio">
    <div class="footer-content">
        <img src="./ccoo.png" alt="Logo CCOO" class="footer-logo">
        <div class="footer-text">
            <strong>CCOO - Agrupació Ambulàncies</strong><br>
            Federació de Serveis a la Ciutadania
        </div>
    </div>
    <div class="footer-credits">
        Creado por Salva Galindo
    </div>
</footer>

