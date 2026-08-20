import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function startWeekday(year, month) {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

const AttendanceCalendar = ({
  year,
  month,
  days = [],
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}) => {
  const byDate = useMemo(() => {
    const map = {};
    days.forEach((d) => {
      const key = typeof d.work_date === 'string' ? d.work_date.slice(0, 10) : d.work_date;
      map[key] = d;
    });
    return map;
  }, [days]);

  const total = daysInMonth(year, month);
  const offset = startWeekday(year, month);
  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let d = 1; d <= total; d += 1) cells.push(d);

  const title = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={onNextMonth}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[11px] font-medium text-gray-400 text-center py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const key = `${year}-${pad(month)}-${pad(d)}`;
          const rec = byDate[key];
          const selected = selectedDate === key;
          let tone = 'bg-gray-50 text-gray-500';
          if (rec?.status === 'complete') tone = 'bg-emerald-50 text-emerald-800';
          else if (rec?.status === 'open') tone = 'bg-amber-50 text-amber-800';
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate?.(key, rec)}
              className={`h-10 rounded-lg text-sm font-medium ${tone} ${
                selected ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-200" /> Complete
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-200" /> Clocked in
        </span>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
