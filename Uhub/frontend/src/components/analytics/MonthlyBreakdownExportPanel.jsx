import { useMemo, useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import {
  buildMonthlyBreakdownReport,
  buildReportFileSlug,
  getAvailableMonthLabels,
  getDefaultReportMonth,
  getMonthsForReportScope,
} from '../../utils/monthlyBreakdownHelpers';
import {
  exportMonthlyBreakdownExcel,
  exportMonthlyBreakdownPdf,
} from '../../utils/monthlyBreakdownExport';

export default function MonthlyBreakdownExportPanel({
  services = [],
  paymentDetailsMap = {},
  zoomedMonth = null,
  expandedService = null,
  onToast,
}) {
  const availableMonths = useMemo(() => getAvailableMonthLabels(services), [services]);
  const [scope, setScope] = useState('selected-month');
  const [selectedMonth, setSelectedMonth] = useState(() =>
    getDefaultReportMonth(availableMonths, zoomedMonth)
  );
  const [serviceScope, setServiceScope] = useState('all');
  const [isExporting, setIsExporting] = useState(null);

  useEffect(() => {
    if (zoomedMonth && availableMonths.includes(zoomedMonth)) {
      setSelectedMonth(zoomedMonth);
      setScope('selected-month');
    }
  }, [zoomedMonth, availableMonths]);

  const effectiveMonth = getDefaultReportMonth(availableMonths, zoomedMonth || selectedMonth);

  const reportMonths = useMemo(
    () => getMonthsForReportScope(scope, availableMonths, effectiveMonth || selectedMonth),
    [scope, availableMonths, effectiveMonth, selectedMonth]
  );

  const report = useMemo(
    () =>
      buildMonthlyBreakdownReport({
        services,
        paymentDetailsMap,
        months: reportMonths,
        serviceFilter: serviceScope === 'current' && expandedService ? expandedService : null,
      }),
    [services, paymentDetailsMap, reportMonths, serviceScope, expandedService]
  );

  const handleExport = async (format) => {
    if (!report.summaryRows.length) {
      onToast?.('No expense data found for the selected report period.');
      return;
    }

    setIsExporting(format);
    try {
      const payload = {
        ...report,
        fileSlug: buildReportFileSlug(reportMonths),
      };

      if (format === 'excel') {
        exportMonthlyBreakdownExcel(payload);
        onToast?.('Excel report downloaded.');
      } else {
        await exportMonthlyBreakdownPdf(payload);
        onToast?.('PDF report downloaded.');
      }
    } catch (error) {
      console.error('Monthly breakdown export failed:', error);
      onToast?.(error.message || 'Export failed. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  const periodLabel =
    reportMonths.length === 1
      ? reportMonths[0]
      : reportMonths.length > 1
        ? `${reportMonths[0]} to ${reportMonths[reportMonths.length - 1]}`
        : 'No months available';

  return (
    <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/50 dark:from-emerald-950/20 dark:via-gray-800 dark:to-teal-950/10 p-4 md:p-5">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Download className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Download monthly report
            </h4>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Excel includes summary, expenses, and breakdown line items. PDF adds charts for each service in scope.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row flex-wrap gap-3">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Period
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              className="mt-1 block w-full min-w-[10rem] rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="selected-month">Selected month</option>
              <option value="last-3-months">Last 3 months</option>
            </select>
          </label>

          {scope === 'selected-month' && (
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Month
              <select
                value={selectedMonth || effectiveMonth || ''}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="mt-1 block w-full min-w-[9rem] rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Services
            <select
              value={serviceScope}
              onChange={(event) => setServiceScope(event.target.value)}
              className="mt-1 block w-full min-w-[10rem] rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="all">All services</option>
              <option value="current" disabled={!expandedService}>
                {expandedService ? `Current: ${expandedService}` : 'Current service (expand one first)'}
              </option>
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              type="button"
              disabled={!!isExporting || !report.summaryRows.length}
              onClick={() => handleExport('excel')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {isExporting === 'excel' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Excel
            </button>
            <button
              type="button"
              disabled={!!isExporting || !report.summaryRows.length}
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-800 dark:text-gray-100 transition-colors"
            >
              {isExporting === 'pdf' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              PDF + charts
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
        <span>
          Preview: <strong className="text-gray-800 dark:text-gray-200">{periodLabel}</strong>
        </span>
        <span>{report.summaryRows.length} service-month row(s)</span>
        <span>{report.expenseRows.length} expense(s)</span>
        <span>{report.lineRows.length} breakdown line(s)</span>
        <span>Total AED {report.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}
