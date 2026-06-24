import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, X, User, ChevronDown, Loader2 } from 'lucide-react';

export default function EmployeeSearchPicker({
  value,
  employees = [],
  loading = false,
  onSelect,
  onClear,
  isDark = false,
  placeholder = 'Search employee by name, ID, or email...',
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = useMemo(
    () => employees.find((e) => String(e.employee_id || e.id) === String(value)),
    [employees, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? employees.filter((e) => {
          const name = String(e.full_name || '').toLowerCase();
          const id = String(e.employee_id || '').toLowerCase();
          const email = String(e.email || '').toLowerCase();
          return name.includes(q) || id.includes(q) || email.includes(q);
        })
      : employees;
    return list.slice(0, 40);
  }, [employees, query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const inputClass = `w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all ${
    isDark
      ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:ring-teal-400'
      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-teal-500'
  }`;

  return (
    <div ref={containerRef} className="relative">
      {selected && !open ? (
        <div
          className={`flex items-center justify-between gap-2 px-4 py-3 border rounded-xl ${
            isDark ? 'border-slate-600 bg-slate-700/80' : 'border-gray-300 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-teal-700 dark:text-teal-300" />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                {selected.full_name || 'Unknown'}
              </p>
              <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {selected.employee_id ? `ID: ${selected.employee_id}` : ''}
                {selected.email ? ` · ${selected.email}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-600 text-slate-300' : 'hover:bg-gray-200 text-gray-600'}`}
              title="Change employee"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onClear?.()}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-600 text-slate-300' : 'hover:bg-gray-200 text-gray-600'}`}
              title="Clear assignment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={loading ? 'Loading employees...' : placeholder}
            disabled={loading}
            className={inputClass}
          />
          {loading && (
            <Loader2 className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
          )}
        </div>
      )}

      {open && !loading && (
        <div
          className={`absolute z-30 mt-2 w-full max-h-56 overflow-y-auto rounded-xl border shadow-xl ${
            isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'
          }`}
        >
          {filtered.length === 0 ? (
            <p className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No employees found</p>
          ) : (
            filtered.map((employee) => {
              const empValue = String(employee.employee_id || employee.id || '');
              return (
                <button
                  key={`${empValue}-${employee.email || ''}`}
                  type="button"
                  onClick={() => {
                    onSelect?.(employee);
                    setQuery('');
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                    isDark ? 'hover:bg-slate-700 text-slate-100' : 'hover:bg-teal-50 text-gray-900'
                  } ${String(value) === empValue ? (isDark ? 'bg-slate-700/80' : 'bg-teal-50') : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                      {(employee.full_name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{employee.full_name || 'Unknown'}</p>
                    <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {employee.employee_id ? `${employee.employee_id}` : ''}
                      {employee.department ? ` · ${employee.department}` : ''}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
