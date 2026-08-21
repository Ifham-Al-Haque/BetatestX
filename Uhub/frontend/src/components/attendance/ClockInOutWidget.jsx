import React, { useCallback, useEffect, useState } from 'react';
import { LogIn, LogOut, AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import attendanceService, {
  dubaiDateString,
  formatDubaiTime,
  formatElapsedClock,
  formatHours,
  isAttendanceSchemaMissing,
  mapsUrl,
  requestPunchLocation,
} from '../../services/attendanceService';

function useLiveNow(enabled) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled]);
  return now;
}

function StatusPill({ clockedIn, complete, isDark }) {
  const label = complete ? 'Done for today' : clockedIn ? 'On the clock' : 'Ready to clock in';
  const tone = complete
    ? isDark
      ? 'bg-indigo-400/20 text-indigo-100'
      : 'bg-indigo-50 text-indigo-700'
    : clockedIn
      ? isDark
        ? 'bg-emerald-400/20 text-emerald-100'
        : 'bg-emerald-50 text-emerald-700'
      : isDark
        ? 'bg-white/10 text-blue-100'
        : 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tone}`}>
      {clockedIn && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      {label}
    </span>
  );
}

function LocationLine({ label, lat, lng, isDark }) {
  if (!label && lat == null) {
    return <p className={`text-xs ${isDark ? 'text-blue-100/70' : 'text-gray-500'}`}>Location is captured when you punch.</p>;
  }
  const href = mapsUrl(lat, lng);
  return (
    <div className={`flex items-start gap-2 text-xs ${isDark ? 'text-blue-100/80' : 'text-gray-600'}`}>
      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="hover:underline">
          {label || `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`}
        </a>
      ) : (
        <span>{label}</span>
      )}
    </div>
  );
}

const ClockInOutWidget = ({ variant = 'light', onChanged }) => {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [today, setToday] = useState(null);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await attendanceService.getMyToday();
      setToday(data);
      setSchemaMissing(false);
      setLoadError('');
    } catch (err) {
      if (isAttendanceSchemaMissing(err)) {
        setSchemaMissing(true);
      } else {
        setLoadError(err.message || 'Could not load attendance');
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
  const complete = Boolean(day?.clock_out);
  const now = useLiveNow(true);
  const isDark = variant === 'dark';

  const handleClock = async (type) => {
    setSaving(true);
    try {
      const location = await requestPunchLocation();
      await attendanceService.clock(type, location);
      await load();
      const locNote =
        location.status === 'ok'
          ? location.label
          : location.status === 'denied'
            ? 'Saved without location (permission denied).'
            : 'Saved without a map location.';
      success(type === 'in' ? 'Clocked in' : 'Clocked out', locNote);
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

  const shell = isDark
    ? 'bg-white/[0.08] border-white/15 text-white backdrop-blur-md'
    : 'bg-white border-gray-200 text-gray-900 shadow-sm';
  const muted = isDark ? 'text-blue-100/75' : 'text-gray-500';
  const value = isDark ? 'text-white' : 'text-gray-900';
  const timerBox = isDark
    ? 'bg-black/25 border-white/10'
    : clockedIn
      ? 'bg-emerald-50 border-emerald-100'
      : complete
        ? 'bg-indigo-50 border-indigo-100'
        : 'bg-slate-50 border-slate-100';

  if (schemaMissing) {
    return (
      <div className={`rounded-2xl border p-5 ${shell}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`w-5 h-5 mt-0.5 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
          <div>
            <p className={`font-semibold ${value}`}>Attendance is not connected yet</p>
            <p className={`text-sm mt-1 ${muted}`}>
              Run <code className="text-xs">upgrade_user_attendance_location.sql</code> in the Supabase SQL editor, then refresh.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeLocationLabel = clockedIn ? day?.clock_in_label : day?.clock_out_label || day?.clock_in_label;
  const activeLat = clockedIn ? day?.clock_in_lat : day?.clock_out_lat ?? day?.clock_in_lat;
  const activeLng = clockedIn ? day?.clock_in_lng : day?.clock_out_lng ?? day?.clock_in_lng;

  return (
    <div className={`rounded-2xl border p-5 ${shell}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className={`text-xs uppercase tracking-[0.16em] font-medium ${muted}`}>
            {formatDubaiTime(now)} · Dubai · {dubaiDateString()}
          </p>
          <h3 className={`text-lg font-semibold mt-1 ${value}`}>Time clock</h3>
        </div>
        <StatusPill clockedIn={clockedIn} complete={complete} isDark={isDark} />
      </div>

      {loading ? (
        <div className={`h-28 rounded-2xl animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-100'}`} />
      ) : (
        <>
          {loadError ? (
            <p className={`text-sm mb-3 ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>{loadError}</p>
          ) : null}

          <div className={`rounded-2xl border px-4 py-5 mb-4 text-center ${timerBox}`}>
            <p className={`text-[11px] uppercase tracking-[0.18em] mb-1 ${muted}`}>
              {clockedIn ? 'Time on the clock' : complete ? 'Hours worked' : 'Current time'}
            </p>
            <p className={`font-semibold tabular-nums tracking-tight ${value}`} style={{ fontSize: clockedIn ? 36 : 28, lineHeight: 1.1 }}>
              {clockedIn
                ? formatElapsedClock(day.clock_in, now)
                : complete
                  ? formatHours(day.total_hours)
                  : formatDubaiTime(now)}
            </p>
            <p className={`text-xs mt-2 ${muted}`}>
              {clockedIn
                ? `In since ${formatDubaiTime(day.clock_in)}`
                : complete
                  ? `${formatDubaiTime(day.clock_in)} → ${formatDubaiTime(day.clock_out)}`
                  : 'Timer starts when you clock in'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className={`text-xs ${muted}`}>Clock in</p>
              <p className={`text-sm font-semibold mt-0.5 ${value}`}>{formatDubaiTime(day?.clock_in)}</p>
            </div>
            <div>
              <p className={`text-xs ${muted}`}>Clock out</p>
              <p className={`text-sm font-semibold mt-0.5 ${value}`}>{formatDubaiTime(day?.clock_out)}</p>
            </div>
          </div>

          <LocationLine label={activeLocationLabel} lat={activeLat} lng={activeLng} isDark={isDark} />

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              disabled={saving || clockedIn || complete}
              onClick={() => handleClock('in')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Clock in
            </button>
            <button
              type="button"
              disabled={saving || !clockedIn}
              onClick={() => handleClock('out')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Clock out
            </button>
          </div>
          <p className={`text-[11px] mt-3 ${muted}`}>
            Allow location when asked so HR can see where this punch was made.
          </p>
        </>
      )}
    </div>
  );
};

export default ClockInOutWidget;
