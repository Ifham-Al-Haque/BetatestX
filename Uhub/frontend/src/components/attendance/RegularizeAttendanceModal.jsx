import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardEdit, Loader2, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import notificationService from '../../services/notificationService';
import attendanceService, {
  dubaiAddDays,
  dubaiDateString,
  formatDubaiDate,
  formatDubaiTimeInput,
} from '../../services/attendanceService';

export const REGULARIZATION_TYPES = [
  { value: 'forgot_punch', label: 'Forgot to punch (missed the day)' },
  { value: 'missed_clock_in', label: 'Missed clock in' },
  { value: 'missed_clock_out', label: 'Missed clock out' },
  { value: 'wrong_time', label: 'Wrong time' },
  { value: 'other', label: 'Other' },
];

function statusClass(status) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700';
  if (status === 'rejected') return 'bg-rose-50 text-rose-700';
  if (status === 'cancelled') return 'bg-gray-100 text-gray-600';
  return 'bg-amber-50 text-amber-800';
}

function ymd(value) {
  return value ? String(value).slice(0, 10) : '';
}

const RegularizeAttendanceModal = ({
  open,
  onClose,
  defaultDate,
  defaultDay,
  missedDays = [],
  onSubmitted,
}) => {
  const { success, error: showError } = useToast();
  const today = dubaiDateString();
  const minDate = dubaiAddDays(today, -30);
  const [workDate, setWorkDate] = useState(defaultDate || today);
  const [requestType, setRequestType] = useState('forgot_punch');
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [mine, setMine] = useState([]);

  const missed = useMemo(
    () => (missedDays || []).map((d) => ymd(d.work_date || d)).filter(Boolean),
    [missedDays]
  );

  useEffect(() => {
    if (!open) return undefined;
    const initial = ymd(defaultDate) || missed[0] || today;
    setWorkDate(initial);
    setReason('');
    attendanceService.getMyRegularizations().then(setMine).catch(() => setMine([]));
    return undefined;
  }, [open, defaultDate, missed, today]);

  useEffect(() => {
    if (!open || !workDate) return undefined;
    let cancelled = false;
    attendanceService.getMyDay(workDate).then((found) => {
      if (cancelled) return;
      if (!found?.clock_in) {
        setRequestType('forgot_punch');
        setClockIn('09:00');
        setClockOut('18:00');
        return;
      }
      setClockIn(formatDubaiTimeInput(found.clock_in));
      setClockOut(formatDubaiTimeInput(found.clock_out));
      setRequestType(found.clock_out ? 'wrong_time' : 'missed_clock_out');
    }).catch(() => {
      if (!cancelled) {
        setRequestType('forgot_punch');
        setClockIn('09:00');
        setClockOut('18:00');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, workDate]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const request = await attendanceService.submitRegularization({
        workDate,
        requestType,
        requestedClockIn: clockIn || null,
        requestedClockOut: clockOut || null,
        reason,
      });
      notificationService.notifyRegularizationSubmitted(request).catch(() => {});
      success('Regularization submitted', 'HR has been notified and will review your request.');
      const next = await attendanceService.getMyRegularizations();
      setMine(next);
      onSubmitted?.(request);
    } catch (err) {
      showError('Could not submit', err.message || 'Please try again');
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (id) => {
    try {
      await attendanceService.cancelRegularization(id);
      setMine(await attendanceService.getMyRegularizations());
      success('Request cancelled');
    } catch (err) {
      showError('Could not cancel', err.message || 'Please try again');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ClipboardEdit className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Regularize attendance</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-600">
            Forgot to punch in yesterday or another working day? Pick that date, enter the times you
            actually worked, and HR will update the timesheet after approval.
          </p>
          {missed.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Days with no punch</p>
              <div className="flex flex-wrap gap-2">
                {missed.slice(0, 8).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setWorkDate(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      workDate === d
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-100 hover:bg-indigo-100'
                    }`}
                  >
                    {formatDubaiDate(d)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <label className="block text-sm">
            <span className="text-gray-600">Date you missed</span>
            <input
              type="date"
              required
              min={minDate}
              max={today}
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Reason type</span>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            >
              {REGULARIZATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-gray-600">Requested clock in</span>
              <input
                type="time"
                required={requestType === 'forgot_punch' || requestType === 'missed_clock_in'}
                value={clockIn}
                onChange={(e) => setClockIn(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Requested clock out</span>
              <input
                type="time"
                value={clockOut}
                onChange={(e) => setClockOut(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
              />
            </label>
          </div>
          <p className="text-xs text-gray-500">
            For a missed day, enter both times. Suggested office hours are 09:00–18:00 — change them
            to what you actually worked.
          </p>
          <label className="block text-sm">
            <span className="text-gray-600">Explanation</span>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Forgot to punch in yesterday, worked 9am to 6pm from the office"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white font-semibold py-2.5 hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Submit to HR
          </button>
        </form>

        <div className="px-5 pb-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Your recent requests</h3>
          {mine.length === 0 ? (
            <p className="text-sm text-gray-500">No regularization requests yet.</p>
          ) : (
            <ul className="space-y-2">
              {mine.map((r) => (
                <li key={r.id} className="rounded-xl border border-gray-100 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{formatDubaiDate(r.work_date)}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusClass(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-1">{r.reason}</p>
                  {r.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => cancel(r.id)}
                      className="text-xs text-rose-600 mt-1 hover:underline"
                    >
                      Cancel
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegularizeAttendanceModal;
