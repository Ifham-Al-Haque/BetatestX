import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Loader2, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import notificationService from '../../services/notificationService';
import leaveService, {
  LEAVE_TYPES,
  formatDubaiDate,
  formatLeaveUnits,
  leaveTypeMeta,
  previewLeaveUnits,
} from '../../services/leaveService';

function statusClass(status) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700';
  if (status === 'rejected') return 'bg-rose-50 text-rose-700';
  if (status === 'cancelled') return 'bg-gray-100 text-gray-600';
  return 'bg-amber-50 text-amber-800';
}

const LeaveRequestModal = ({ open, onClose, onSubmitted }) => {
  const { success, error: showError } = useToast();
  const [types, setTypes] = useState(LEAVE_TYPES);
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [session, setSession] = useState('morning');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [mine, setMine] = useState([]);

  const meta = leaveTypeMeta(leaveType);
  const isShort = meta.unit === 'hours';
  const isHalf = leaveType === 'half_day';
  const isSingleDay = isShort || isHalf;

  const preview = useMemo(
    () =>
      previewLeaveUnits({
        leaveType,
        startDate,
        endDate: isSingleDay ? startDate : endDate,
        session: isHalf ? session : 'full',
        startTime,
        endTime,
      }),
    [leaveType, startDate, endDate, session, startTime, endTime, isHalf, isSingleDay]
  );

  useEffect(() => {
    if (!open) return undefined;
    setReason('');
    leaveService.getTypes().then(setTypes).catch(() => setTypes(LEAVE_TYPES));
    leaveService.getMyRequests().then(setMine).catch(() => setMine([]));
    return undefined;
  }, [open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const request = await leaveService.submit({
        leaveType,
        startDate,
        endDate: isSingleDay ? startDate : endDate || startDate,
        session: isHalf ? session : 'full',
        startTime: isShort ? startTime : null,
        endTime: isShort ? endTime : null,
        reason,
      });
      notificationService.notifyLeaveSubmitted(request).catch(() => {});
      success('Leave submitted', 'HR has been notified and will review your request.');
      setMine(await leaveService.getMyRequests());
      onSubmitted?.(request);
    } catch (err) {
      showError('Could not submit leave', err.message || 'Please try again');
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (id) => {
    try {
      await leaveService.cancel(id);
      setMine(await leaveService.getMyRequests());
      success('Request cancelled');
    } catch (err) {
      showError('Could not cancel', err.message || 'Please try again');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 text-gray-900">
      <div className="w-full max-w-lg bg-white text-gray-900 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto [&_input]:text-gray-900 [&_select]:text-gray-900 [&_textarea]:text-gray-900">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-semibold text-gray-900">Request leave</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          <label className="block text-sm">
            <span className="text-gray-600">Leave type</span>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 [color-scheme:light]"
            >
              {types.map((t) => (
                <option key={t.code} value={t.code}>{t.label}</option>
              ))}
            </select>
          </label>

          {isHalf ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-gray-600">Date</span>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 [color-scheme:light]"
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Session</span>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 [color-scheme:light]"
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                </select>
              </label>
            </div>
          ) : isShort ? (
            <>
              <label className="block text-sm">
                <span className="text-gray-600">Date</span>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 [color-scheme:light]"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="text-gray-600">From</span>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 [color-scheme:light]"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-gray-600">To</span>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 [color-scheme:light]"
                  />
                </label>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-gray-600">From</span>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 [color-scheme:light]"
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">To</span>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 [color-scheme:light]"
                />
              </label>
            </div>
          )}

          <p className="text-sm text-teal-700 bg-teal-50 rounded-xl px-3 py-2">
            This request: <strong>{formatLeaveUnits(preview.units, preview.unit)}</strong>
            {preview.unit === 'days' ? ' (weekends excluded)' : ''}
          </p>

          <label className="block text-sm">
            <span className="text-gray-600">Reason</span>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you need this leave?"
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 [color-scheme:light]"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 text-white font-semibold py-2.5 hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Submit to HR
          </button>
        </form>

        <div className="px-5 pb-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Your recent requests</h3>
          {mine.length === 0 ? (
            <p className="text-sm text-gray-500">No leave requests yet.</p>
          ) : (
            <ul className="space-y-2">
              {mine.slice(0, 8).map((r) => (
                <li key={r.id} className="rounded-xl border border-gray-100 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{leaveTypeMeta(r.leave_type).label}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusClass(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-0.5">
                    {formatDubaiDate(r.start_date)}
                    {r.end_date !== r.start_date ? ` → ${formatDubaiDate(r.end_date)}` : ''}
                    {' · '}
                    {formatLeaveUnits(r.units, r.unit)}
                  </p>
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

export default LeaveRequestModal;
