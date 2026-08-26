/** Helpers for Mulkiya / registration expiry grouping and highlighting. */

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

export function hasMulkiyaData(vehicle) {
  if (!vehicle) return false;
  return Boolean(
    vehicle.registration_expiry || vehicle.mulkiya_number || vehicle.mulkiya_document_url
  );
}

export function vehicleModelLabel(vehicle) {
  if (!vehicle) return 'Unknown model';
  const makeModel = [vehicle.make, vehicle.model].filter(Boolean).join(' ').trim();
  return makeModel || vehicle.car_name?.trim() || 'Unknown model';
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

export function summarizeMulkiya(vehicles = []) {
  const withDate = vehicles.filter((v) => v.registration_expiry);
  let expired = 0;
  let thisMonth = 0;
  let next30 = 0;
  let missing = vehicles.length - withDate.length;
  withDate.forEach((v) => {
    const status = expiryStatus(v.registration_expiry);
    if (status === 'expired') expired += 1;
    else if (status === 'this_month') thisMonth += 1;
    else if (status === 'next_30') next30 += 1;
  });
  return { total: vehicles.length, withDate: withDate.length, expired, thisMonth, next30, missing };
}

/**
 * Calendar months around today (past + future) with vehicle counts
 * for registration / Mulkiya expiry.
 */
export function buildMulkiyaMonthSeries(vehicles = [], months = 12, { pastMonths = 3 } = {}) {
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
    const key = monthKey(v.registration_expiry);
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
