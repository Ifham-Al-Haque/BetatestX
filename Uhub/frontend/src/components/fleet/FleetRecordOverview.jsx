import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Wrench, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import {
  aggregateVehicleProfile,
  getCarDisplayName,
  getCarIdDisplay,
  formatFleetCurrency,
  businessTypeBadgeClass,
  statusBadgeClass,
} from '../../utils/fleetRecordUtils';

const InfoRow = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-sm font-medium text-gray-600 shrink-0">{label}</span>
    <div className="text-sm text-gray-900 text-right">{children}</div>
  </div>
);

const KpiCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className={`rounded-xl border p-4 ${color}`}>
    <div className="flex items-center gap-2 text-gray-600 mb-1">
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

const FleetRecordOverview = ({ vehicle, maintenanceRecords, fuelLogs, incidents, onTabChange }) => {
  const profile = useMemo(
    () => aggregateVehicleProfile(vehicle, maintenanceRecords, fuelLogs, incidents),
    [vehicle, maintenanceRecords, fuelLogs, incidents]
  );

  if (!vehicle) return null;

  const colorDot = vehicle.color ? (
    <span className="inline-flex items-center gap-2">
      <span
        className="w-3 h-3 rounded-full border border-gray-300"
        style={{
          backgroundColor:
            vehicle.color.toLowerCase() === 'black' ? '#111827' : vehicle.color.toLowerCase(),
        }}
      />
      {vehicle.color}
    </span>
  ) : (
    '—'
  );

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="p-6 lg:p-8 space-y-0">
            <InfoRow label="Status">
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(vehicle.status)}`}>
                {vehicle.status || '—'}
              </span>
            </InfoRow>
            <InfoRow label="VIN">{vehicle.vin || '—'}</InfoRow>
            <InfoRow label="Business Type">
              {vehicle.business_type ? (
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${businessTypeBadgeClass(vehicle.business_type)}`}>
                  {vehicle.business_type}
                </span>
              ) : (
                '—'
              )}
            </InfoRow>
            <InfoRow label="Color">{colorDot}</InfoRow>
            <InfoRow label="Registration Year">{vehicle.year || '—'}</InfoRow>
            <InfoRow label="Model Type">{vehicle.body_type || '—'}</InfoRow>
            <InfoRow label="Vehicle Type">{vehicle.powertrain_type || vehicle.fuel_type || '—'}</InfoRow>
            <InfoRow label="Seats">{vehicle.seat_count ?? '—'}</InfoRow>
            <InfoRow label="Fuel Tank">
              {vehicle.fuel_tank_capacity_liters != null ? `${vehicle.fuel_tank_capacity_liters} L` : '—'}
            </InfoRow>
            <InfoRow label="IoT Device ID">{vehicle.iot_device_id || '—'}</InfoRow>
            <InfoRow label="License Plate">
              <span className="font-semibold">{vehicle.license_plate || '—'}</span>
            </InfoRow>
            <InfoRow label="Car Name">
              <span className="font-medium">{getCarDisplayName(vehicle)}</span>
            </InfoRow>
          </div>

          <div className="bg-gray-50 p-6 lg:p-8 flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-gray-200">
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              {getCarIdDisplay(vehicle)}
            </p>
            <div className="w-full max-w-md aspect-[4/3] rounded-xl overflow-hidden bg-white border border-gray-200 shadow-inner flex items-center justify-center">
              {vehicle.fleet_image_url ? (
                <img
                  src={vehicle.fleet_image_url}
                  alt={getCarDisplayName(vehicle)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <p className="text-gray-400 text-sm p-8 text-center">
                  Upload a fleet photo in Fleet &amp; Documents
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Wrench}
          label="Maintenance"
          value={profile.counts.maintenance}
          sub="Total service records"
          color="bg-amber-50 border-amber-100"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Incidents"
          value={profile.counts.incidents}
          sub={`${profile.counts.accidents} accident / breakdown`}
          color="bg-red-50 border-red-100"
        />
        <KpiCard
          icon={DollarSign}
          label="Total unit cost"
          value={formatFleetCurrency(profile.costs.total)}
          sub="Purchase + maint. + fuel + incidents"
          color="bg-indigo-50 border-indigo-100"
        />
        <KpiCard
          icon={TrendingUp}
          label="Cost per km"
          value={profile.costs.costPerKm != null ? formatFleetCurrency(profile.costs.costPerKm) : '—'}
          sub={vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} km` : 'No mileage'}
          color="bg-emerald-50 border-emerald-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Maintenance (12 months)</h3>
            <button type="button" onClick={() => onTabChange?.('maintenance')} className="text-sm text-blue-600 hover:underline">
              View all
            </button>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profile.maintenanceByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" name="Jobs" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Incidents (12 months)</h3>
            <button type="button" onClick={() => onTabChange?.('incidents')} className="text-sm text-blue-600 hover:underline">
              View all
            </button>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profile.incidentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" name="Incidents" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Recent maintenance</h3>
        {profile.recentMaintenance.length === 0 ? (
          <p className="text-sm text-gray-500">No maintenance records yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {profile.recentMaintenance.map((r) => (
              <li key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <p className="font-medium text-gray-900">{r.maintenance_type || 'Service'}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{r.description}</p>
                </div>
                <div className="text-sm text-gray-500 shrink-0 sm:text-right">
                  <p>{r.service_date ? new Date(r.service_date).toLocaleDateString() : '—'}</p>
                  <p className="font-medium text-gray-800">{r.cost != null ? formatFleetCurrency(r.cost) : '—'}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FleetRecordOverview;
