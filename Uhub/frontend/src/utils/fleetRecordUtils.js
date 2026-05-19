export const BODY_TYPES = ['SUV', 'Sedan', 'Hatchback', 'Van', 'Pickup', 'Coupe', 'Wagon', 'Other'];
export const POWERTRAIN_TYPES = ['Normal', 'Hybrid', 'EV'];
export const BUSINESS_TYPES = ['PPM', 'Daily', 'Monthly', 'Limo'];

export function getCarDisplayName(vehicle) {
  if (!vehicle) return '—';
  if (vehicle.car_name?.trim()) return vehicle.car_name.trim();
  const makeModel = [vehicle.make, vehicle.model].filter(Boolean).join(' ');
  return makeModel || vehicle.vehicle_number || '—';
}

export function getCarIdDisplay(vehicle) {
  return vehicle?.vehicle_number || '—';
}

function monthKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function lastNMonthKeys(n = 12) {
  const keys = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

function sumCosts(rows, dateField, costFields) {
  return (rows || []).reduce((sum, row) => {
    let c = 0;
    for (const f of costFields) {
      const v = parseFloat(row[f]);
      if (!Number.isNaN(v)) c += v;
    }
    return sum + c;
  }, 0);
}

export function buildMonthlySeries(rows, dateField, costFields, months = 12) {
  const keys = lastNMonthKeys(months);
  const bucket = Object.fromEntries(keys.map((k) => [k, 0]));
  (rows || []).forEach((row) => {
    const k = monthKey(row[dateField]);
    if (k && bucket[k] !== undefined) {
      let c = 0;
      for (const f of costFields) {
        const v = parseFloat(row[f]);
        if (!Number.isNaN(v)) c += v;
      }
      bucket[k] += c;
    }
  });
  return keys.map((k) => ({
    month: k,
    label: new Date(`${k}-01`).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
    count: (rows || []).filter((r) => monthKey(r[dateField]) === k).length,
    amount: Math.round(bucket[k] * 100) / 100,
  }));
}

export function aggregateVehicleProfile(vehicle, maintenanceRecords, fuelLogs, incidents) {
  const maintenance = maintenanceRecords || [];
  const fuel = fuelLogs || [];
  const inc = incidents || [];

  const maintenanceCost = sumCosts(maintenance, 'service_date', ['cost']);
  const fuelCost = sumCosts(fuel, 'fuel_date', ['total_cost']);
  const incidentCost = sumCosts(inc, 'incident_date', ['actual_cost', 'estimated_cost']);
  const purchaseCost = parseFloat(vehicle?.purchase_price) || 0;
  const totalCost = purchaseCost + maintenanceCost + fuelCost + incidentCost;
  const mileage = parseInt(vehicle?.mileage, 10) || 0;
  const costPerKm = mileage > 0 ? totalCost / mileage : null;

  const accidentLike = inc.filter((i) => {
    const t = (i.incident_type || '').toLowerCase();
    return t.includes('accident') || t.includes('breakdown') || t === 'other';
  });

  return {
    counts: {
      maintenance: maintenance.length,
      incidents: inc.length,
      accidents: accidentLike.length,
    },
    costs: {
      purchase: purchaseCost,
      maintenance: maintenanceCost,
      fuel: fuelCost,
      incidents: incidentCost,
      lease: 0,
      total: totalCost,
      costPerKm,
    },
    maintenanceByMonth: buildMonthlySeries(maintenance, 'service_date', ['cost']),
    incidentsByMonth: buildMonthlySeries(inc, 'incident_date', ['actual_cost', 'estimated_cost']),
    recentMaintenance: maintenance.slice(0, 8),
    recentIncidents: inc.slice(0, 8),
    costBreakdown: [
      { name: 'Purchase', value: purchaseCost, color: '#6366f1' },
      { name: 'Maintenance', value: maintenanceCost, color: '#f59e0b' },
      { name: 'Fuel', value: fuelCost, color: '#10b981' },
      { name: 'Incidents', value: incidentCost, color: '#ef4444' },
    ].filter((c) => c.value > 0),
  };
}

export function formatFleetCurrency(amount, currency = 'AED') {
  if (amount == null || Number.isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
}

export function businessTypeBadgeClass(type) {
  const t = (type || '').toLowerCase();
  if (t === 'ppm') return 'bg-blue-100 text-blue-800';
  if (t === 'daily') return 'bg-amber-100 text-amber-800';
  if (t === 'monthly') return 'bg-purple-100 text-purple-800';
  if (t === 'limo') return 'bg-slate-100 text-slate-800';
  return 'bg-gray-100 text-gray-700';
}

export function statusBadgeClass(status) {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Maintenance':
    case 'Onboarding':
      return 'bg-yellow-100 text-yellow-800';
    case 'Out of Service':
      return 'bg-red-100 text-red-800';
    case 'Retired':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}
