import React, { useCallback, useEffect, useState } from 'react';
import { Clock, LogIn, LogOut, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import attendanceService, {
  elapsedHoursSince,
  formatDubaiTime,
  formatHours,
  isAttendanceSchemaMissing,
} from '../../services/attendanceService';

function liveHoursLabel(clockIn) {
  return formatHours(elapsedHoursSince(clockIn));
}

const ClockInOutWidget = ({ variant = 'light', onChanged }) => {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [today, setToday] = useState(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await attendanceService.getMyToday();
      setToday(data);
      setSchemaMissing(false);
    } catch (err) {
      if (isAttendanceSchemaMissing(err)) {
        setSchemaMissing(true);
      } else {
        showError('Attendance', err.message || 'Could not load attendance');
      }
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const day = today?.day;
  const clockedIn = Boolean(day?.clock_in && !day?.clock_out);

  useEffect(() => {
    if (!clockedIn) return undefined;
    const id = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, [clockedIn]);

  const handleClock = async (type) => {
    setSaving(true);
    try {
      await attendanceService.clock(type);
      await load();
      success(type === 'in' ? 'Clocked in' : 'Clocked out', 'Your attendance was saved to your UHub account.');
      onChanged?.();
    } catch (err) {
      if (isAttendanceSchemaMissing(err)) {
        setSchemaMissing(true);
      } else {
        showError('Attendance', err.message || 'Could not save punch');
      }
    } finally {
      setSaving(false);
    }
  };

  const isDark = variant === 'dark';
  const shell = isDark
    ? 'bg-white/[0.07] border-white/12 text-white'
    : 'bg-white border-gray-200 text-gray-900';
  const muted = isDark ? 'text-blue-100/80' : 'text-gray-500';
  const value = isDark ? 'text-white' : 'text-gray-900';

  if (schemaMissing) {
    return (
      <div className={`rounded-2xl border p-5 ${shell}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`w-5 h-5 mt-0.5 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
          <div>
            <p className={`font-semibold ${value}`}>Attendance tables are not set up yet</p>
            <p className={`text-sm mt-1 ${muted}`}>
              Run <code className="text-xs">create_user_attendance.sql</code> in the Supabase SQL editor, then refresh.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-5 ${shell}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className={`text-xs uppercase tracking-wide font-medium ${muted}`}>Today · Dubai</p>
          <h3 className={`text-lg font-semibold mt-1 ${value}`}>Clock in / out</h3>
          <p className={`text-sm mt-1 ${muted}`}>Saved on your UHub account. Shows on your employee record if one is linked.</p>
        </div>
        <div className={`p-2 rounded-xl ${isDark ? 'bg-white/10' : 'bg-blue-50'}`}>
          <Clock className={`w-5 h-5 ${isDark ? 'text-emerald-300' : 'text-blue-600'}`} />
        </div>
      </div>

      {loading ? (
        <div className={`h-16 rounded-xl animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <p className={`text-xs ${muted}`}>Clock in</p>
              <p className={`text-sm font-semibold mt-0.5 ${value}`}>{formatDubaiTime(day?.clock_in)}</p>
            </div>
            <div>
              <p className={`text-xs ${muted}`}>Clock out</p>
              <p className={`text-sm font-semibold mt-0.5 ${value}`}>{formatDubaiTime(day?.clock_out)}</p>
            </div>
            <div>
              <p className={`text-xs ${muted}`}>Hours</p>
              <p className={`text-sm font-semibold mt-0.5 ${value}`}>
                {day?.clock_out
                  ? formatHours(day.total_hours)
                  : clockedIn
                    ? liveHoursLabel(day.clock_in)
                    : '—'}
                <span className="sr-only">{tick}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving || clockedIn || Boolean(day?.clock_out)}
              onClick={() => handleClock('in')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              Clock in
            </button>
            <button
              type="button"
              disabled={saving || !clockedIn}
              onClick={() => handleClock('out')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-4 h-4" />
              Clock out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ClockInOutWidget;
