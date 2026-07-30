import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { shortLabelToDate } from './monthlyBreakdownHelpers';

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function formatMoney(value, currency = 'AED') {
  const amount = Number(value) || 0;
  return `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function svgToPngDataUrl(svgMarkup, width, height) {
  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = blobUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export function createServiceBarChartSvg(serviceName, monthAmounts, color = CHART_COLORS[0]) {
  const width = 720;
  const height = 280;
  const padding = { top: 48, right: 24, bottom: 48, left: 72 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const data = [...monthAmounts].sort(
    (a, b) => shortLabelToDate(a.month) - shortLabelToDate(b.month)
  );
  const maxValue = Math.max(...data.map((item) => item.amount), 1);
  const barGap = 16;
  const barWidth = Math.max(24, (chartWidth - barGap * (data.length + 1)) / Math.max(data.length, 1));

  const bars = data
    .map((item, index) => {
      const barHeight = (item.amount / maxValue) * chartHeight;
      const x = padding.left + barGap + index * (barWidth + barGap);
      const y = padding.top + chartHeight - barHeight;
      return `
        <g>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="${color}" opacity="0.92" />
          <text x="${x + barWidth / 2}" y="${padding.top + chartHeight + 22}" text-anchor="middle" font-size="12" fill="#4B5563">${item.month}</text>
          <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" font-size="11" fill="#111827">${Math.round(item.amount).toLocaleString()}</text>
        </g>
      `;
    })
    .join('');

  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, index) => {
    const value = (maxValue / yTicks) * index;
    const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
    return `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#E5E7EB" stroke-width="1" />
      <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6B7280">${Math.round(value / 1000)}K</text>
    `;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#ffffff" />
      <text x="${padding.left}" y="24" font-size="16" font-weight="600" fill="#111827">${serviceName}</text>
      ${gridLines}
      ${bars}
    </svg>
  `;
}

export async function createServiceBarChartPng(serviceName, monthAmounts, color) {
  const svg = createServiceBarChartSvg(serviceName, monthAmounts, color);
  return svgToPngDataUrl(svg, 720, 280);
}

export function exportMonthlyBreakdownExcel(report) {
  if (!report.summaryRows.length) {
    throw new Error('No data available for the selected report period.');
  }

  const workbook = XLSX.utils.book_new();
  const periodLabel =
    report.months.length === 1
      ? report.months[0]
      : `${report.months[0]} to ${report.months[report.months.length - 1]}`;

  const metaRows = [
    ['Monthly Service Expense Report'],
    ['Generated', report.generatedAt.toLocaleString()],
    ['Period', periodLabel],
    ['Services', report.serviceFilter || 'All services'],
    ['Grand total (AED)', report.grandTotal],
    [],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ...metaRows,
    ['Service', 'Category', 'Month', 'Total (AED)', 'Expenses', 'Line items', 'Status'],
    ...report.summaryRows.map((row) => [
      row.service,
      row.category,
      row.month,
      row.total,
      row.expenseCount,
      row.lineItemCount,
      row.status,
    ]),
  ]);

  const expensesSheet = XLSX.utils.aoa_to_sheet([
    ['Service', 'Month', 'Invoice #', 'Billing period', 'Total (AED)', 'Currency', 'Payment date', 'Due date', 'Has breakdown'],
    ...report.expenseRows.map((row) => [
      row.service,
      row.month,
      row.invoiceNumber,
      row.billingPeriod,
      row.total,
      row.currency,
      row.paymentDate,
      row.dueDate,
      row.hasBreakdown ? 'Yes' : 'No',
    ]),
  ]);

  const linesSheet = XLSX.utils.aoa_to_sheet([
    ['Service', 'Month', 'Invoice #', 'Line item', 'Amount (AED)', 'Type', 'Notes'],
    ...report.lineRows.map((row) => [
      row.service,
      row.month,
      row.invoiceNumber,
      row.label,
      row.amount,
      row.type,
      row.notes,
    ]),
  ]);

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses');
  XLSX.utils.book_append_sheet(workbook, linesSheet, 'Breakdown lines');

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  triggerDownload(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${report.fileSlug}.xlsx`
  );
}

export async function exportMonthlyBreakdownPdf(report) {
  if (!report.summaryRows.length) {
    throw new Error('No data available for the selected report period.');
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const periodLabel =
    report.months.length === 1
      ? report.months[0]
      : `${report.months[0]} to ${report.months[report.months.length - 1]}`;

  doc.setFontSize(18);
  doc.text('Monthly Service Expense Report', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Period: ${periodLabel}`, 14, 26);
  doc.text(`Generated: ${report.generatedAt.toLocaleString()}`, 14, 31);
  doc.text(`Services: ${report.serviceFilter || 'All services'}`, 14, 36);
  doc.text(`Grand total: ${formatMoney(report.grandTotal)}`, 14, 41);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 48,
    head: [['Service', 'Month', 'Total', 'Expenses', 'Line items']],
    body: report.summaryRows.map((row) => [
      row.service,
      row.month,
      formatMoney(row.total),
      String(row.expenseCount),
      String(row.lineItemCount),
    ]),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [16, 185, 129] },
    margin: { left: 14, right: 14 },
  });

  let cursorY = doc.lastAutoTable.finalY + 10;

  for (let index = 0; index < report.services.length; index += 1) {
    const service = report.services[index];
    const monthAmounts = report.months
      .filter((month) => service.monthly_spending?.[month] != null)
      .map((month) => ({
        month,
        amount: service.monthly_spending[month],
      }));

    if (!monthAmounts.length) continue;

    if (cursorY > 230) {
      doc.addPage();
      cursorY = 18;
    }

    const chartDataUrl = await createServiceBarChartPng(
      service.service_name,
      monthAmounts,
      CHART_COLORS[index % CHART_COLORS.length]
    );

    if (chartDataUrl) {
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(service.service_name, 14, cursorY);
      doc.addImage(chartDataUrl, 'PNG', 14, cursorY + 4, 182, 70);
      cursorY += 78;
    }

    const serviceExpenses = report.expenseRows.filter((row) => row.service === service.service_name);
    if (serviceExpenses.length) {
      if (cursorY > 240) {
        doc.addPage();
        cursorY = 18;
      }

      autoTable(doc, {
        startY: cursorY,
        head: [['Month', 'Invoice #', 'Billing period', 'Total', 'Payment', 'Due']],
        body: serviceExpenses.map((row) => [
          row.month,
          row.invoiceNumber,
          row.billingPeriod,
          formatMoney(row.total, row.currency),
          row.paymentDate,
          row.dueDate,
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      });
      cursorY = doc.lastAutoTable.finalY + 8;
    }

    const serviceLines = report.lineRows.filter((row) => row.service === service.service_name);
    if (serviceLines.length) {
      if (cursorY > 230) {
        doc.addPage();
        cursorY = 18;
      }

      autoTable(doc, {
        startY: cursorY,
        head: [['Month', 'Invoice #', 'Line item', 'Amount', 'Type']],
        body: serviceLines.map((row) => [
          row.month,
          row.invoiceNumber,
          row.label,
          formatMoney(row.amount),
          row.type,
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [14, 116, 144] },
        margin: { left: 14, right: 14 },
      });
      cursorY = doc.lastAutoTable.finalY + 10;
    }
  }

  doc.save(`${report.fileSlug}.pdf`);
}
