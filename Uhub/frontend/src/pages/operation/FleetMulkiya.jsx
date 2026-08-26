import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { FileText, Car, AlertTriangle, Calendar, RefreshCw, Plus, Pencil } from 'lucide-react';
import FleetioLayout from '../../components/operation/FleetioLayout';
import OperationStatCard from '../../components/operation/OperationStatCard';
import OperationEmptyState from '../../components/operation/OperationEmptyState';
import AddMulkiyaModal from '../../components/fleet/AddMulkiyaModal';
import fleetService from '../../services/fleetService';
import { useToast } from '../../context/ToastContext';
import {
  buildMulkiyaMonthSeries,
  summarizeMulkiya,
  expiryStatus,
  EXPIRY_STYLES,
  daysUntil,
  hasMulkiyaData,
  monthKey,
  countByModel,
  vehicleModelLabel,
} from '../../utils/mulkiyaExpiryUtils';

function isPdfUrl(url) {
  return url && !/\.(png|jpe?g|webp|gif)$/i.test(url);
}

function MonthTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0].payload;
  const models = row.byModel || [];
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2.5 min-w-[200px] max-w-[280px]">
      <p className="text-sm font-semibold text-gray-900">{row.label}</p>
      <p className="text-xs text-indigo-700 font-medium mb-2">
        {row.count} car{row.count === 1 ? '' : 's'} expiring
      </p>
      {models.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {models.map((m) => (
            <div key={m.model} className="flex justify-between gap-3 text-xs text-gray-700">
              <span className="truncate">{m.model}</span>
              <span className="font-semibold tabular-nums shrink-0">{m.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MulkiyaCard = ({ vehicle, onEdit }) => {
  const status = expiryStatus(vehicle.registration_expiry);
  const style = EXPIRY_STYLES[status] || EXPIRY_STYLES.none;
  const days = daysUntil(vehicle.registration_expiry);
  const img = vehicle.mulkiya_document_url || vehicle.fleet_image_url;
  const pdf = isPdfUrl(vehicle.mulkiya_document_url);
  const model = vehicleModelLabel(vehicle);

  return (
    <div className="group rounded-xl border border-gray-200 overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all bg-white">
      <Link to={`/operation/fleet-records/${vehicle.id}`} className="block">
        <div className="h-36 bg-slate-100 flex items-center justify-center overflow-hidden">
          {img && !pdf ? (
            <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
          ) : (
            <div className="text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-1" />
              <p className="text-xs">{pdf ? 'PDF attached' : 'No photo'}</p>
            </div>
          )}
        </div>
      </Link>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/operation/fleet-records/${vehicle.id}`} className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{model}</p>
            <p className="text-xs text-gray-500">{vehicle.vehicle_number} · {vehicle.license_plate}</p>
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
              {style.label}
            </span>
            <button
              type="button"
              onClick={() => onEdit(vehicle)}
              className="p-1 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
              title="Edit Mulkiya"
              aria-label="Edit Mulkiya"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Expiry {vehicle.registration_expiry ? new Date(vehicle.registration_expiry).toLocaleDateString() : '—'}
          {days != null && (
            <span className="text-gray-400">
              {' '}· {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
            </span>
          )}
        </p>
        {vehicle.mulkiya_number && (
          <p className="text-xs text-gray-400 mt-1 truncate">No. {vehicle.mulkiya_number}</p>
        )}
      </div>
    </div>
  );
};

const FleetMulkiya = () => {
  const { success, error: showError } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [listMode, setListMode] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async ({ quiet } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const data = await fleetService.getVehicles({ excludeSampleData: true });
      setVehicles(data || []);
    } catch (e) {
      console.error('Load Mulkiya vehicles:', e);
      setVehicles([]);
      showError('Could not load Mulkiya records from Supabase.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => summarizeMulkiya(vehicles), [vehicles]);
  const series = useMemo(() => buildMulkiyaMonthSeries(vehicles, 12, { pastMonths: 3 }), [vehicles]);
  const withMulkiya = useMemo(
    () =>
      vehicles
        .filter(hasMulkiyaData)
        .sort((a, b) => String(a.registration_expiry || '9999').localeCompare(String(b.registration_expiry || '9999'))),
    [vehicles]
  );

  const selected = selectedMonth
    ? series.find((s) => s.key === selectedMonth)
    : series.find((s) => s.count > 0) || series[0];

  const listVehicles = listMode === 'all' ? withMulkiya : (selected?.vehicles || []);
  const modelGroups = useMemo(() => countByModel(listVehicles), [listVehicles]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setModalOpen(true);
  };

  const handleSaved = (saved) => {
    success(editing ? 'Mulkiya updated in Supabase' : 'Mulkiya saved in Supabase');
    const key = monthKey(saved?.registration_expiry);
    if (key) {
      setSelectedMonth(key);
      setListMode('month');
    } else {
      setListMode('all');
    }
    load({ quiet: true });
  };

  if (loading) {
    return (
      <FleetioLayout
        title="Mulkiya"
        description="Registration cards and expiry by month."
        icon={FileText}
      >
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </FleetioLayout>
    );
  }

  return (
    <FleetioLayout
      title="Mulkiya"
      description="Upload registration cards to Supabase, then review expiry dates and how many cars expire each month."
      icon={FileText}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Add Mulkiya
          </button>
        </div>
      }
    >
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 mb-6">
        Add 3–4 Mulkiya here to test the dashboard. Files and expiry dates are stored on the fleet vehicle in Supabase.
        SharePoint sync can replace this manual step later without changing the graphs.
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <OperationStatCard label="With expiry date" value={summary.withDate} tone="blue" icon={Calendar} />
        <OperationStatCard label="Expired" value={summary.expired} tone="red" icon={AlertTriangle} />
        <OperationStatCard label="This month" value={summary.thisMonth} tone="yellow" icon={FileText} />
        <OperationStatCard label="Next 30 days" value={summary.next30} tone="indigo" icon={Car} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Cars expiring by month</h2>
          <p className="text-xs text-gray-500 mb-4">
            Hover a bar for the count by car model. Click to filter the list.
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 22, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} interval={0} angle={-35} textAnchor="end" height={56} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip content={<MonthTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} cursor="pointer" onClick={(data) => {
                  const key = data?.key || data?.payload?.key;
                  if (key) {
                    setSelectedMonth(key);
                    setListMode('month');
                  }
                }}>
                  {series.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={entry.key === selected?.key && listMode === 'month' ? '#4f46e5' : '#93c5fd'}
                    />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="top"
                    formatter={(value) => (value > 0 ? value : '')}
                    style={{ fontSize: 11, fontWeight: 600, fill: '#4338ca' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">By model</h2>
          <p className="text-sm text-gray-600 mb-3">
            {selected?.count
              ? <><span className="font-semibold text-indigo-700">{selected.count}</span> car{selected.count === 1 ? '' : 's'} expire in <span className="font-semibold">{selected.label}</span>.</>
              : <>No cars expire in {selected?.label}.</>}
          </p>
          {(selected?.byModel || []).length > 0 ? (
            <div className="space-y-1.5 max-h-52 overflow-y-auto mb-4">
              {selected.byModel.map((m) => (
                <div key={m.model} className="flex items-center justify-between gap-2 text-sm px-3 py-2 rounded-lg border border-gray-100 bg-slate-50">
                  <span className="truncate font-medium text-gray-800">{m.model}</span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {m.count} {m.count === 1 ? 'car' : 'cars'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-4">Click a month on the graph to see models.</p>
          )}
          <div className="space-y-2">
            {['expired', 'this_month', 'next_30'].map((key) => (
              <div key={key} className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg border ${EXPIRY_STYLES[key].badge}`}>
                <span>{EXPIRY_STYLES[key].label}</span>
                <span className="font-semibold">
                  {key === 'expired' ? summary.expired : key === 'this_month' ? summary.thisMonth : summary.next30}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">
            {listMode === 'all'
              ? `All Mulkiya — ${listVehicles.length}`
              : `${selected?.label || 'Vehicles'} — ${listVehicles.length} vehicle${listVehicles.length === 1 ? '' : 's'}`}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setListMode('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                listMode === 'all' ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All records
            </button>
            <button
              type="button"
              onClick={() => setListMode('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                listMode === 'month' ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Selected month
            </button>
          </div>
        </div>
        {listVehicles.length === 0 ? (
          <OperationEmptyState
            icon={FileText}
            title={listMode === 'all' ? 'No Mulkiya saved yet' : 'No Mulkiya expiring this month'}
            description={
              listMode === 'all'
                ? 'Add a Mulkiya with plate, expiry date, and the registration card file. It will appear here and on the graph.'
                : 'Select another month on the graph, or add a Mulkiya with an expiry in this month.'
            }
            action={
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Add Mulkiya
              </button>
            }
          />
        ) : (
          <div className="p-5 space-y-6">
            {modelGroups.map((group) => (
              <div key={group.model}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">{group.model}</h3>
                  <span className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-100">
                    {group.count} expir{group.count === 1 ? 'y' : 'ies'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.vehicles.map((v) => (
                    <MulkiyaCard key={v.id} vehicle={v} onEdit={openEdit} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddMulkiyaModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        vehicles={vehicles}
        vehicle={editing}
        onSuccess={handleSaved}
      />
    </FleetioLayout>
  );
};

export default FleetMulkiya;
