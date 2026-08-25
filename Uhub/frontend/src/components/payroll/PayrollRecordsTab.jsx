import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, Search, Clock, CheckCircle, XCircle, Edit, Trash2,
  DollarSign, Download, Users, X, Calculator, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../supabaseClient';
import {
  PAYROLL_MONTHS,
  PAYROLL_YEARS,
  formatPayrollCurrency,
} from '../../utils/payrollConstants';
import { DEFAULT_FORMULAS, calcRowWithFormulas } from '../../utils/payrollFormula';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  processed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
};

const emptyForm = {
  employee_id: '',
  month: '',
  year: String(new Date().getFullYear()),
  basic_salary: '',
  allowances: '',
  deductions: '',
  overtime_hours: '',
  overtime_rate: '',
  bonus: '',
  tax_rate: '',
  notes: '',
};

export default function PayrollRecordsTab({ onNavigateToRun }) {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();

  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formulas, setFormulas] = useState(DEFAULT_FORMULAS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [filters, setFilters] = useState({
    month: '',
    year: String(new Date().getFullYear()),
    status: '',
    department: '',
    search: '',
  });
  const [formData, setFormData] = useState(emptyForm);

  const canManage = ['admin', 'hr_manager'].includes(userProfile?.role);
  const canDelete = userProfile?.role === 'admin';

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.month, filters.year, filters.status]);

  useEffect(() => {
    const loadFormulas = async () => {
      const { data } = await supabase
        .from('payroll_formulas')
        .select('gross_formula, tax_formula, net_formula')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setFormulas({
          gross_formula: data.gross_formula,
          tax_formula: data.tax_formula,
          net_formula: data.net_formula,
        });
      }
    };
    loadFormulas();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      let payrollQuery = supabase.from('payrolls').select('*').order('created_at', { ascending: false });
      if (filters.month) payrollQuery = payrollQuery.eq('month', filters.month);
      if (filters.year) payrollQuery = payrollQuery.eq('year', parseInt(filters.year, 10));
      if (filters.status) payrollQuery = payrollQuery.eq('status', filters.status);

      const [employeesRes, payrollsRes] = await Promise.all([
        supabase
          .from('employees')
          .select('id, full_name, employee_id, department, position, designation')
          .eq('status', 'active')
          .order('full_name'),
        payrollQuery,
      ]);

      if (employeesRes.error) throw employeesRes.error;
      if (payrollsRes.error) throw payrollsRes.error;
      setEmployees(employeesRes.data || []);
      setPayrolls(payrollsRes.data || []);
      setSelectedIds([]);
    } catch (err) {
      showError('Error', err.message || 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const preview = useMemo(() => calcRowWithFormulas(formData, formulas), [formData, formulas]);

  const departments = useMemo(() => {
    const set = new Set(payrolls.map((p) => p.department).filter(Boolean));
    return [...set].sort();
  }, [payrolls]);

  const visiblePayrolls = payrolls.filter((p) => {
    if (filters.department && p.department !== filters.department) return false;
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return (
      (p.employee_name || '').toLowerCase().includes(q) ||
      (p.department || '').toLowerCase().includes(q)
    );
  });

  const hasActiveFilters =
    filters.month || filters.year || filters.status || filters.department || filters.search;

  const pendingVisible = visiblePayrolls.filter((p) => p.status === 'pending');
  const allPendingSelected =
    pendingVisible.length > 0 && pendingVisible.every((p) => selectedIds.includes(p.id));

  const stats = {
    net: visiblePayrolls.reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0),
    processed: visiblePayrolls.filter((p) => p.status === 'processed').length,
    pending: visiblePayrolls.filter((p) => p.status === 'pending').length,
    employees: employees.length,
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPayroll(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const calc = calcRowWithFormulas(formData, formulas);
      const employee = employees.find((emp) => String(emp.id) === String(formData.employee_id));
      const payrollData = {
        employee_id: String(formData.employee_id),
        employee_name: employee?.full_name || 'Unknown',
        department: employee?.department || 'Unknown',
        month: formData.month,
        year: parseInt(formData.year, 10),
        basic_salary: parseFloat(formData.basic_salary) || 0,
        allowances: parseFloat(formData.allowances) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        overtime_hours: parseFloat(formData.overtime_hours) || 0,
        overtime_rate: parseFloat(formData.overtime_rate) || 0,
        bonus: parseFloat(formData.bonus) || 0,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        tax_amount: calc.tax,
        gross_salary: calc.gross,
        net_salary: calc.net,
        notes: formData.notes || null,
      };

      if (editingPayroll) {
        const { data, error } = await supabase
          .from('payrolls')
          .update({ ...payrollData, updated_at: new Date().toISOString() })
          .eq('id', editingPayroll.id)
          .select()
          .single();
        if (error) throw error;
        setPayrolls(payrolls.map((p) => (p.id === data.id ? data : p)));
        success('Updated', 'Payroll record saved.');
      } else {
        const { data, error } = await supabase
          .from('payrolls')
          .insert({ ...payrollData, status: 'pending', created_by: user?.id || null })
          .select()
          .single();
        if (error) throw error;
        setPayrolls([data, ...payrolls]);
        success('Created', 'Payroll record created.');
      }
      closeForm();
    } catch (err) {
      showError(
        'Error',
        err?.code === '23505'
          ? 'A payroll record already exists for this employee in the selected month and year.'
          : err.message || 'Failed to submit payroll.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (payroll) => {
    setEditingPayroll(payroll);
    setFormData({
      employee_id: String(payroll.employee_id || ''),
      month: payroll.month,
      year: String(payroll.year || ''),
      basic_salary: String(payroll.basic_salary ?? ''),
      allowances: String(payroll.allowances ?? ''),
      deductions: String(payroll.deductions ?? ''),
      overtime_hours: String(payroll.overtime_hours ?? ''),
      overtime_rate: String(payroll.overtime_rate ?? ''),
      bonus: String(payroll.bonus ?? ''),
      tax_rate: String(payroll.tax_rate ?? ''),
      notes: payroll.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payroll record?')) return;
    try {
      const { error } = await supabase.from('payrolls').delete().eq('id', id);
      if (error) throw error;
      setPayrolls(payrolls.filter((p) => p.id !== id));
      setSelectedIds((ids) => ids.filter((x) => x !== id));
      success('Deleted', 'Payroll record removed.');
    } catch (err) {
      showError('Error', err.message || 'Failed to delete payroll.');
    }
  };

  const applyStatus = async (ids, newStatus) => {
    const statusUpdate = {
      status: newStatus,
      processed_date: newStatus === 'processed' ? new Date().toISOString() : null,
      processed_by: newStatus === 'processed' ? userProfile?.full_name || 'Unknown' : null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('payrolls').update(statusUpdate).in('id', ids).select();
    if (error) throw error;
    const map = Object.fromEntries((data || []).map((row) => [row.id, row]));
    setPayrolls((prev) => prev.map((p) => map[p.id] || p));
  };

  const handleStatusChange = async (payrollId, newStatus) => {
    try {
      await applyStatus([payrollId], newStatus);
      success('Updated', `Status set to ${newStatus}.`);
    } catch (err) {
      showError('Error', err.message || 'Failed to update status.');
    }
  };

  const handleBulkProcess = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Mark ${selectedIds.length} record(s) as processed?`)) return;
    setBulkSaving(true);
    try {
      await applyStatus(selectedIds, 'processed');
      success('Processed', `${selectedIds.length} record(s) marked as processed.`);
      setSelectedIds([]);
    } catch (err) {
      showError('Error', err.message || 'Failed to update records.');
    } finally {
      setBulkSaving(false);
    }
  };

  const handleExport = () => {
    if (visiblePayrolls.length === 0) {
      showError('Nothing to export', 'No payroll records match the current filters.');
      return;
    }
    const headers = [
      'Employee', 'Department', 'Month', 'Year', 'Basic Salary', 'Allowances',
      'Overtime Hours', 'Overtime Rate', 'Bonus', 'Tax Rate', 'Tax Amount',
      'Gross Salary', 'Deductions', 'Net Salary', 'Status', 'Processed Date', 'Processed By', 'Notes',
    ];
    const escapeCsv = (value) => {
      const str = String(value ?? '');
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const rows = visiblePayrolls.map((p) =>
      [
        p.employee_name, p.department, p.month, p.year, p.basic_salary, p.allowances,
        p.overtime_hours, p.overtime_rate, p.bonus, p.tax_rate, p.tax_amount,
        p.gross_salary, p.deductions, p.net_salary, p.status,
        p.processed_date ? new Date(p.processed_date).toLocaleDateString() : '',
        p.processed_by || '', p.notes || '',
      ]
        .map(escapeCsv)
        .join(',')
    );
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${filters.month || 'all'}-${filters.year || 'all'}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    success('Exported', `${visiblePayrolls.length} record(s) exported.`);
  };

  const toggleSelectAllPending = () => {
    if (allPendingSelected) {
      setSelectedIds((ids) => ids.filter((id) => !pendingVisible.some((p) => p.id === id)));
    } else {
      setSelectedIds((ids) => [...new Set([...ids, ...pendingVisible.map((p) => p.id)])]);
    }
  };

  const staffCode = (payroll) =>
    employees.find((e) => String(e.id) === String(payroll.employee_id))?.employee_id || payroll.employee_id;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Filtered net pay', value: formatPayrollCurrency(stats.net), icon: DollarSign, bg: 'from-blue-500 to-indigo-600' },
          { label: 'Processed', value: stats.processed, icon: CheckCircle, bg: 'from-emerald-500 to-teal-600' },
          { label: 'Pending', value: stats.pending, icon: Clock, bg: 'from-amber-500 to-orange-600' },
          { label: 'Active employees', value: stats.employees, icon: Users, bg: 'from-violet-500 to-purple-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.bg} text-white shadow-sm`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md p-4 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                placeholder="Search name or department…"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9 pr-3 py-2 w-56 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <select value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
              <option value="">All months</option>
              {PAYROLL_MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
              <option value="">All years</option>
              {PAYROLL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
              <option value="">All status</option>
              <option value="pending">Pending</option>
              <option value="processed">Processed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
              <option value="">All departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {hasActiveFilters && (
              <button type="button" onClick={() => setFilters({ month: '', year: '', status: '', department: '', search: '' })} className="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage && selectedIds.length > 0 && (
              <button type="button" onClick={handleBulkProcess} disabled={bulkSaving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-60">
                <CheckCircle className="w-4 h-4" />
                {bulkSaving ? 'Updating…' : `Process ${selectedIds.length}`}
              </button>
            )}
            <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            {canManage && (
              <button type="button" onClick={() => { setFormData(emptyForm); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm">
                <Plus className="w-4 h-4" /> New record
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-2xl"
            >
              <div className="px-6 py-5 border-b border-slate-200/70 dark:border-gray-700/60 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {editingPayroll ? 'Edit payroll record' : 'New payroll record'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Gross, tax, and net use the locked calculation formulas.</p>
                </div>
                <button type="button" onClick={closeForm} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="text-sm space-y-1">
                    <span className="font-medium text-slate-700 dark:text-slate-200">Employee *</span>
                    <select required value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-950">
                      <option value="">Select employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.full_name}{emp.department ? ` — ${emp.department}` : ''}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm space-y-1">
                    <span className="font-medium text-slate-700 dark:text-slate-200">Month *</span>
                    <select required value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-950">
                      <option value="">Select month</option>
                      {PAYROLL_MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </label>
                  <label className="text-sm space-y-1">
                    <span className="font-medium text-slate-700 dark:text-slate-200">Year *</span>
                    <select required value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-950">
                      {PAYROLL_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    ['basic_salary', 'Basic salary *', true],
                    ['allowances', 'Allowances', false],
                    ['bonus', 'Bonus', false],
                    ['deductions', 'Deductions', false],
                    ['overtime_hours', 'OT hours', false],
                    ['overtime_rate', 'OT rate', false],
                    ['tax_rate', 'Tax %', false],
                  ].map(([key, label, required]) => (
                    <label key={key} className="text-sm space-y-1">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
                      <input type="number" step="0.01" required={required} value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-950" />
                    </label>
                  ))}
                </div>
                <label className="text-sm space-y-1 block">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Notes</span>
                  <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-950" />
                </label>
                {formData.basic_salary && (
                  <div className="rounded-2xl bg-slate-50 dark:bg-gray-800/60 p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><p className="text-slate-500 text-xs">Gross</p><p className="font-semibold text-emerald-600">{formatPayrollCurrency(preview.gross)}</p></div>
                    <div><p className="text-slate-500 text-xs">Tax</p><p className="font-semibold">{formatPayrollCurrency(preview.tax)}</p></div>
                    <div><p className="text-slate-500 text-xs">Deductions</p><p className="font-semibold text-rose-600">-{formatPayrollCurrency(formData.deductions)}</p></div>
                    <div><p className="text-slate-500 text-xs">Net</p><p className="font-bold text-blue-600">{formatPayrollCurrency(preview.net)}</p></div>
                    {preview.error && <p className="col-span-full text-xs text-rose-600">{preview.error}</p>}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeForm} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-700 text-sm">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-60">
                    {saving ? 'Saving…' : editingPayroll ? 'Update record' : 'Create record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200/70 dark:border-gray-700/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Payroll records</h2>
          <span className="text-xs text-slate-500">{visiblePayrolls.length} shown</span>
        </div>
        {visiblePayrolls.length === 0 ? (
          <div className="text-center py-14 px-6">
            <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            {hasActiveFilters ? (
              <>
                <p className="font-medium text-slate-700 dark:text-slate-200">No records match these filters</p>
                <button type="button" onClick={() => setFilters({ month: '', year: '', status: '', department: '', search: '' })} className="mt-4 text-sm text-blue-600">Clear filters</button>
              </>
            ) : (
              <>
                <p className="font-medium text-slate-700 dark:text-slate-200">No payroll records yet</p>
                <p className="text-sm text-slate-500 mt-1 mb-4">Run a batch and publish it, or add a single record.</p>
                {canManage && onNavigateToRun && (
                  <button type="button" onClick={onNavigateToRun} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm">
                    <Calculator className="w-4 h-4" /> Run payroll
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-slate-50/90 dark:bg-gray-800/80 text-slate-600 dark:text-slate-300">
                <tr>
                  {canManage && (
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" checked={allPendingSelected} onChange={toggleSelectAllPending} title="Select pending rows" />
                    </th>
                  )}
                  <th className="text-left px-4 py-3 font-semibold">Employee</th>
                  <th className="text-left px-4 py-3 font-semibold">Period</th>
                  <th className="text-right px-4 py-3 font-semibold">Gross</th>
                  <th className="text-right px-4 py-3 font-semibold">Tax</th>
                  <th className="text-right px-4 py-3 font-semibold">Net</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {visiblePayrolls.map((payroll) => {
                  const open = expandedId === payroll.id;
                  return (
                    <React.Fragment key={payroll.id}>
                      <tr className="border-t border-slate-100 dark:border-gray-800 hover:bg-slate-50/70 dark:hover:bg-gray-800/40">
                        {canManage && (
                          <td className="px-4 py-3">
                            {payroll.status === 'pending' && (
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(payroll.id)}
                                onChange={(e) => setSelectedIds((ids) => (e.target.checked ? [...ids, payroll.id] : ids.filter((id) => id !== payroll.id)))}
                              />
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-white">{payroll.employee_name}</div>
                          <div className="text-xs text-slate-400">{payroll.department || '—'} · {staffCode(payroll)}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{payroll.month} {payroll.year}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-medium whitespace-nowrap">{formatPayrollCurrency(payroll.gross_salary)}</td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatPayrollCurrency(payroll.tax_amount)}</td>
                        <td className="px-4 py-3 text-right text-blue-600 font-semibold whitespace-nowrap">{formatPayrollCurrency(payroll.net_salary)}</td>
                        <td className="px-4 py-3">
                          {canManage ? (
                            <select
                              value={payroll.status}
                              onChange={(e) => handleStatusChange(payroll.id, e.target.value)}
                              className={`px-2 py-1 text-xs rounded-full border-0 font-medium ${STATUS_STYLES[payroll.status] || ''}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="processed">Processed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[payroll.status] || ''}`}>
                              {payroll.status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => setExpandedId(open ? null : payroll.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500" title="Details">
                              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {canManage && (
                              <button type="button" onClick={() => handleEdit(payroll)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500">
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button type="button" onClick={() => handleDelete(payroll.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {open && (
                        <tr className="bg-slate-50/80 dark:bg-gray-800/40">
                          <td colSpan={canManage ? 8 : 7} className="px-6 py-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div><span className="text-slate-500">Basic</span><div className="font-medium">{formatPayrollCurrency(payroll.basic_salary)}</div></div>
                              <div><span className="text-slate-500">Allowances</span><div className="font-medium">{formatPayrollCurrency(payroll.allowances)}</div></div>
                              <div><span className="text-slate-500">Overtime</span><div className="font-medium">{formatPayrollCurrency((payroll.overtime_hours || 0) * (payroll.overtime_rate || 0))}</div></div>
                              <div><span className="text-slate-500">Bonus</span><div className="font-medium">{formatPayrollCurrency(payroll.bonus)}</div></div>
                              <div><span className="text-slate-500">Deductions</span><div className="font-medium text-rose-600">-{formatPayrollCurrency(payroll.deductions)}</div></div>
                              {payroll.notes && <div className="col-span-2"><span className="text-slate-500">Notes</span><div>{payroll.notes}</div></div>}
                              {payroll.processed_by && <div><span className="text-slate-500">Processed by</span><div>{payroll.processed_by}</div></div>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
