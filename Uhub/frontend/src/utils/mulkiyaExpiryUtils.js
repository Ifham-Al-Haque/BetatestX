/** Helpers for Mulkiya / registration / insurance expiry grouping and highlighting. */

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = startOfDay(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const today = startOfDay();
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function monthKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** expired | this_month | next_30 | later | none */
export function expiryStatus(dateStr) {
  const days = daysUntil(dateStr);
  if (days == null) return 'none';
  if (days < 0) return 'expired';
  const now = new Date();
  const expiry = new Date(dateStr);
  if (expiry.getFullYear() === now.getFullYear() && expiry.getMonth() === now.getMonth()) {
    return 'this_month';
  }
  if (days <= 30) return 'next_30';
  return 'later';
}

export const EXPIRY_STYLES = {
  expired: { badge: 'bg-red-100 text-red-800 border-red-200', bar: '#dc2626', label: 'Expired' },
  this_month: { badge: 'bg-amber-100 text-amber-900 border-amber-200', bar: '#d97706', label: 'This month' },
  next_30: { badge: 'bg-orange-100 text-orange-900 border-orange-200', bar: '#ea580c', label: 'Next 30 days' },
  later: { badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', bar: '#059669', label: 'Later' },
  none: { badge: 'bg-gray-100 text-gray-600 border-gray-200', bar: '#94a3b8', label: 'No date' },
};

export const REMINDER_DAY_OPTIONS = [7, 14, 30, 60];

export function hasMulkiyaData(vehicle) {
  if (!vehicle) return false;
  return Boolean(
    vehicle.registration_expiry ||
    vehicle.insurance_expiry ||
    vehicle.mulkiya_number ||
    vehicle.mulkiya_document_url
  );
}

export function vehicleModelLabel(vehicle) {
  if (!vehicle) return 'Unknown model';
  const makeModel = [vehicle.make, vehicle.model].filter(Boolean).join(' ').trim();
  return makeModel || vehicle.car_name?.trim() || 'Unknown model';
}

export function chassisNumber(vehicle) {
  return vehicle?.vin || vehicle?.chassis_number || '';
}

export function engineNumber(vehicle) {
  return vehicle?.engine_number || vehicle?.engine_no || '';
}

export function modelYear(vehicle) {
  return vehicle?.year || vehicle?.model_year || '';
}

/** Group vehicles by make + model, largest groups first. */
export function countByModel(vehicles = []) {
  const map = {};
  vehicles.forEach((v) => {
    const model = vehicleModelLabel(v);
    if (!map[model]) map[model] = { model, count: 0, vehicles: [] };
    map[model].count += 1;
    map[model].vehicles.push(v);
  });
  return Object.values(map).sort(
    (a, b) => b.count - a.count || a.model.localeCompare(b.model)
  );
}

export function summarizeExpiryField(vehicles = [], dateField) {
  const withDate = vehicles.filter((v) => v[dateField]);
  let expired = 0;
  let thisMonth = 0;
  let next30 = 0;
  withDate.forEach((v) => {
    const status = expiryStatus(v[dateField]);
    if (status === 'expired') expired += 1;
    else if (status === 'this_month') thisMonth += 1;
    else if (status === 'next_30') next30 += 1;
  });
  return { total: vehicles.length, withDate: withDate.length, expired, thisMonth, next30 };
}

export function summarizeMulkiya(vehicles = []) {
  return summarizeExpiryField(vehicles, 'registration_expiry');
}

export function summarizeInsurance(vehicles = []) {
  return summarizeExpiryField(vehicles, 'insurance_expiry');
}

/**
 * Calendar months around today with vehicle counts for a date field
 * (registration_expiry or insurance_expiry).
 */
export function buildExpiryMonthSeries(vehicles = [], dateField, months = 12, { pastMonths = 3 } = {}) {
  const now = new Date();
  const series = [];
  for (let i = -pastMonths; i < months; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = monthKey(d);
    series.push({
      key,
      label: monthLabel(d.getFullYear(), d.getMonth()),
      year: d.getFullYear(),
      month: d.getMonth(),
      count: 0,
      vehicles: [],
      byModel: [],
    });
  }
  const map = Object.fromEntries(series.map((s) => [s.key, s]));
  vehicles.forEach((v) => {
    const key = monthKey(v[dateField]);
    if (key && map[key]) {
      map[key].count += 1;
      map[key].vehicles.push(v);
    }
  });
  series.forEach((row) => {
    row.byModel = countByModel(row.vehicles);
  });
  return series;
}

export function buildMulkiyaMonthSeries(vehicles = [], months = 12, opts = {}) {
  return buildExpiryMonthSeries(vehicles, 'registration_expiry', months, opts);
}

export function buildInsuranceMonthSeries(vehicles = [], months = 12, opts = {}) {
  return buildExpiryMonthSeries(vehicles, 'insurance_expiry', months, opts);
}

/**
 * Vehicles whose Mulkiya or insurance expiry is overdue or within `daysBefore`.
 * Sorted soonest-first (overdue first).
 */
export function collectExpiryReminders(vehicles = [], { daysBefore = 30 } = {}) {
  const kinds = [
    { field: 'registration_expiry', kind: 'mulkiya', label: 'Mulkiya' },
    { field: 'insurance_expiry', kind: 'insurance', label: 'Insurance' },
  ];
  const items = [];
  vehicles.forEach((v) => {
    kinds.forEach(({ field, kind, label }) => {
      const days = daysUntil(v[field]);
      if (days == null) return;
      if (days > daysBefore) return;
      let bucket = 'd60';
      if (days < 0) bucket = 'expired';
      else if (days <= 7) bucket = 'd7';
      else if (days <= 14) bucket = 'd14';
      else if (days <= 30) bucket = 'd30';
      items.push({
        id: v.id,
        vehicle: v,
        kind,
        label,
        date: v[field],
        days,
        bucket,
        license_plate: v.license_plate,
        make: v.make,
        model: v.model,
        vehicle_number: v.vehicle_number,
      });
    });
  });
  return items.sort((a, b) => a.days - b.days);
}
