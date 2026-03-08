import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const themeRed = [220, 38, 38];
const themeDark = [15, 23, 42];
const themeBlue = [37, 99, 235];
const themeGreen = [15, 118, 110];

function addWatermark(doc) {
  try {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.05 }));
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(50);
    doc.text('STRATUM.AI OFFICIAL', 35, 150, { angle: 45 });
    doc.restoreGraphicsState();
  } catch (_) {}
}

/**
 * Generate and download a PDF report for a Check (from history).
 * @param {Object} check - { id, type, content, promptText, score, feedback, createdAt }
 */
export function downloadCheckReport(check) {
  if (!check) return;
  let feedback = {};
  try {
    feedback = typeof check.feedback === 'string' ? JSON.parse(check.feedback) : check.feedback || {};
  } catch (_) {}
  const isT1 = (check.type || 'TASK_2') === 'TASK_1';
  const result = feedback;
  const essay = check.content || '';
  const overallBand = result.overall_band ?? check.score ?? '—';

  const doc = new jsPDF();
  addWatermark(doc);

  doc.setFillColor(...themeDark);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('IELTS EVALUATION REPORT', 20, 22);
  doc.setFontSize(9);
  doc.text(`CANDIDATE SUBMISSION: ${isT1 ? 'ACADEMIC TASK 1' : 'ESSAY TASK 2'}`, 20, 30);

  let y = 55;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, y, 170, 30, 4, 4, 'F');
  doc.setTextColor(...themeRed);
  doc.setFontSize(35);
  doc.text(String(overallBand), 35, y + 22);
  doc.setTextColor(...themeDark);
  doc.setFontSize(12);
  doc.text('OVERALL BAND SCORE', 75, y + 12);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const dateStr = check.createdAt ? new Date(check.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  doc.text(`DATE: ${dateStr} | STATUS: VERIFIED BY AI`, 75, y + 22);

  const criteria = result.criteria || {};
  autoTable(doc, {
    startY: y + 40,
    head: [['Assessment Criteria', 'Band']],
    body: Object.entries(criteria).map(([k, v]) => [
      k.replace(/_/g, ' ').toUpperCase(),
      (v && typeof v === 'object' && v.score != null) ? String(v.score) : (v != null ? String(v) : '—')
    ]),
    theme: 'striped',
    headStyles: { fillColor: themeDark, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  let currentY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 150) + 15;

  doc.setTextColor(...themeRed);
  doc.setFontSize(11);
  doc.text(`${isT1 ? 'Task 1' : 'Task 2'} Essay:`, 20, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const essayLines = doc.splitTextToSize(essay, 170);
  doc.text(essayLines, 20, currentY);
  currentY += essayLines.length * 5 + 15;

  if (result.improvement_strategy) {
    doc.setTextColor(...themeBlue);
    doc.setFontSize(10);
    doc.text('Improvement Strategy:', 20, currentY);
    currentY += 6;
    doc.setTextColor(60, 60, 60);
    const stratLines = doc.splitTextToSize(result.improvement_strategy, 170);
    doc.text(stratLines, 20, currentY);
    currentY += stratLines.length * 5 + 10;
  }

  const corrections = result.corrections || [];
  doc.addPage();
  addWatermark(doc);
  doc.setTextColor(...themeRed);
  doc.setFontSize(14);
  doc.text('Detailed Corrections & Explanations', 20, 20);

  autoTable(doc, {
    startY: 28,
    head: ['#', 'Mistake', 'Correction', 'Category', 'Explanation'].map(h => h),
    body: corrections.length
      ? corrections.map((c, i) => [
          (i + 1).toString(),
          (c.original || '').slice(0, 40),
          (c.fixed || '').slice(0, 40),
          (c.category || c.rule || '—').slice(0, 25),
          (c.explanation || '—').slice(0, 50)
        ])
      : [['—', 'No corrections', '—', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: themeRed, fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3 }
  });

  let nextY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 80) + 15;
  if (nextY > 250) { doc.addPage(); addWatermark(doc); nextY = 25; }

  if (result.suggested_rewrite) {
    doc.setTextColor(...themeGreen);
    doc.setFontSize(12);
    doc.text('Suggested Professional Rewrite:', 20, nextY);
    nextY += 7;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    const rewriteLines = doc.splitTextToSize(result.suggested_rewrite, 170);
    doc.text(rewriteLines, 20, nextY);
  }

  const filename = `STRATUM_Report_${isT1 ? 'T1' : 'T2'}_${check.id.slice(-8)}_${Date.now()}.pdf`;
  doc.save(filename);
}
