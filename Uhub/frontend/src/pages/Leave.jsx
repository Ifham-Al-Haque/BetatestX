import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import LeaveInbox from '../components/leave/LeaveInbox';
import leaveService, {
  dubaiDateString,
  formatDubaiDate,
  formatLeaveUnits,
  isAttendanceSchemaMissing,
  isUuid,
  leaveCoverage,
  leaveTypeMeta,
} from '../services/leaveService';

const Leave = () => {
  const today = dubaiDateString();
  const [onLeave, setOnLeave] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [schemaMissing, setSchemaMissing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [todayRows, pending] = await Promise.all([
        leaveService.getOnLeave(today),
        leaveService.getQueue('pending'),
      ]);
      setOnLeave(todayRows);
      setPendingCount(pending.length);
      setSchemaMissing(false);
    } catch (err) {
      if (isAttendanceSchemaMissing(err)) setSchemaMissing(true);
    }
  }, [today]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 rounded-2xl p-6 md:p-8 text-white shadow-xl mb-8"
        >
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <p className="text-teal-100 text-sm font-medium mb-1">HR Panel</p>
                <h1 className="text-3xl font-bold mb-2">Leave</h1>
                <p className="text-teal-50 max-w-xl">
                  Employees request time off from Home. Requests are assigned to HR for approval
                  and then shown on the linked employee profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <div className="rounded-xl bg-white/10 border border-white/20 p-4">
                <p className="text-teal-100 text-xs">Pending requests</p>
                <p className="text-2xl font-semibold mt-1">{pendingCount}</p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/20 p-4">
                <p className="text-teal-100 text-xs">All-day leave today</p>
                <p className="text-2xl font-semibold mt-1">
                  {onLeave.filter((r) => leaveCoverage(r) === 'all_day').length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {schemaMissing && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
            Run <code className="text-xs bg-amber-100 px-1 rounded">create_leave_system.sql</code> in
            the Supabase SQL editor, then refresh.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">On leave today</h2>
            <p className="text-sm text-gray-500">{formatDubaiDate(today)}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Person</th>
                  <th className="text-left px-6 py-3 font-medium">Type</th>
                  <th className="text-left px-6 py-3 font-medium">Until</th>
                  <th className="text-left px-6 py-3 font-medium">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {onLeave.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Nobody is on approved leave today.
                    </td>
                  </tr>
                ) : (
                  onLeave.map((r) => (
                    <tr key={r.id}>
                      <td className="px-6 py-3">
                        <div className="font-medium text-gray-900">{r.requester_name}</div>
                        <div className="text-gray-500">{r.requester_email}</div>
                      </td>
                      <td className="px-6 py-3">
                        {leaveTypeMeta(r.leave_type).label}
                        <div className="text-gray-500">{formatLeaveUnits(r.units, r.unit)}</div>
                        {leaveCoverage(r) === 'hours' ? (
                          <div className="text-xs text-teal-700">Partial day</div>
                        ) : leaveCoverage(r) === 'half' ? (
                          <div className="text-xs text-teal-700 capitalize">{r.session} half</div>
                        ) : leaveCoverage(r) === 'wfh' ? (
                          <div className="text-xs text-teal-700">Working from home</div>
                        ) : null}
                      </td>
                      <td className="px-6 py-3">{formatDubaiDate(r.end_date)}</td>
                      <td className="px-6 py-3">
                        {isUuid(r.employee_id) ? (
                          <Link to={`/employee/${r.employee_id}`} className="text-blue-600 hover:underline">
                            View
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <LeaveInbox refreshKey={refreshKey} />
      </div>
    </div>
  );
};

export default Leave;
