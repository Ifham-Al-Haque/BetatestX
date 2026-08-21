import React, { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, RefreshCw, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { isHROrAdmin } from '../../config/hrPanelConfig';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import leaveService, {
  formatDubaiDate,
  formatLeaveUnits,
  isAttendanceSchemaMissing,
  isUuid,
  leaveTypeMeta,
} from '../../services/leaveService';

function statusClass(status) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700';
  if (status === 'rejected') return 'bg-rose-50 text-rose-700';
  if (status === 'cancelled') return 'bg-gray-100 text-gray-600';
  return 'bg-amber-50 text-amber-800';
}

const LeaveInbox = ({ refreshKey = 0 }) => {
  const { role, userProfile } = useAuth();
  const canApprove = isHROrAdmin(role || userProfile?.role);
  const { success, error: showError } = useToast();
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leaveService.getQueue(status);
      setRows(data);
      setSchemaMissing(false);
    } catch (err) {
      if (isAttendanceSchemaMissing(err)) setSchemaMissing(true);
      else showError('Leave', err.message || 'Could not load requests');
    } finally {
      setLoading(false);
    }
  }, [status, showError]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const review = async (row, decision) => {
    if (!canApprove) return;
    setBusyId(row.id);
    try {
      const updated = await leaveService.review(row.id, decision, notes[row.id] || '');
      notificationService.notifyLeaveReviewed(updated || row, decision).catch(() => {});
      success(
        decision === 'approved' ? 'Leave approved' : 'Leave rejected',
        'The requester has been notified.'
      );
      await load();
    } catch (err) {
      showError('Could not review', err.message || 'Please try again');
    } finally {
      setBusyId(null);
    }
  };

  if (schemaMissing) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
        Leave is not set up yet. Run{' '}
        <code className="text-xs bg-amber-100 px-1 rounded">create_leave_system.sql</code> in the
        Supabase SQL editor, then refresh.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Leave inbox</h2>
          <p className="text-sm text-gray-500">Only HR can approve or reject these requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Requester</th>
              <th className="text-left px-6 py-3 font-medium">Type</th>
              <th className="text-left px-6 py-3 font-medium">Dates</th>
              <th className="text-left px-6 py-3 font-medium">Reason</th>
              <th className="text-left px-6 py-3 font-medium">Status</th>
              <th className="text-left px-6 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading requests…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No {status === 'all' ? '' : status} leave requests.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">{r.requester_name || 'UHub user'}</div>
                    <div className="text-gray-500">{r.requester_email}</div>
                    {isUuid(r.employee_id) ? (
                      <Link to={`/employee/${r.employee_id}`} className="text-blue-600 text-xs hover:underline">
                        Employee profile
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">No employee profile linked</span>
                    )}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    {leaveTypeMeta(r.leave_type).label}
                    <div className="text-gray-500">{formatLeaveUnits(r.units, r.unit)}</div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    {formatDubaiDate(r.start_date)}
                    {r.end_date !== r.start_date ? ` → ${formatDubaiDate(r.end_date)}` : ''}
                    {r.session && r.session !== 'full' ? (
                      <div className="text-gray-500 capitalize">{r.session}</div>
                    ) : null}
                    {r.start_time ? (
                      <div className="text-gray-500">
                        {String(r.start_time).slice(0, 5)}–{String(r.end_time || '').slice(0, 5)}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-6 py-3 max-w-xs">
                    <p className="text-gray-700">{r.reason}</p>
                    {r.review_notes ? <p className="text-xs text-gray-500 mt-1">HR: {r.review_notes}</p> : null}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusClass(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 min-w-[220px]">
                    {r.status === 'pending' && canApprove ? (
                      <div className="space-y-2">
                        <input
                          value={notes[r.id] || ''}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          placeholder="Optional note"
                          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => review(r, 'approved')}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-2.5 py-1.5 text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {busyId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => review(r, 'rejected')}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 text-white px-2.5 py-1.5 text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveInbox;
