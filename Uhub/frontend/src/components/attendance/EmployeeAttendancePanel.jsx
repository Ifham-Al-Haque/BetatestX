import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Link2, Unlink } from 'lucide-react';
import attendanceService, {
  formatDubaiDate,
  formatDubaiTime,
  formatHours,
  isAttendanceSchemaMissing,
} from '../../services/attendanceService';
import AttendanceCalendar from './AttendanceCalendar';

const EmployeeAttendancePanel = ({ employeeId, employee = null }) => {
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [payload, setPayload] = useState(null);
  const [cursor, setCursor] = useState(() => attendanceService.monthRange());
  const [selectedDate, setSelectedDate] = useState(null);

  const hintEmail = employee?.email || '';
  const hintStaffCode = employee?.employee_id || '';
  const hintAuth = employee?.auth_user_id || '';

  useEffect(() => {
    let cancelled = false;
    if (!employeeId) return undefined;
    setLoading(true);
    const hint = employeeId
      ? {
          id: employeeId,
          email: hintEmail || undefined,
          employee_id: hintStaffCode || undefined,
          auth_user_id: hintAuth || undefined,
          full_name: employee?.full_name || employee?.name,
        }
      : null;
    attendanceService
      .getForEmployee(employeeId, cursor.from, cursor.to, hint)
      .then((data) => {
        if (!cancelled) {
          setPayload(data);
          setSchemaMissing(false);
          setLoadError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (isAttendanceSchemaMissing(err)) setSchemaMissing(true);
          else setLoadError(err.message || 'Could not load attendance');
          setPayload(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId, hintEmail, hintStaffCode, hintAuth, cursor.from, cursor.to]);

  const days = Array.isArray(payload?.days) ? payload.days : [];
  const selected = useMemo(
    () => days.find((d) => String(d.work_date).slice(0, 10) === selectedDate),
    [days, selectedDate]
  );

  const monthHours = days.reduce((sum, d) => sum + (Number(d.total_hours) || 0), 0);

  const shiftMonth = (delta) => {
    const d = new Date(Date.UTC(cursor.year, cursor.month - 1 + delta, 1));
    setCursor(attendanceService.monthRange(d));
    setSelectedDate(null);
  };

  if (schemaMissing) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        Attendance tables are not set up yet. Run <code>create_user_attendance.sql</code> in Supabase.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 text-sm">
        {loadError}
      </div>
    );
  }

  if (loading) {
    return <div className="h-40 rounded-2xl bg-white border border-gray-200 animate-pulse" />;
  }

  if (!payload?.linked) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <Unlink className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-900">No UHub attendance on this profile</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          Clock in / out is stored on your UHub login. It appears here when this employee record
          matches that account (same email, or the UHub user&apos;s employee link). Clock in from
          Home first, then refresh this tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 flex items-start gap-3">
        <Link2 className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-indigo-950">
            Showing UHub attendance for {payload.user_full_name}
          </p>
          <p className="text-sm text-indigo-800/80 mt-0.5">
            {payload.user_email}
            {payload.linked_how ? ` · linked by ${payload.linked_how}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Days this month</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{days.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Hours this month</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{formatHours(monthHours)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Completed days</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {days.filter((d) => d.status === 'complete').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceCalendar
          year={cursor.year}
          month={cursor.month}
          days={days}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPrevMonth={() => shiftMonth(-1)}
          onNextMonth={() => shiftMonth(1)}
        />
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              {selectedDate ? formatDubaiDate(selectedDate) : 'Select a day'}
            </h3>
          </div>
          {selected ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Clock in</dt>
                <dd className="font-medium text-gray-900">{formatDubaiTime(selected.clock_in)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Clock out</dt>
                <dd className="font-medium text-gray-900">{formatDubaiTime(selected.clock_out)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Hours</dt>
                <dd className="font-medium text-gray-900">{formatHours(selected.total_hours)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">In location</dt>
                <dd className="font-medium text-gray-900 text-right">{selected.clock_in_label || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Out location</dt>
                <dd className="font-medium text-gray-900 text-right">{selected.clock_out_label || '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">Choose a highlighted day to see clock times.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">This month</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-2 font-medium">Date</th>
                <th className="text-left px-5 py-2 font-medium">In</th>
                <th className="text-left px-5 py-2 font-medium">Out</th>
                <th className="text-left px-5 py-2 font-medium">Hours</th>
                <th className="text-left px-5 py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {days.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-gray-500 text-center">
                    No punches this month.
                  </td>
                </tr>
              ) : (
                days.map((d) => (
                  <tr key={d.id}>
                    <td className="px-5 py-2.5 text-gray-900">{formatDubaiDate(d.work_date)}</td>
                    <td className="px-5 py-2.5">{formatDubaiTime(d.clock_in)}</td>
                    <td className="px-5 py-2.5">{formatDubaiTime(d.clock_out)}</td>
                    <td className="px-5 py-2.5">{formatHours(d.total_hours)}</td>
                    <td className="px-5 py-2.5 capitalize text-gray-600">{d.source || 'app'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendancePanel;
