import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  Ticket,
  Layers,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import FleetioLayout from '../../components/operation/FleetioLayout';
import OperationStatCard from '../../components/operation/OperationStatCard';
import OperationEmptyState from '../../components/operation/OperationEmptyState';
import ConfirmDialog from '../../components/operation/ConfirmDialog';
import fleetPmService from '../../services/fleetPmService';
import fleetService from '../../services/fleetService';
import { useToast } from '../../context/ToastContext';

const MAINTENANCE_TYPES = ['Preventive', 'Oil Change', 'Tyre Rotation', 'Inspection', 'Brake Service', 'General'];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

const FleetPmSchedules = () => {
  const { success, error: showError } = useToast();
  const [templates, setTemplates] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tablesMissing, setTablesMissing] = useState(false);
  const [activeTab, setActiveTab] = useState('schedules');
  const [confirm, setConfirm] = useState(null);

  const [templateForm, setTemplateForm] = useState({
    name: '',
    maintenance_type: 'Preventive',
    interval_km: '',
    interval_days: '',
    description: '',
  });
  const [assignForm, setAssignForm] = useState({
    vehicle_id: '',
    template_id: '',
    next_due_date: '',
    next_due_mileage: '',
  });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tpls, scheds, vehs] = await Promise.all([
        fleetPmService.getTemplates(),
        fleetPmService.getSchedules(),
        fleetService.getVehicles({ excludeSampleData: true }).catch(() => []),
      ]);
      setTemplates(tpls);
      setSchedules(scheds);
      setVehicles(vehs || []);
      // Tables return [] on 42P01; detect "missing" only when both empty AND a probe insert would fail.
      setTablesMissing(false);
    } catch (err) {
      if (err.code === '42P01') {
        setTablesMissing(true);
      } else {
        showError('Failed to load preventive maintenance data');
      }
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const dueSoon = schedules.filter((s) => {
      const d = daysUntil(s.next_due_date);
      return d !== null && d >= 0 && d <= 30;
    }).length;
    const overdue = schedules.filter((s) => {
      const d = daysUntil(s.next_due_date);
      return d !== null && d < 0;
    }).length;
    return {
      templates: templates.length,
      schedules: schedules.length,
      dueSoon,
      overdue,
    };
  }, [templates, schedules]);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!templateForm.name.trim()) return;
    setSavingTemplate(true);
    try {
      await fleetPmService.createTemplate({
        name: templateForm.name.trim(),
        description: templateForm.description.trim() || null,
        maintenance_type: templateForm.maintenance_type,
        interval_km: templateForm.interval_km ? parseInt(templateForm.interval_km, 10) : null,
        interval_days: templateForm.interval_days ? parseInt(templateForm.interval_days, 10) : null,
      });
      success('PM template created');
      setTemplateForm({ name: '', maintenance_type: 'Preventive', interval_km: '', interval_days: '', description: '' });
      load();
    } catch (err) {
      if (err.code === '42P01') {
        setTablesMissing(true);
        showError('PM tables are missing. Run the PM migration in Supabase.');
      } else {
        showError('Could not create template');
      }
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.vehicle_id || !assignForm.template_id) {
      showError('Select a vehicle and a template');
      return;
    }
    setSavingAssign(true);
    try {
      await fleetPmService.assignTemplateToVehicle(
        assignForm.vehicle_id,
        assignForm.template_id,
        assignForm.next_due_date || null,
        assignForm.next_due_mileage ? parseInt(assignForm.next_due_mileage, 10) : null
      );
      success('PM schedule assigned to vehicle');
      setAssignForm({ vehicle_id: '', template_id: '', next_due_date: '', next_due_mileage: '' });
      load();
    } catch (err) {
      if (err.code === '42P01') {
        setTablesMissing(true);
        showError('PM tables are missing. Run the PM migration in Supabase.');
      } else {
        showError('Could not assign schedule');
      }
    } finally {
      setSavingAssign(false);
    }
  };

  const handleMarkCompleted = async (schedule) => {
    try {
      await fleetPmService.markCompleted(schedule.id, schedule.fleet_vehicles?.mileage ?? null);
      success('PM marked completed; next due recalculated');
      load();
    } catch {
      showError('Could not mark completed');
    }
  };

  const handleCreateTicket = async (schedule) => {
    try {
      const ticket = await fleetPmService.createTicketForDueSchedule(schedule);
      if (ticket) success('Work order created from PM schedule');
      else showError('Missing vehicle/template details for this schedule');
    } catch {
      showError('Could not create work order');
    }
  };

  const handleDeleteSchedule = (schedule) => {
    setConfirm({
      title: 'Remove PM schedule',
      message: `Remove "${schedule.fleet_pm_templates?.name || 'this PM'}" from ${schedule.fleet_vehicles?.vehicle_number || 'this vehicle'}?`,
      onConfirm: async () => {
        try {
          await fleetPmService.deleteSchedule(schedule.id);
          success('PM schedule removed');
          load();
        } catch {
          showError('Could not remove schedule');
        } finally {
          setConfirm(null);
        }
      },
    });
  };

  const dueBadge = (dateStr) => {
    const d = daysUntil(dateStr);
    if (d === null) return <span className="text-xs text-gray-400">No due date</span>;
    if (d < 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Overdue {Math.abs(d)}d</span>;
    if (d <= 7) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">Due in {d}d</span>;
    if (d <= 30) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">Due in {d}d</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">Due in {d}d</span>;
  };

  return (
    <FleetioLayout
      title="Preventive Maintenance"
      description="Create recurring PM templates and assign service schedules to vehicles. Due items appear on the Fleet Dashboard."
      icon={CalendarClock}
      actions={
        <button
          type="button"
          onClick={load}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1 bg-white"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      }
    >
      {tablesMissing && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          PM tables (<code className="text-xs bg-amber-100 px-1 rounded">fleet_pm_templates</code>,{' '}
          <code className="text-xs bg-amber-100 px-1 rounded">fleet_pm_schedules</code>) are not set up. Run{' '}
          <code className="text-xs bg-amber-100 px-1 rounded">supabase/migrations/20250303_fleet_offboarding_pm.sql</code> in Supabase.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OperationStatCard icon={Layers} label="PM templates" value={stats.templates} tone="blue" />
        <OperationStatCard icon={CalendarClock} label="Active schedules" value={stats.schedules} tone="indigo" />
        <OperationStatCard icon={Clock} label="Due in 30 days" value={stats.dueSoon} tone="yellow" />
        <OperationStatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} tone="red" />
      </div>

      <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        {[
          { id: 'schedules', label: 'Vehicle schedules' },
          { id: 'templates', label: 'PM templates' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
              activeTab === t.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : activeTab === 'schedules' ? (
        <div className="space-y-6">
          <form onSubmit={handleAssign} className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" /> Assign PM schedule to a vehicle
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={assignForm.vehicle_id}
                onChange={(e) => setAssignForm((f) => ({ ...f, vehicle_id: e.target.value }))}
                required
              >
                <option value="">Select vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} – {v.make} {v.model}
                  </option>
                ))}
              </select>
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={assignForm.template_id}
                onChange={(e) => setAssignForm((f) => ({ ...f, template_id: e.target.value }))}
                required
              >
                <option value="">Select template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={assignForm.next_due_date}
                onChange={(e) => setAssignForm((f) => ({ ...f, next_due_date: e.target.value }))}
                placeholder="Next due date"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
                  value={assignForm.next_due_mileage}
                  onChange={(e) => setAssignForm((f) => ({ ...f, next_due_mileage: e.target.value }))}
                  placeholder="Due km"
                />
                <button
                  type="submit"
                  disabled={savingAssign}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 whitespace-nowrap"
                >
                  {savingAssign ? 'Saving…' : 'Assign'}
                </button>
              </div>
            </div>
            {templates.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">Create a PM template first (PM templates tab).</p>
            )}
          </form>

          {schedules.length === 0 ? (
            <OperationEmptyState
              icon={CalendarClock}
              title="No PM schedules yet"
              description="Assign a PM template to a vehicle to start tracking recurring service. Due items will appear on the Fleet Dashboard."
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Vehicle</th>
                    <th className="text-left px-4 py-3 font-medium">PM template</th>
                    <th className="text-left px-4 py-3 font-medium">Next due</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schedules.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{s.fleet_vehicles?.vehicle_number || '—'}</p>
                        <p className="text-xs text-gray-500">
                          {s.fleet_vehicles?.make} {s.fleet_vehicles?.model}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{s.fleet_pm_templates?.name || '—'}</p>
                        <p className="text-xs text-gray-500">
                          {s.fleet_pm_templates?.interval_km ? `${s.fleet_pm_templates.interval_km} km` : ''}
                          {s.fleet_pm_templates?.interval_km && s.fleet_pm_templates?.interval_days ? ' · ' : ''}
                          {s.fleet_pm_templates?.interval_days ? `${s.fleet_pm_templates.interval_days} days` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {s.next_due_date ? new Date(s.next_due_date).toLocaleDateString() : '—'}
                        {s.next_due_mileage ? <span className="block text-xs text-gray-400">{s.next_due_mileage.toLocaleString()} km</span> : null}
                      </td>
                      <td className="px-4 py-3">{dueBadge(s.next_due_date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleMarkCompleted(s)}
                            title="Mark completed"
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCreateTicket(s)}
                            title="Create work order"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Ticket className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(s)}
                            title="Remove schedule"
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <form onSubmit={handleCreateTemplate} className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" /> Create PM template
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Template name (e.g. Oil change every 10,000 km)"
                value={templateForm.name}
                onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={templateForm.maintenance_type}
                onChange={(e) => setTemplateForm((f) => ({ ...f, maintenance_type: e.target.value }))}
              >
                {MAINTENANCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Description (optional)"
                value={templateForm.description}
                onChange={(e) => setTemplateForm((f) => ({ ...f, description: e.target.value }))}
              />
              <input
                type="number"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Interval km (e.g. 10000)"
                value={templateForm.interval_km}
                onChange={(e) => setTemplateForm((f) => ({ ...f, interval_km: e.target.value }))}
              />
              <input
                type="number"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Interval days (e.g. 180)"
                value={templateForm.interval_days}
                onChange={(e) => setTemplateForm((f) => ({ ...f, interval_days: e.target.value }))}
              />
              <button
                type="submit"
                disabled={savingTemplate}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                {savingTemplate ? 'Saving…' : 'Create template'}
              </button>
            </div>
          </form>

          {templates.length === 0 ? (
            <OperationEmptyState
              icon={Layers}
              title="No PM templates yet"
              description="Templates define recurring service rules (interval by km or days). Assign them to vehicles to generate due reminders."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((t) => (
                <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{t.name}</h4>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                        {t.maintenance_type || 'Preventive'}
                      </span>
                    </div>
                  </div>
                  {t.description && <p className="text-sm text-gray-500 mt-2">{t.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                    {t.interval_km ? <span className="px-2 py-1 bg-gray-50 rounded">Every {t.interval_km.toLocaleString()} km</span> : null}
                    {t.interval_days ? <span className="px-2 py-1 bg-gray-50 rounded">Every {t.interval_days} days</span> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </FleetioLayout>
  );
};

export default FleetPmSchedules;
