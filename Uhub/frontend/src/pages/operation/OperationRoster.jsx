import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Plus, Users, Car, LayoutGrid } from 'lucide-react';
import OperationSubLayout from '../../components/operation/OperationSubLayout';
import OperationEmptyState from '../../components/operation/OperationEmptyState';
import operationService from '../../services/operationService';
import { useToast } from '../../context/ToastContext';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

const shiftColor = (type) => {
  if (type === 'Day') return 'bg-amber-100 text-amber-900 border-amber-200';
  if (type === 'Night') return 'bg-indigo-100 text-indigo-900 border-indigo-200';
  if (type === 'Off') return 'bg-gray-100 text-gray-500 border-gray-200';
  return 'bg-blue-100 text-blue-900 border-blue-200';
};

const OperationRoster = () => {
  const { error: showError } = useToast();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tablesMissing, setTablesMissing] = useState(false);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      const end = addDays(weekStart, 6);
      const data = await operationService.getShifts(fmtDate(weekStart), fmtDate(end));
      setShifts(data);
      setTablesMissing(data.length === 0 && false);
    } catch (err) {
      if (err.code === '42P01') {
        setTablesMissing(true);
        setShifts([]);
      } else {
        showError('Failed to load roster');
      }
    } finally {
      setLoading(false);
    }
  }, [weekStart, showError]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const shiftsByDate = useMemo(() => {
    const map = {};
    weekDays.forEach((d) => {
      map[fmtDate(d)] = [];
    });
    shifts.forEach((s) => {
      const key = s.shift_date;
      if (map[key]) map[key].push(s);
    });
    return map;
  }, [shifts, weekDays]);

  return (
    <OperationSubLayout
      breadcrumbs={[{ label: 'Schedule & Roster' }]}
      title="Team Schedule & Roster"
      description="Weekly shift view for operation teams. Assign drivers and link vehicles from Fleet Record."
      icon={Calendar}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
            {weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            {' – '}
            {addDays(weekStart, 6).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Today
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link
          to="/operation/team-allocation"
          className="flex items-center gap-3 p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 transition-colors"
        >
          <LayoutGrid className="w-8 h-8 text-blue-600 shrink-0" />
          <div>
            <p className="font-medium text-gray-900">Team Allocation</p>
            <p className="text-sm text-gray-500">Drag-and-drop board + Excel</p>
          </div>
        </Link>
        <Link
          to="/operation/drivers"
          className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
        >
          <Users className="w-8 h-8 text-blue-600 shrink-0" />
          <div>
            <p className="font-medium text-gray-900">Driver & Team Records</p>
            <p className="text-sm text-gray-500">Manage drivers and teams</p>
          </div>
        </Link>
        <Link
          to="/operation/teams"
          className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
        >
          <Plus className="w-8 h-8 text-indigo-600 shrink-0" />
          <div>
            <p className="font-medium text-gray-900">Operation Teams</p>
            <p className="text-sm text-gray-500">Create and manage teams</p>
          </div>
        </Link>
      </div>

      {tablesMissing && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Roster tables not found. Run <strong>PART D</strong> of{' '}
          <code className="text-xs bg-amber-100 px-1 rounded">operation_revamp_verify_and_migrate.sql</code>.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-gray-200 border-b border-gray-200 bg-gray-50">
            {weekDays.map((d, i) => (
              <div key={fmtDate(d)} className="p-3 text-center">
                <p className="text-xs font-medium text-gray-500">{DAY_LABELS[i]}</p>
                <p className="text-sm font-semibold text-gray-900">{d.getDate()}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-gray-200 min-h-[200px]">
            {weekDays.map((d) => {
              const key = fmtDate(d);
              const dayShifts = shiftsByDate[key] || [];
              return (
                <div key={key} className="p-2 space-y-1.5 align-top">
                  {dayShifts.length === 0 ? (
                    <p className="text-xs text-gray-300 text-center pt-4">—</p>
                  ) : (
                    dayShifts.map((s) => (
                      <div
                        key={s.id}
                        className={`text-xs p-2 rounded-lg border ${shiftColor(s.shift_type)}`}
                      >
                        <p className="font-medium truncate">{s.drivers?.full_name || 'Driver'}</p>
                        <p className="opacity-75">{s.shift_type}</p>
                        {s.operation_teams?.name && (
                          <p className="opacity-75 truncate">{s.operation_teams.name}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
          {shifts.length === 0 && !tablesMissing && (
            <OperationEmptyState
              icon={Calendar}
              title="No shifts this week"
              description="Shifts will appear here once scheduled. Use Driver & Team Records to prepare your roster."
              action={
                <Link to="/operation/fleetio/assignments" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
                  <Car className="w-4 h-4" />
                  View driver–vehicle calendar
                </Link>
              }
            />
          )}
        </div>
      )}
    </OperationSubLayout>
  );
};

export default OperationRoster;
