/**
 * Utilities for importing expenses from CSV or Excel files.
 * Maps flexible column names to the expense schema used by the API.
 */
import * as XLSX from 'xlsx';

// Possible header names (case-insensitive) mapped to expense field names
const COLUMN_ALIASES = {
  service_name: ['service name', 'service', 'service_name', 'description', 'expense name'],
  amount_aed: ['amount', 'amount aed', 'amount_aed', 'amount (aed)', 'aed'],
  currency: ['currency', 'curr'],
  months: ['months', 'month', 'period'],
  service_status: ['status', 'service status', 'service_status', 'state'],
  department: ['department', 'dept'],
  date_paid: ['date paid', 'date_paid', 'date', 'payment date', 'paid date'],
  invoice_number: ['invoice number', 'invoice_number', 'invoice #', 'invoice no', 'inv no'],
  invoice_generation_date: ['invoice generation date', 'invoice_generation_date', 'gen date', 'generation date'],
  invoice_due_date: ['invoice due date', 'invoice_due_date', 'due date', 'due'],
};

function normalizeHeader(header) {
  if (header == null || typeof header !== 'string') return '';
  return header
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function findFieldForHeader(header) {
  const normalized = normalizeHeader(header);
  if (!normalized) return null;
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
      return field;
    }
  }
  return null;
}

function parseDate(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    // ISO date
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    // Excel serial date number
    const num = Number(trimmed);
    if (!Number.isNaN(num) && num > 0) {
      const date = XLSX.SSF.parse_date_code(num);
      if (date) {
        const y = date.y;
        const m = String(date.m).padStart(2, '0');
        const d = String(date.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    // DD/MM/YYYY or similar
    const parts = trimmed.split(/[/\-.]/);
    if (parts.length === 3) {
      const [a, b, c] = parts.map((p) => parseInt(p, 10));
      if (a > 31) return `${a}-${String(b).padStart(2, '0')}-${String(c).padStart(2, '0')}`;
      if (c > 31) return `${c}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
      return `${c}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
    }
    return trimmed;
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return '';
}

function parseNumber(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'number' && !Number.isNaN(value)) return String(value);
  const s = String(value).trim().replace(/,/g, '');
  if (s === '') return '';
  const n = parseFloat(s);
  return Number.isNaN(n) ? '' : String(n);
}

const STATUS_VALUES = ['active', 'inactive', 'pending', 'final'];
function parseStatus(value) {
  if (value == null || value === '') return 'active';
  const s = String(value).trim().toLowerCase();
  if (STATUS_VALUES.includes(s)) return s;
  return 'active';
}

/**
 * Map a row of key-value pairs (with flexible keys) to an expense object for the API.
 * @param {Record<string, string>} row - Object keyed by normalized field names (e.g. service_name)
 * @returns {{ expense: Record<string, unknown>, errors: string[] }}
 */
export function mapRowToExpense(row) {
  const expense = {
    currency: 'AED',
    service_status: 'active',
  };
  const errors = [];

  const get = (key) => (row[key] != null && row[key] !== '') ? String(row[key]).trim() : '';

  if (row.service_name != null) expense.service_name = get('service_name');
  if (row.amount_aed != null) {
    const amount = parseNumber(row.amount_aed);
    expense.amount_aed = amount;
    if (amount !== '' && (Number(amount) < 0 || Number.isNaN(Number(amount)))) {
      errors.push('Invalid amount');
    }
  }
  if (row.currency != null && get('currency')) expense.currency = get('currency').toUpperCase() || 'AED';
  if (row.months != null) expense.months = get('months');
  if (row.service_status != null) expense.service_status = parseStatus(row.service_status);
  if (row.department != null) expense.department = get('department');
  if (row.date_paid != null) expense.date_paid = parseDate(row.date_paid);
  if (row.invoice_number != null) expense.invoice_number = get('invoice_number');
  if (row.invoice_generation_date != null) expense.invoice_generation_date = parseDate(row.invoice_generation_date);
  if (row.invoice_due_date != null) expense.invoice_due_date = parseDate(row.invoice_due_date);

  if (!expense.service_name) errors.push('Service name is required');
  if (!expense.amount_aed || expense.amount_aed === '') errors.push('Amount is required');
  if (!expense.date_paid) errors.push('Date paid is required');

  return { expense, errors };
}

/**
 * Parse a CSV or Excel File into an array of expense-like objects (with normalized keys).
 * @param {File} file - CSV or Excel file
 * @returns {Promise<{ rows: Record<string, unknown>[], errors: string[] }>}
 */
export function parseExpenseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const fileName = (file.name || '').toLowerCase();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({ rows: [], errors: ['Could not read file.'] });
          return;
        }

        let workbook;
        if (fileName.endsWith('.csv')) {
          const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
          workbook = XLSX.read(text, { type: 'string', raw: false });
        } else {
          workbook = XLSX.read(data, { type: 'array', raw: false });
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '', raw: false });
        if (!rawRows.length) {
          resolve({ rows: [], errors: ['No rows found in the sheet.'] });
          return;
        }

        const headers = Object.keys(rawRows[0]);
        const headerToField = {};
        headers.forEach((h) => {
          const field = findFieldForHeader(h);
          if (field) headerToField[h] = field;
        });

        const rows = rawRows.map((rawRow) => {
          const mapped = {};
          Object.keys(headerToField).forEach((header) => {
            const field = headerToField[header];
            const value = rawRow[header];
            if (value !== undefined && value !== null && value !== '') {
              mapped[field] = value;
            }
          });
          return mapped;
        });

        resolve({ rows, errors: [] });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));

    if (fileName.endsWith('.csv')) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

/**
 * Generate a CSV template string with expected column headers.
 * Users can fill this and re-import.
 */
export function getExpenseImportTemplateCsv() {
  const headers = [
    'Service Name',
    'Amount (AED)',
    'Currency',
    'Months',
    'Status',
    'Department',
    'Date Paid',
    'Invoice Number',
    'Invoice Generation Date',
    'Invoice Due Date',
  ];
  const example = [
    'Internet Service',
    '500',
    'AED',
    'Jan 2024',
    'active',
    'TECHNOLOGY',
    '2024-01-15',
    'INV-001',
    '2024-01-01',
    '2024-01-31',
  ];
  return [headers.join(','), example.join(',')].join('\n');
}
