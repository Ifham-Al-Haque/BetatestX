/**
 * Download rows as a CSV file in the browser.
 * @param {string} filename - e.g. complaints-inbox-2026-06-24.csv
 * @param {Array<Record<string, unknown>>} rows
 * @param {Array<{ key: string, label: string, getValue?: (row) => string }>} columns
 */
export function downloadCsv(filename, rows, columns) {
  const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const header = columns.map((c) => escape(c.label)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const raw = c.getValue ? c.getValue(row) : row[c.key];
          return escape(raw);
        })
        .join(',')
    )
    .join('\n');

  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function csvFilename(prefix) {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.csv`;
}
