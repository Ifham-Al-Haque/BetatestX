import React, { useEffect, useState } from 'react';
import { CalendarDays, Plus, Unlink } from 'lucide-react';
import leaveService, {
  formatDubaiDate,
  formatLeaveUnits,
  isAttendanceSchemaMissing,
  leaveTypeMeta,
  remainingOf,
} from '../../services/leaveService';
import LeaveRequestModal from './LeaveRequestModal';

function statusClass(status) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700';
  if (status === 'rejected') return 'bg-rose-50 text-rose-700';
  if (status === 'cancelled') return 'bg-gray-100 text-gray-600';
  return 'bg-amber-50 text-amber-800';
}

const EmployeeLeavePanel = ({ employeeId }) => {
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [payload, setPayload] = useState(null);
  const [canRequest, setCanRequest] = useState(false);
  const [open, setOpen] = useState(false);

  const load = () => {
    if (!employeeId) return;
    setLoading(true);
    Promise.all([
      leaveService.getForEmployee(employeeId),
      leaveService.isSelfEmployee(employeeId),
    ])
      .then(([data, self]) => {
        setPayload(data);
        setCanRequest(self);
        setSchemaMissing(false);
      })
      .catch((err) => {
        if (isAttendanceSchemaMissing(err)) setSchemaMissing(true);
        setPayload(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  if (schemaMissing) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        Leave tables are not set up yet. Run <code>create_leave_system.sql</code> in Supabase.
      </div>
    );
  }

  if (loading) {
    return <div className="h-40 rounded-2xl bg-white border border-gray-200 animate-pulse" />;
  }

  const balances = payload?.balances || [];
  const requests = payload?.requests || [];

  if (!payload?.linked && !canRequest) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <Unlink className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-900">No leave on this profile yet</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          Leave is requested from the linked UHub account. When this employee is linked and applies,
          balances and history will show here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {canRequest ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700"
          >
            <Plus className="w-4 h-4" />
            Request leave
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {balances.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
            Balances appear after the linked UHub user opens Leave (or after the first request).
          </div>
        ) : (
          balances.map((b) => (
            <div key={b.id || b.leave_type} className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">{leaveTypeMeta(b.leave_type).label}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {formatLeaveUnits(remainingOf(b), leaveTypeMeta(b.leave_type).unit)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {formatLeaveUnits(b.taken, leaveTypeMeta(b.leave_type).unit)} taken
                {Number(b.pending) ? ` · ${formatLeaveUnits(b.pending, leaveTypeMeta(b.leave_type).unit)} pending` : ''}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-semibold text-gray-900">Leave history</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-2 font-medium">Type</th>
                <th className="text-left px-5 py-2 font-medium">Dates</th>
                <th className="text-left px-5 py-2 font-medium">Units</th>
                <th className="text-left px-5 py-2 font-medium">Status</th>
                <th className="text-left px-5 py-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-gray-500 text-center">
                    No leave requests yet.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-2.5">{leaveTypeMeta(r.leave_type).label}</td>
                    <td className="px-5 py-2.5">
                      {formatDubaiDate(r.start_date)}
                      {r.end_date !== r.start_date ? ` → ${formatDubaiDate(r.end_date)}` : ''}
                    </td>
                    <td className="px-5 py-2.5">{formatLeaveUnits(r.units, r.unit)}</td>
                    <td className="px-5 py-2.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusClass(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-gray-600 max-w-xs">{r.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LeaveRequestModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmitted={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
};

export default EmployeeLeavePanel;
