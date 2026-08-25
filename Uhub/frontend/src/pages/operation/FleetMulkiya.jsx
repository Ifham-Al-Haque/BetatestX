import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { FileText, Car, AlertTriangle, Calendar, RefreshCw } from 'lucide-react';
import FleetioLayout from '../../components/operation/FleetioLayout';
import OperationStatCard from '../../components/operation/OperationStatCard';
import OperationEmptyState from '../../components/operation/OperationEmptyState';
import fleetService from '../../services/fleetService';
import { getCarDisplayName } from '../../utils/fleetRecordUtils';
import {
  buildMulkiyaMonthSeries,
  summarizeMulkiya,
  expiryStatus,
  EXPIRY_STYLES,
  daysUntil,
} from '../../utils/mulkiyaExpiryUtils';

const FleetMulkiya = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fleetService.getVehicles({ excludeSampleData: true });
      setVehicles(data || []);
    } catch (e) {
      console.error('Load Mulkiya vehicles:', e);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => summarizeMulkiya(vehicles), [vehicles]);
  const series = useMemo(() => buildMulkiyaMonthSeries(vehicles, 12), [vehicles]);

  const selected = selectedMonth
    ? series.find((s) => s.key === selectedMonth)
    : series.find((s) => s.count > 0) || series[0];

  const listVehicles = selected?.vehicles || [];

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
      description="Display-only registration expiry from Fleet Records. SharePoint sync can refresh this snapshot later without changing files in SharePoint."
      icon={FileText}
      actions={
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      }
    >
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 mb-6">
        Showing the latest data saved in Uhub. When SharePoint sync is connected, use <span className="font-semibold">Sync</span> after you update Mulkiya files on the FleetRegistration site.
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
          <p className="text-xs text-gray-500 mb-4">Click a bar to see which vehicles expire that month.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} interval={0} angle={-35} textAnchor="end" height={56} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip
                  formatter={(value) => [`${value} car${value === 1 ? '' : 's'}`, 'Expiring']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} cursor="pointer" onClick={(data) => {
                  const key = data?.key || data?.payload?.key;
                  if (key) setSelectedMonth(key);
                }}>
                  {series.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={entry.key === selected?.key ? '#4f46e5' : '#93c5fd'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Highlight</h2>
          <p className="text-sm text-gray-600 mb-4">
            {selected?.count
              ? <><span className="font-semibold text-indigo-700">{selected.count}</span> car{selected.count === 1 ? '' : 's'} expire in <span className="font-semibold">{selected.label}</span>.</>
              : <>No cars expire in {selected?.label}.</>}
          </p>
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
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            {selected?.label || 'Vehicles'} — {listVehicles.length} vehicle{listVehicles.length === 1 ? '' : 's'}
          </h2>
        </div>
        {listVehicles.length === 0 ? (
          <OperationEmptyState
            icon={FileText}
            title="No Mulkiya expiring this month"
            description="Select another month on the graph, or add registration expiry on the Fleet Record."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {listVehicles.map((v) => {
              const status = expiryStatus(v.registration_expiry);
              const style = EXPIRY_STYLES[status] || EXPIRY_STYLES.none;
              const days = daysUntil(v.registration_expiry);
              const img = v.mulkiya_document_url || v.fleet_image_url;
              const isPdf = v.mulkiya_document_url && !/\.(png|jpe?g|webp|gif)$/i.test(v.mulkiya_document_url);
              return (
                <Link
                  key={v.id}
                  to={`/operation/fleet-records/${v.id}`}
                  className="group rounded-xl border border-gray-200 overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all bg-white"
                >
                  <div className="h-36 bg-slate-100 flex items-center justify-center overflow-hidden">
                    {img && !isPdf ? (
                      <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
                    ) : (
                      <div className="text-center text-slate-400">
                        <FileText className="w-10 h-10 mx-auto mb-1" />
                        <p className="text-xs">{isPdf ? 'PDF attached' : 'No photo'}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{getCarDisplayName(v)}</p>
                        <p className="text-xs text-gray-500">{v.vehicle_number} · {v.license_plate}</p>
                      </div>
                      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Expiry {v.registration_expiry ? new Date(v.registration_expiry).toLocaleDateString() : '—'}
                      {days != null && (
                        <span className="text-gray-400">
                          {' '}· {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                        </span>
                      )}
                    </p>
                    {v.mulkiya_number && (
                      <p className="text-xs text-gray-400 mt-1 truncate">No. {v.mulkiya_number}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </FleetioLayout>
  );
};

export default FleetMulkiya;
