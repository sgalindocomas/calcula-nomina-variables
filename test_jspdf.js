import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
const doc = new jsPDF();
autoTable(doc, { head: [['A']], body: [['B']] });
console.log(doc.lastAutoTable ? doc.lastAutoTable.finalY : 'undefined');
