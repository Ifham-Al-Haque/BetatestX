import { FileSpreadsheet, Upload, Download } from 'lucide-react';

export default function ExpenseImportPanel({
  fileInputRef,
  onFileChange,
  onDownloadTemplate,
  importError,
  importPreview,
  validImportCount,
  invalidImportCount,
  importing,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/70 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white flex items-center gap-2">
        <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        Import from Excel or CSV
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Bulk upload expenses using the template. Valid rows are previewed before import.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={onFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl transition-colors border border-gray-300 dark:border-gray-600 font-medium"
        >
          <Upload className="w-4 h-4" />
          Choose file
        </button>
        <button
          type="button"
          onClick={onDownloadTemplate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors font-medium"
        >
          <Download className="w-4 h-4" />
          Download template
        </button>
      </div>

      {importError && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 border border-red-200 dark:border-red-800">
          {importError}
        </p>
      )}

      {importPreview.length > 0 && (
        <>
          <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
            <span>
              <strong>{validImportCount}</strong> valid row(s) ready to import
              {invalidImportCount > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  {' '}({invalidImportCount} skipped due to errors)
                </span>
              )}
            </span>
          </div>

          <div className="overflow-x-auto max-h-48 border border-gray-200 dark:border-gray-600 rounded-xl mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  {['Service', 'Amount', 'Date Paid', 'Gen. Date', 'Due Date', 'Department', 'Status', 'Issues'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {importPreview.slice(0, 10).map((item, idx) => (
                  <tr
                    key={idx}
                    className={item.rowErrors.length > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : ''}
                  >
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{item.expense.service_name || '—'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">
                      {item.expense.amount_aed ? `${item.expense.currency || 'AED'} ${item.expense.amount_aed}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{item.expense.date_paid || '—'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{item.expense.invoice_generation_date || '—'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{item.expense.invoice_due_date || '—'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{item.expense.department || '—'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{item.expense.service_status || '—'}</td>
                    <td className="px-3 py-2 text-amber-600 dark:text-amber-400 text-xs">
                      {item.rowErrors.length > 0 ? item.rowErrors.join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {importPreview.length > 10 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Showing first 10 of {importPreview.length} rows. All valid rows will be imported.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onConfirm}
              disabled={importing || validImportCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Importing…' : `Import ${validImportCount} expense(s)`}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={importing}
              className="px-4 py-2.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
