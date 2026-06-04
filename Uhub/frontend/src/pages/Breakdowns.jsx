import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Plus, MapPin, ExternalLink } from 'lucide-react';
import OperationSubLayout from '../components/operation/OperationSubLayout';
import OperationStatCard from '../components/operation/OperationStatCard';
import OperationEmptyState from '../components/operation/OperationEmptyState';
import operationService from '../services/operationService';
import fleetService from '../services/fleetService';
import { useToast } from '../context/ToastContext';
import { getCarDisplayName } from '../utils/fleetRecordUtils';

const statusBadgeClass = (status) => {
  if (status === 'Open') return 'bg-red-100 text-red-800';
  if (status === 'Under Investigation') return 'bg-amber-100 text-amber-800';
  if (status === 'Resolved' || status === 'Closed') return 'bg-green-100 text-green-800';
  return 'bg-gray-100 text-gray-700';
};

const Breakdowns = () => {
  const { success, error: showError } = useToast();
  const [breakdowns, setBreakdowns] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vehicle_id: '',
    description: '',
    location: '',
    severity: 'Moderate',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [incidents, vehicleList] = await Promise.all([
        operationService.getBreakdownIncidents(),
        fleetService.getVehicles({ excludeSampleData: true }),
      ]);
      setBreakdowns(incidents);
      setVehicles(vehicleList || []);
    } catch {
      showError('Failed to load breakdowns');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = breakdowns.filter((b) => b.status === 'Open').length;
    const repair = breakdowns.filter((b) => b.status === 'Under Investigation').length;
    const resolvedToday = breakdowns.filter((b) => {
      if (b.status !== 'Resolved' && b.status !== 'Closed') return false;
      const d = new Date(b.incident_date);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length;
    return { active, repair, resolvedToday, total: breakdowns.length };
  }, [breakdowns]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicle_id || !form.description.trim()) return;
    setSaving(true);
    try {
      await operationService.createBreakdown({
        vehicle_id: form.vehicle_id,
        description: form.description.trim(),
        location: form.location || null,
        severity: form.severity,
        incident_date: new Date().toISOString(),
        status: 'Open',
      });
      success('Breakdown reported');
      setShowForm(false);
      setForm({ vehicle_id: '', description: '', location: '', severity: 'Moderate' });
      load();
    } catch {
      showError('Failed to report breakdown');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OperationSubLayout
      breadcrumbs={[{ label: 'Breakdowns' }]}
      title="Vehicle Breakdowns"
      description="Track roadside breakdowns and repair status. Linked to Fleet Record incident history."
      icon={AlertTriangle}
      actions={
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Report breakdown
        </button>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OperationStatCard label="Active" value={stats.active} tone="red" sub="Require attention" />
        <OperationStatCard label="Under repair" value={stats.repair} tone="yellow" />
        <OperationStatCard label="Resolved today" value={stats.resolvedToday} tone="green" />
        <OperationStatCard label="Total logged" value={stats.total} tone="blue" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : breakdowns.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl">
          <OperationEmptyState
            icon={AlertTriangle}
            title="No breakdowns recorded"
            description="When a vehicle breaks down, report it here. It will appear on the vehicle's Fleet Record under Incidents."
            action={
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
              >
                Report first breakdown
              </button>
            }
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Vehicle', 'Issue', 'Location', 'Severity', 'Status', 'Date', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakdowns.map((row) => {
                  const v = row.fleet_vehicles;
                  const vehicleLabel = v ? getCarDisplayName(v) : 'Unknown';
                  return (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{vehicleLabel}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{row.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {row.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {row.location}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{row.severity}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(row.incident_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {v?.id && (
                          <Link
                            to={`/operation/fleet-records/${v.id}`}
                            className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            Fleet Record
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <form
            onSubmit={handleSubmit}
            className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report breakdown</h3>
            <div className="space-y-3">
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.vehicle_id}
                onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))}
                required
              >
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {getCarDisplayName(v)} ({v.vehicle_number})
                  </option>
                ))}
              </select>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Describe the issue"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                required
              />
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Location (optional)"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              >
                {['Minor', 'Moderate', 'Major', 'Critical'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </OperationSubLayout>
  );
};

export default Breakdowns;
