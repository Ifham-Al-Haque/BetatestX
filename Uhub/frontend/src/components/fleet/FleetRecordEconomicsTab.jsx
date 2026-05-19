import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { aggregateVehicleProfile, formatFleetCurrency } from '../../utils/fleetRecordUtils';

const FleetRecordEconomicsTab = ({ vehicle, maintenanceRecords, fuelLogs, incidents }) => {
  const profile = useMemo(
    () => aggregateVehicleProfile(vehicle, maintenanceRecords, fuelLogs, incidents),
    [vehicle, maintenanceRecords, fuelLogs, incidents]
  );

  const rows = [
    { label: 'Purchase / acquisition', amount: profile.costs.purchase },
    { label: 'Maintenance', amount: profile.costs.maintenance },
    { label: 'Fuel', amount: profile.costs.fuel },
    { label: 'Incidents & repairs', amount: profile.costs.incidents },
    { label: 'Lease (tracked separately)', amount: profile.costs.lease, note: 'Connect rental agreements in a later phase' },
  ];

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-600">
        Unit economics for this vehicle — total spend attributed to this fleet record. Lease costs can be
        linked when rental agreements are tied to the vehicle.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 rounded-xl bg-indigo-50 border border-indigo-100 p-6">
          <p className="text-sm font-medium text-indigo-800">Total cost to date</p>
          <p className="text-3xl font-bold text-indigo-950 mt-2">{formatFleetCurrency(profile.costs.total)}</p>
          {profile.costs.costPerKm != null && (
            <p className="text-sm text-indigo-700 mt-2">
              {formatFleetCurrency(profile.costs.costPerKm)} per km
            </p>
          )}
        </div>
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-4 h-64">
          {profile.costBreakdown.length === 0 ? (
            <p className="text-sm text-gray-500 p-8 text-center">No cost data recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={profile.costBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {profile.costBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatFleetCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {row.label}
                  {row.note && <span className="block text-xs text-gray-400">{row.note}</span>}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                  {formatFleetCurrency(row.amount)}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-bold">
              <td className="px-6 py-4 text-sm">Total</td>
              <td className="px-6 py-4 text-sm text-right">{formatFleetCurrency(profile.costs.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FleetRecordEconomicsTab;
