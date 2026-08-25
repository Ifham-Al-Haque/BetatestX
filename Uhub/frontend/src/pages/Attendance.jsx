import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, ClipboardList, Clock, RefreshCw, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import ClockInOutWidget from '../components/attendance/ClockInOutWidget';
import AttendanceCalendar from '../components/attendance/AttendanceCalendar';
import RegularizationInbox from '../components/attendance/RegularizationInbox';
import attendanceService, {
  dubaiDateString,
  formatDubaiDate,
  formatDubaiTime,
  formatHours,
  isAttendanceSchemaMissing,
  isUuid,
} from '../services/attendanceService';
import leaveService, { leaveCoverage, leaveTypeMeta } from '../services/leaveService';

const Attendance = () => {
  const today = dubaiDateString();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'regularization' ? 'regularization' : 'board';
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(() => attendanceService.monthRange());
  const [monthRows, setMonthRows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [staleOpen, setStaleOpen] = useState([]);
  const [onLeaveToday, setOnLeaveToday] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [todayData, monthData, stale, leaveToday] = await Promise.all([
        attendanceService.getOverview(today, today),
        attendanceService.getOverview(cursor.from, cursor.to),
        attendanceService.getStaleOpen().catch(() => []),
        leaveService.getOnLeave(today).catch(() => []),
      ]);
      setRows(Array.isArray(todayData) ? todayData : []);
      setMonthRows(Array.isArray(monthData) ? monthData : []);
      setStaleOpen(Array.isArray(stale) ? stale : []);
      setOnLeaveToday(Array.isArray(leaveToday) ? leaveToday : []);
      setSchemaMissing(false);
      setLoadError('');
    } catch (err) {
      if (isAttendanceSchemaMissing(err)) setSchemaMissing(true);
      else {
        setRows([]);
        setMonthRows([]);
        setLoadError(err.message || 'Could not load attendance');
      }
    } finally {
      setLoading(false);
    }
  }, [today, cursor.from, cursor.to]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const present = rows.filter((r) => r.clock_in).length;
  const open = rows.filter((r) => r.status === 'open').length;
  const monthHours = monthRows.reduce((sum, r) => sum + (Number(r.total_hours) || 0), 0);
  const allDayLeave = onLeaveToday.filter((r) => leaveCoverage(r) === 'all_day');

  const calendarDays = useMemo(() => {
    const byDate = {};
    monthRows.forEach((r) => {
      const key = String(r.work_date).slice(0, 10);
      if (!byDate[key]) byDate[key] = { work_date: key, status: r.status, count: 0 };
      byDate[key].count += 1;
      if (r.status === 'open') byDate[key].status = 'open';
      else if (byDate[key].status !== 'open') byDate[key].status = 'complete';
    });
    return Object.values(byDate);
  }, [monthRows]);

  const selectedRows = monthRows.filter((r) => String(r.work_date).slice(0, 10) === selectedDate);

  const shiftMonth = (delta) => {
    const d = new Date(Date.UTC(cursor.year, cursor.month - 1 + delta, 1));
    const next = attendanceService.monthRange(d);
    setCursor(next);
    setSelectedDate(next.from);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-6 md:p-8 text-white shadow-xl mb-8"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">HR Panel</p>
                <h1 className="text-3xl font-bold mb-2">Attendance</h1>
                <p className="text-blue-100 max-w-xl">
                  Clock times are stored on each UHub user account and shown on the linked employee record.
                  Regularization requests are assigned to HR for approval.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <div className="flex gap-2 mb-5">
              {[
                { id: 'board', label: 'Timesheet', icon: Clock },
                { id: 'regularization', label: 'Regularization', icon: ClipboardList },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSearchParams(t.id === 'board' ? {} : { tab: t.id })}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                    tab === t.id ? 'bg-white text-indigo-700' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: 'Clocked in today', value: present, icon: Users },
                { label: 'Still open today', value: open, icon: Clock },
                { label: 'Forgot clock-out', value: staleOpen.length, icon: ClipboardList },
                { label: 'All-day leave', value: allDayLeave.length, icon: Calendar },
                { label: 'Hours this month', value: formatHours(monthHours), icon: Clock },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white/10 border border-white/20 p-4">
                  <p className="text-blue-100 text-xs">{s.label}</p>
                  <p className="text-2xl font-semibold mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {schemaMissing && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
            Attendance functions are not visible to the app yet. Run{' '}
            <code className="text-xs bg-amber-100 px-1 rounded">upgrade_user_attendance_location.sql</code>
            {' '}and{' '}
            <code className="text-xs bg-amber-100 px-1 rounded">create_attendance_regularization.sql</code>
            {' '}in the Supabase SQL editor, then refresh.
          </div>
        )}
        {loadError && !schemaMissing && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
            {loadError}
          </div>
        )}

        {tab === 'regularization' ? (
          <RegularizationInbox refreshKey={refreshKey} />
        ) : (
          <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <ClockInOutWidget onChanged={() => setRefreshKey((k) => k + 1)} />
          </div>
          <div className="lg:col-span-2">
            <AttendanceCalendar
              year={cursor.year}
              month={cursor.month}
              days={calendarDays}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onPrevMonth={() => shiftMonth(-1)}
              onNextMonth={() => shiftMonth(1)}
            />
          </div>
        </div>

        {tab === 'board' && staleOpen.length > 0 ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
            <div className="px-6 py-3 border-b border-amber-200">
              <h2 className="text-sm font-semibold text-amber-950">Forgot clock-out (previous days)</h2>
              <p className="text-xs text-amber-800 mt-0.5">
                These days were never closed. Ask the person to Regularize — we do not invent a clock-out time.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs uppercase text-amber-800/80">
                  <tr>
                    <th className="text-left px-6 py-2 font-medium">UHub user</th>
                    <th className="text-left px-6 py-2 font-medium">Date</th>
                    <th className="text-left px-6 py-2 font-medium">Clock in</th>
                    <th className="text-left px-6 py-2 font-medium">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {staleOpen.slice(0, 12).map((r) => (
                    <tr key={r.id}>
                      <td className="px-6 py-2">
                        <div className="font-medium text-gray-900">{r.user_full_name}</div>
                        <div className="text-gray-500">{r.user_email}</div>
                      </td>
                      <td className="px-6 py-2">{formatDubaiDate(r.work_date)}</td>
                      <td className="px-6 py-2">{formatDubaiTime(r.clock_in)}</td>
                      <td className="px-6 py-2">
                        {isUuid(r.employee_record_id) ? (
                          <Link to={`/employee/${r.employee_record_id}`} className="text-blue-600 hover:underline">
                            View
                          </Link>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedDate === today ? "Today's attendance" : `Attendance for ${selectedDate}`}
            </h2>
            <p className="text-sm text-gray-500">UHub users who punched on this day</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">UHub user</th>
                  <th className="text-left px-6 py-3 font-medium">Clock in</th>
                  <th className="text-left px-6 py-3 font-medium">Clock out</th>
                  <th className="text-left px-6 py-3 font-medium">Hours</th>
                  <th className="text-left px-6 py-3 font-medium">Location</th>
                  <th className="text-left px-6 py-3 font-medium">Employee record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Loading attendance…
                    </td>
                  </tr>
                ) : (selectedDate === today ? rows : selectedRows).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No clock records for this day. Use Clock in on the left (or Home) to create the first punch.
                    </td>
                  </tr>
                ) : (
                  (selectedDate === today ? rows : selectedRows).map((r) => {
                    const leaveHit = selectedDate === today
                      ? onLeaveToday.find((l) => String(l.user_id) === String(r.user_id))
                      : null;
                    return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <div className="font-medium text-gray-900">{r.user_full_name}</div>
                        <div className="text-gray-500">{r.user_email}</div>
                        {leaveHit ? (
                          <div className="text-xs text-teal-700 mt-0.5">
                            {leaveTypeMeta(leaveHit.leave_type).label}
                            {leaveCoverage(leaveHit) === 'all_day' ? ' · should not be clocked in' : ''}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-3">{formatDubaiTime(r.clock_in)}</td>
                      <td className="px-6 py-3">{formatDubaiTime(r.clock_out)}</td>
                      <td className="px-6 py-3">{formatHours(r.total_hours)}</td>
                      <td className="px-6 py-3 text-gray-600 max-w-[220px]">
                        {r.clock_in_label || r.clock_out_label || '—'}
                      </td>
                      <td className="px-6 py-3">
                        {isUuid(r.employee_record_id) ? (
                          <Link to={`/employee/${r.employee_record_id}`} className="text-blue-600 hover:underline">
                            View profile
                          </Link>
                        ) : (
                          <span className="text-gray-400">Not linked</span>
                        )}
                        {r.source === 'regularized' ? (
                          <div className="text-xs text-indigo-600 mt-0.5">Regularized</div>
                        ) : null}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Attendance;
