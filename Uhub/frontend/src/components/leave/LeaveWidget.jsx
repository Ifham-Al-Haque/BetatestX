import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import leaveService, {
  formatLeaveUnits,
  isAttendanceSchemaMissing,
  leaveTypeMeta,
  remainingOf,
} from '../../services/leaveService';
import LeaveRequestModal from './LeaveRequestModal';

const LeaveWidget = ({ variant = 'light', onChanged }) => {
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [balances, setBalances] = useState([]);
  const [open, setOpen] = useState(false);
  const isDark = variant === 'dark';

  const load = useCallback(async () => {
    try {
      const data = await leaveService.getMyBalances();
      setBalances(data.balances || []);
      setSchemaMissing(false);
    } catch (err) {
      if (isAttendanceSchemaMissing(err)) setSchemaMissing(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shell = isDark
    ? 'bg-white/[0.08] border-white/15 text-white backdrop-blur-md'
    : 'bg-white border-gray-200 text-gray-900 shadow-sm';
  const muted = isDark ? 'text-blue-100/75' : 'text-gray-500';
  const value = isDark ? 'text-white' : 'text-gray-900';

  const highlight = ['annual', 'sick', 'casual', 'wfh'];
  const cards = highlight
    .map((code) => balances.find((b) => b.leave_type === code))
    .filter(Boolean);

  if (schemaMissing) {
    return (
      <div className={`rounded-2xl border p-5 ${shell}`}>
        <p className={`font-semibold ${value}`}>Leave is not connected yet</p>
        <p className={`text-sm mt-1 ${muted}`}>
          Run <code className="text-xs">create_leave_system.sql</code> in the Supabase SQL editor, then refresh.
        </p>
      </div>
    );
  }

  return (
    <>
    <div className={`rounded-2xl border p-5 ${shell}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className={`text-xs uppercase tracking-[0.16em] font-medium ${muted}`}>Time off</p>
          <h3 className={`text-lg font-semibold mt-1 ${value}`}>Leave</h3>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700"
        >
          <Plus className="w-4 h-4" />
          Request
        </button>
      </div>

      {loading ? (
        <div className={`h-20 rounded-2xl animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {(cards.length ? cards : highlight.map((code) => ({ leave_type: code, entitled: 0, taken: 0, pending: 0 }))).map((b) => (
            <div
              key={b.leave_type}
              className={`rounded-xl border px-3 py-2.5 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-100 bg-slate-50'}`}
            >
              <p className={`text-[11px] ${muted}`}>{leaveTypeMeta(b.leave_type).label}</p>
              <p className={`text-lg font-semibold tabular-nums ${value}`}>
                {formatLeaveUnits(remainingOf(b), leaveTypeMeta(b.leave_type).unit)}
              </p>
              <p className={`text-[11px] ${muted}`}>remaining</p>
            </div>
          ))}
        </div>
      )}
      <p className={`text-[11px] mt-3 ${muted}`}>
        <CalendarDays className="w-3 h-3 inline mr-1" />
        Short leave, half day, festive, and unpaid are in Request. HR must approve.
      </p>
      />
    </div>
    <LeaveRequestModal
      open={open}
      onClose={() => setOpen(false)}
      onSubmitted={() => {
        setOpen(false);
        load();
        onChanged?.();
      }}
    />
    </>
  );
};

export default LeaveWidget;
