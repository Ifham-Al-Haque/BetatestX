import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import {
  FileText, Car, AlertTriangle, Calendar, RefreshCw, Plus, Pencil, Shield, Search, Bell, Clock,
} from 'lucide-react';
import FleetioLayout from '../../components/operation/FleetioLayout';
import OperationStatCard from '../../components/operation/OperationStatCard';
import OperationEmptyState from '../../components/operation/OperationEmptyState';
import AddMulkiyaModal from '../../components/fleet/AddMulkiyaModal';
import fleetService from '../../services/fleetService';
import { dispatchMulkiyaReminders } from '../../services/mulkiyaReminderService';
import { useToast } from '../../context/ToastContext';
import {
  buildMulkiyaMonthSeries,
  buildInsuranceMonthSeries,
  summarizeMulkiya,
  summarizeInsurance,
  expiryStatus,
  EXPIRY_STYLES,
  daysUntil,
  hasMulkiyaData,
  monthKey,
  vehicleModelLabel,
  chassisNumber,
  engineNumber,
  modelYear,
  formatShortDate,
  collectExpiryReminders,
  REMINDER_DAY_OPTIONS,
} from '../../utils/mulkiyaExpiryUtils';

const REMINDER_PREF_KEY = 'uhub.mulkiyaReminderDays';

function isPdfUrl(url) {
  return url && !/\.(png|jpe?g|webp|gif)$/i.test(url);
}

function daysCopy(days) {
  if (days == null) return '';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  return `${days}d left`;
}

function MonthTooltip({ active, payload, noun = 'cars' }) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0].payload;
  const models = row.byModel || [];
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 min-w-[200px] max-w-[280px]">
      <p className="text-sm font-semibold text-gray-900">{row.label}</p>
      <p className="text-xs text-indigo-700 font-medium mb-2">
        {row.count} {noun} expiring
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

function ExpiryBar({ label, date, accent }) {
  const status = expiryStatus(date);
  const style = EXPIRY_STYLES[status] || EXPIRY_STYLES.none;
  const days = daysUntil(date);
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-medium text-gray-600">{label}</span>
        <span className={`px-1.5 py-0.5 rounded-full border ${style.badge}`}>
          {date ? daysCopy(days) : 'No date'}
        </span>
      </div>
      <p className="text-xs text-gray-800 mt-0.5 tabular-nums">{formatShortDate(date)}</p>
      <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: days == null ? '0%' : `${Math.max(8, Math.min(100, days < 0 ? 100 : (days / 365) * 100))}%`,
            background: accent || style.bar,
            opacity: days != null && days < 0 ? 1 : 0.85,
          }}
        />
      </div>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
      <p className={`text-xs text-gray-800 truncate ${mono ? 'font-mono' : 'font-medium'}`}>{value || '—'}</p>
    </div>
  );
}

function UaePlate({ plate }) {
  return (
    <div className="inline-flex items-stretch rounded-md overflow-hidden border-2 border-slate-800 shadow-sm max-w-full">
      <div className="w-7 bg-white border-r border-slate-300 flex flex-col overflow-hidden shrink-0">
        <div className="h-1.5 bg-red-600" />
        <div className="flex-1 flex items-center justify-center bg-white">
          <span className="text-[8px] font-black text-green-700 leading-none">UAE</span>
        </div>
        <div className="h-1.5 bg-black" />
      </div>
      <div className="bg-white px-2.5 py-1 min-w-[6rem]">
        <p className="text-[11px] font-black tracking-[0.16em] text-slate-900 uppercase text-center truncate">
          {plate || 'NO PLATE'}
        </p>
      </div>
    </div>
  );
}

const MulkiyaCard = ({ vehicle, onEdit }) => {
  const mulkiyaStatus = expiryStatus(vehicle.registration_expiry);
  const insuranceStatus = expiryStatus(vehicle.insurance_expiry);
  const urgent = mulkiyaStatus === 'expired' || insuranceStatus === 'expired';
  const img = vehicle.mulkiya_document_url || vehicle.fleet_image_url;
  const pdf = isPdfUrl(vehicle.mulkiya_document_url);
  const year = modelYear(vehicle);

  return (
    <div className={`rounded-2xl border overflow-hidden bg-white hover:border-indigo-300 transition-colors ${
      urgent ? 'border-red-200' : 'border-gray-200'
    }`}>
      <div className={`h-1 ${urgent ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-teal-500'}`} />
      <div className="flex">
        <Link to={`/operation/fleet-records/${vehicle.id}`} className="w-24 shrink-0 bg-slate-100">
          {img && !pdf ? (
            <img src={img} alt="" className="w-full h-full object-cover min-h-[8rem]" />
          ) : (
            <div className="h-full min-h-[8rem] flex items-center justify-center text-slate-400">
              <FileText className="w-7 h-7" />
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <UaePlate plate={vehicle.license_plate} />
              <p className="text-sm font-semibold text-gray-900 mt-1.5 truncate">
                {vehicle.make || '—'} {vehicle.model || ''}
                {year ? <span className="text-gray-500 font-medium"> · {year}</span> : null}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEdit(vehicle)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 shrink-0"
              title="Edit Mulkiya"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
            <Field label="Owned by" value={vehicle.owned_by} />
            <Field label="Model year" value={year} />
            <Field label="Eng No" value={engineNumber(vehicle)} mono />
            <Field label="Chassis No" value={chassisNumber(vehicle)} mono />
          </div>
          <div className="space-y-2">
            <ExpiryBar label="Mulkiya expiry" date={vehicle.registration_expiry} accent="#4f46e5" />
            <ExpiryBar label="Insurance expiry" date={vehicle.insurance_expiry} accent="#0f766e" />
          </div>
        </div>
      </div>
    </div>
  );
};

function ExpiryChart({ title, hint, series, selectedKey, active, color, activeColor, activeBorder, onSelectBar, tooltipNoun }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${active ? (activeBorder || 'border-indigo-300') : 'border-gray-200'}`}>
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      <p className="text-xs text-gray-500 mb-4">{hint}</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ top: 22, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} interval={0} angle={-35} textAnchor="end" height={52} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip content={<MonthTooltip noun={tooltipNoun} />} cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }} />
            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              cursor="pointer"
              onClick={(data) => {
                const key = data?.key || data?.payload?.key;
                if (key) onSelectBar(key);
              }}
            >
              {series.map((entry) => (
                <Cell key={entry.key} fill={entry.key === selectedKey && active ? activeColor : color} />
              ))}
              <LabelList
                dataKey="count"
                position="top"
                formatter={(value) => (value > 0 ? value : '')}
                style={{ fontSize: 10, fontWeight: 600, fill: '#334155' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const FleetMulkiya = () => {
  const { success, error: showError } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [listMode, setListMode] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [reminderDays, setReminderDays] = useState(() => {
    const stored = Number(localStorage.getItem(REMINDER_PREF_KEY));
    return REMINDER_DAY_OPTIONS.includes(stored) ? stored : 30;
  });

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

  const withMulkiya = useMemo(
    () =>
      vehicles
        .filter(hasMulkiyaData)
        .sort((a, b) => String(a.registration_expiry || '9999').localeCompare(String(b.registration_expiry || '9999'))),
    [vehicles]
  );

  const reminders = useMemo(
    () => collectExpiryReminders(withMulkiya, { daysBefore: reminderDays }),
    [withMulkiya, reminderDays]
  );

  useEffect(() => {
    if (!withMulkiya.length) return undefined;
    const timer = setTimeout(() => {
      dispatchMulkiyaReminders(withMulkiya, { daysBefore: reminderDays }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [withMulkiya, reminderDays]);

  const mulkiyaSummary = useMemo(() => summarizeMulkiya(vehicles), [vehicles]);
  const insuranceSummary = useMemo(() => summarizeInsurance(vehicles), [vehicles]);
  const mulkiyaSeries = useMemo(() => buildMulkiyaMonthSeries(vehicles, 10, { pastMonths: 2 }), [vehicles]);
  const insuranceSeries = useMemo(() => buildInsuranceMonthSeries(vehicles, 10, { pastMonths: 2 }), [vehicles]);

  const selectedSeries = listMode === 'insurance' ? insuranceSeries : mulkiyaSeries;
  const selected = selectedMonth ? selectedSeries.find((s) => s.key === selectedMonth) : null;

  const listVehicles = useMemo(() => {
    let base = withMulkiya;
    if (listMode === 'mulkiya' && selectedMonth) base = selected?.vehicles || [];
    else if (listMode === 'insurance' && selectedMonth) base = selected?.vehicles || [];
    else if (listMode === 'mulkiya') base = withMulkiya.filter((v) => v.registration_expiry);
    else if (listMode === 'insurance') base = withMulkiya.filter((v) => v.insurance_expiry);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((v) => {
      const blob = [
        v.license_plate, v.make, v.model, v.owned_by, v.vehicle_number,
        engineNumber(v), chassisNumber(v), modelYear(v),
      ].join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [listMode, withMulkiya, selected, selectedMonth, query]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (v) => { setEditing(v); setModalOpen(true); };

  const handleSaved = (saved) => {
    success(editing ? 'Mulkiya updated' : 'Mulkiya saved');
    const key = monthKey(saved?.registration_expiry);
    if (key) {
      setSelectedMonth(key);
      setListMode('mulkiya');
    } else {
      setListMode('all');
    }
    load({ quiet: true });
  };

  const onReminderDays = (value) => {
    const next = Number(value);
    setReminderDays(next);
    localStorage.setItem(REMINDER_PREF_KEY, String(next));
  };

  if (loading) {
    return (
      <FleetioLayout title="Mulkiya" description="Registration, insurance, and expiry reminders." icon={FileText}>
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </FleetioLayout>
    );
  }

  const expiredReminders = reminders.filter((r) => r.bucket === 'expired').length;
  const upcomingReminders = reminders.length - expiredReminders;

  return (
    <FleetioLayout
      title="Mulkiya"
      description="License, ownership, Mulkiya and insurance expiry — with reminders before due dates."
      icon={FileText}
      actions={
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Plus className="w-4 h-4" />
            Add Mulkiya
          </button>
        </div>
      }
    >
      <div className={`rounded-2xl border p-4 mb-6 ${expiredReminders ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${expiredReminders ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Expiry reminders</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {reminders.length === 0
                  ? `Nothing due in the next ${reminderDays} days.`
                  : `${expiredReminders} expired · ${upcomingReminders} due within ${reminderDays} days. Operation and admin get a bell alert for items due in 7 days or already expired.`}
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            Alert window
            <select
              value={reminderDays}
              onChange={(e) => onReminderDays(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-sm"
            >
              {REMINDER_DAY_OPTIONS.map((d) => (
                <option key={d} value={d}>{d} days before</option>
              ))}
            </select>
          </label>
        </div>
        {reminders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {reminders.slice(0, 12).map((item) => (
              <button
                key={`${item.id}-${item.kind}`}
                type="button"
                onClick={() => openEdit(item.vehicle)}
                className="text-left px-3 py-2 rounded-xl bg-white border border-white/80 hover:border-indigo-200"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold tracking-wide text-slate-800">{item.license_plate || item.vehicle_number}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${EXPIRY_STYLES[item.days < 0 ? 'expired' : item.days <= 7 ? 'next_30' : 'this_month'].badge}`}>
                    {item.label} · {daysCopy(item.days)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  {vehicleModelLabel(item.vehicle)} · {formatShortDate(item.date)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OperationStatCard label="Mulkiya expired" value={mulkiyaSummary.expired} tone="red" icon={AlertTriangle} sub={`${mulkiyaSummary.next30} in next 30 days`} />
        <OperationStatCard label="Mulkiya this month" value={mulkiyaSummary.thisMonth} tone="yellow" icon={Calendar} />
        <OperationStatCard label="Insurance expired" value={insuranceSummary.expired} tone="red" icon={Shield} sub={`${insuranceSummary.next30} in next 30 days`} />
        <OperationStatCard label="Insurance this month" value={insuranceSummary.thisMonth} tone="indigo" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-8">
        <ExpiryChart
          title="Mulkiya expiry by month"
          hint="Click a bar to list cars whose registration card expires that month."
          series={mulkiyaSeries}
          selectedKey={listMode === 'mulkiya' ? selectedMonth : null}
          active={listMode === 'mulkiya'}
          color="#93c5fd"
          activeColor="#4f46e5"
          activeBorder="border-indigo-300 ring-1 ring-indigo-100"
          tooltipNoun="Mulkiya"
          onSelectBar={(key) => { setSelectedMonth(key); setListMode('mulkiya'); }}
        />
        <ExpiryChart
          title="Insurance expiry by month"
          hint="Same calendar for car insurance on these records — teal bars, independent of Mulkiya."
          series={insuranceSeries}
          selectedKey={listMode === 'insurance' ? selectedMonth : null}
          active={listMode === 'insurance'}
          color="#99f6e4"
          activeColor="#0f766e"
          activeBorder="border-teal-300 ring-1 ring-teal-100"
          tooltipNoun="policies"
          onSelectBar={(key) => { setSelectedMonth(key); setListMode('insurance'); }}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {listMode === 'all'
                ? `All records — ${listVehicles.length}`
                : selectedMonth && selected
                  ? `${listMode === 'insurance' ? 'Insurance' : 'Mulkiya'} · ${selected.label} — ${listVehicles.length}`
                  : `${listMode === 'insurance' ? 'Insurance' : 'Mulkiya'} records — ${listVehicles.length}`}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Plate, make, model, year, owner, both expiries, engine and chassis.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search plate, make, chassis…"
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg w-52"
              />
            </div>
            {['all', 'mulkiya', 'insurance'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setListMode(mode);
                  if (mode === 'all') setSelectedMonth(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${
                  listMode === mode ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {mode === 'all' ? 'All records' : mode}
              </button>
            ))}
          </div>
        </div>
        {listVehicles.length === 0 ? (
          <OperationEmptyState
            icon={Car}
            title={listMode === 'all' ? 'No Mulkiya saved yet' : 'No vehicles in this month'}
            description={
              listMode === 'all'
                ? 'Add a record with plate, make, model, year, owner, Mulkiya expiry, insurance expiry, engine and chassis numbers.'
                : 'Pick another month on the matching graph, or switch back to all records.'
            }
            action={
              <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Plus className="w-4 h-4" />
                Add Mulkiya
              </button>
            }
          />
        ) : (
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {listVehicles.map((v) => (
              <MulkiyaCard key={v.id} vehicle={v} onEdit={openEdit} />
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
