import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Clock, User,
  CheckCircle, XCircle,
  Edit, Trash2, Calendar, Building,
  DollarSign, Download, Users, X, Calculator
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../supabaseClient';
import {
  PAYROLL_MONTHS,
  PAYROLL_YEARS,
  formatPayrollCurrency,
} from '../../utils/payrollConstants';

import Button from '../ui/button';
import Input from '../ui/input';
import Label from '../ui/label';
import Textarea from '../ui/textarea';

const PayrollRecordsTab = ({ onNavigateToRun }) => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();

  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    status: '',
    search: ''
  });

  const [formData, setFormData] = useState({
    employee_id: '',
    month: '',
    year: '',
    basic_salary: '',
    allowances: '',
    deductions: '',
    overtime_hours: '',
    overtime_rate: '',
    bonus: '',
    notes: ''
  });

  const months = PAYROLL_MONTHS;
  const years = PAYROLL_YEARS;

  useEffect(() => {
    fetchData();
    // Search is applied client-side, so only refetch when server-side filters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.month, filters.year, filters.status]);

  const fetchData = async () => {
    try {
      setLoading(true);

      let payrollQuery = supabase
        .from('payrolls')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.month) payrollQuery = payrollQuery.eq('month', filters.month);
      if (filters.year) payrollQuery = payrollQuery.eq('year', parseInt(filters.year, 10));
      if (filters.status) payrollQuery = payrollQuery.eq('status', filters.status);

      const [employeesRes, payrollsRes] = await Promise.all([
        supabase
          .from('employees')
          .select('id, full_name, employee_id, department, position, designation')
          .eq('status', 'active')
          .order('full_name'),
        payrollQuery
      ]);

      if (employeesRes.error) throw employeesRes.error;
      if (payrollsRes.error) throw payrollsRes.error;

      setEmployees(employeesRes.data || []);
      setPayrolls(payrollsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      showError('Error', err.message || 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = formatPayrollCurrency;

  const calculateSalary = (data) => {
    const basic = parseFloat(data.basic_salary) || 0;
    const allowances = parseFloat(data.allowances) || 0;
    const deductions = parseFloat(data.deductions) || 0;
    const overtime = (parseFloat(data.overtime_hours) || 0) * (parseFloat(data.overtime_rate) || 0);
    const bonus = parseFloat(data.bonus) || 0;

    const gross = basic + allowances + overtime + bonus;
    const net = gross - deductions;

    return { gross, net };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const salaryCalculations = calculateSalary(formData);
      const employee = employees.find(emp => String(emp.id) === String(formData.employee_id));

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
        gross_salary: salaryCalculations.gross,
        net_salary: salaryCalculations.net,
        notes: formData.notes || null
      };

      if (editingPayroll) {
        const { data, error } = await supabase
          .from('payrolls')
          .update({ ...payrollData, updated_at: new Date().toISOString() })
          .eq('id', editingPayroll.id)
          .select()
          .single();
        if (error) throw error;

        setPayrolls(payrolls.map(payroll => (payroll.id === data.id ? data : payroll)));
        success('Success', 'Payroll updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('payrolls')
          .insert({
            ...payrollData,
            status: 'pending',
            created_by: user?.id || null
          })
          .select()
          .single();
        if (error) throw error;

        setPayrolls([data, ...payrolls]);
        success('Success', 'Payroll created successfully!');
      }

      setShowForm(false);
      setEditingPayroll(null);
      resetForm();
    } catch (err) {
      console.error('Error submitting payroll:', err);
      const message = err?.code === '23505'
        ? 'A payroll record already exists for this employee in the selected month and year.'
        : err.message || 'Failed to submit payroll. Please try again.';
      showError('Error', message);
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
      notes: payroll.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payroll record?')) {
      try {
        const { error } = await supabase.from('payrolls').delete().eq('id', id);
        if (error) throw error;

        setPayrolls(payrolls.filter(payroll => payroll.id !== id));
        success('Success', 'Payroll deleted successfully!');
      } catch (err) {
        console.error('Error deleting payroll:', err);
        showError('Error', err.message || 'Failed to delete payroll. Please try again.');
      }
    }
  };

  const handleStatusChange = async (payrollId, newStatus) => {
    try {
      const statusUpdate = {
        status: newStatus,
        processed_date: newStatus === 'processed' ? new Date().toISOString() : null,
        processed_by: newStatus === 'processed' ? userProfile?.full_name || 'Unknown' : null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('payrolls')
        .update(statusUpdate)
        .eq('id', payrollId)
        .select()
        .single();
      if (error) throw error;

      setPayrolls(payrolls.map(payroll => (payroll.id === payrollId ? data : payroll)));
      success('Success', `Payroll status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating payroll status:', err);
      showError('Error', err.message || 'Failed to update payroll status. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      month: '',
      year: '',
      basic_salary: '',
      allowances: '',
      deductions: '',
      overtime_hours: '',
      overtime_rate: '',
      bonus: '',
      notes: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'processed': return <CheckCircle className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const canManage = ['admin', 'hr_manager'].includes(userProfile?.role);

  const canEdit = (payroll) => canManage;

  const canDelete = (payroll) => {
    return userProfile?.role === 'admin';
  };

  const canChangeStatus = (payroll) => canManage;

  const hasActiveFilters = filters.month || filters.year || filters.status || filters.search;

  const clearFilters = () => {
    setFilters({ month: '', year: '', status: '', search: '' });
  };

  const handleExport = () => {
    if (visiblePayrolls.length === 0) {
      showError('Nothing to export', 'There are no payroll records matching the current filters.');
      return;
    }

    const headers = [
      'Employee', 'Department', 'Month', 'Year', 'Basic Salary', 'Allowances',
      'Overtime Hours', 'Overtime Rate', 'Bonus', 'Gross Salary', 'Deductions',
      'Net Salary', 'Status', 'Processed Date', 'Processed By', 'Notes'
    ];

    const escapeCsv = (value) => {
      const str = String(value ?? '');
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const rows = visiblePayrolls.map(p => [
      p.employee_name, p.department, p.month, p.year, p.basic_salary, p.allowances,
      p.overtime_hours, p.overtime_rate, p.bonus, p.gross_salary, p.deductions,
      p.net_salary, p.status,
      p.processed_date ? new Date(p.processed_date).toLocaleDateString() : '',
      p.processed_by || '', p.notes || ''
    ].map(escapeCsv).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${filters.month || 'all'}-${filters.year || 'all'}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    success('Exported', `${visiblePayrolls.length} payroll record(s) exported to CSV.`);
  };

  const visiblePayrolls = payrolls.filter(payroll =>
    !filters.search ||
    (payroll.employee_name || '').toLowerCase().includes(filters.search.toLowerCase()) ||
    (payroll.department || '').toLowerCase().includes(filters.search.toLowerCase())
  );

  const getTotalPayroll = () => {
    return payrolls.reduce((total, payroll) => total + payroll.net_salary, 0);
  };

  const getPendingPayrolls = () => {
    return payrolls.filter(payroll => payroll.status === 'pending').length;
  };

  const getProcessedPayrolls = () => {
    return payrolls.filter(payroll => payroll.status === 'processed').length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Net Payroll', value: formatCurrency(getTotalPayroll()), icon: DollarSign, bg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
          { label: 'Processed', value: getProcessedPayrolls(), icon: CheckCircle, bg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600' },
          { label: 'Pending', value: getPendingPayrolls(), icon: Clock, bg: 'bg-yellow-100 dark:bg-yellow-900/30', iconColor: 'text-yellow-600' },
          { label: 'Active Employees', value: employees.length, icon: Users, bg: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search employees..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-64"
              />
            </div>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">All Months</option>
              {months.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processed">Processed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm transition"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm transition"
              >
                <Plus className="w-4 h-4" /> New Record
              </button>
            )}
          </div>
        </div>
      </div>

        {/* Payroll Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingPayroll ? 'Edit Payroll' : 'Create New Payroll'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPayroll(null);
                    resetForm();
                  }}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="employee_id">Employee *</Label>
                    <select
                      id="employee_id"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.full_name}{employee.department ? ` - ${employee.department}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="month">Month *</Label>
                    <select
                      id="month"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Month</option>
                      {months.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="year">Year *</Label>
                    <select
                      id="year"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Year</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="basic_salary">Basic Salary *</Label>
                    <Input
                      id="basic_salary"
                      type="number"
                      step="0.01"
                      value={formData.basic_salary}
                      onChange={(e) => setFormData({ ...formData, basic_salary: e.target.value })}
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="allowances">Allowances</Label>
                    <Input
                      id="allowances"
                      type="number"
                      step="0.01"
                      value={formData.allowances}
                      onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deductions">Deductions</Label>
                    <Input
                      id="deductions"
                      type="number"
                      step="0.01"
                      value={formData.deductions}
                      onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bonus">Bonus</Label>
                    <Input
                      id="bonus"
                      type="number"
                      step="0.01"
                      value={formData.bonus}
                      onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="overtime_hours">Overtime Hours</Label>
                    <Input
                      id="overtime_hours"
                      type="number"
                      step="0.5"
                      value={formData.overtime_hours}
                      onChange={(e) => setFormData({ ...formData, overtime_hours: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="overtime_rate">Overtime Rate</Label>
                    <Input
                      id="overtime_rate"
                      type="number"
                      step="0.01"
                      value={formData.overtime_rate}
                      onChange={(e) => setFormData({ ...formData, overtime_rate: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Additional notes or comments..."
                  />
                </div>

                {/* Salary Preview */}
                {formData.basic_salary && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Salary Preview</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Basic Salary:</span>
                        <span>{formatCurrency(formData.basic_salary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allowances:</span>
                        <span>{formatCurrency(formData.allowances)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overtime:</span>
                        <span>{formatCurrency((parseFloat(formData.overtime_hours) || 0) * (parseFloat(formData.overtime_rate) || 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bonus:</span>
                        <span>{formatCurrency(formData.bonus)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Gross Salary:</span>
                        <span>{formatCurrency(calculateSalary(formData).gross)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deductions:</span>
                        <span className="text-red-600">-{formatCurrency(formData.deductions)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Net Salary:</span>
                        <span className="text-blue-600">{formatCurrency(calculateSalary(formData).net)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPayroll(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60">
                    {saving ? 'Saving...' : editingPayroll ? 'Update Payroll' : 'Create Payroll'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Payroll List */}
        <div className="rounded-2xl border border-slate-200/70 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/70 dark:border-gray-700/60 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Payroll Records</h2>
            <span className="text-sm text-slate-500">
              {visiblePayrolls.length} record{visiblePayrolls.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="p-4">
            {visiblePayrolls.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {hasActiveFilters ? (
                  <>
                    <p className="text-gray-600 font-medium mb-1">No payroll records match your filters</p>
                    <p className="text-gray-500 text-sm mb-4">Try adjusting or clearing the filters above.</p>
                    <Button variant="outline" onClick={clearFilters}>
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 font-medium mb-1">No payroll records yet</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                      {canManage
                        ? 'Run payroll from the Run Payroll tab or create a record manually.'
                        : 'Payroll records will appear here once HR creates them.'}
                    </p>
                    {canManage && onNavigateToRun && (
                      <button
                        type="button"
                        onClick={onNavigateToRun}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      >
                        <Calculator className="w-4 h-4" />
                        Run Payroll
                      </button>
                    )}
                    {canManage && !onNavigateToRun && (
                      <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        New Record
                      </Button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {visiblePayrolls.map((payroll) => (
                  <motion.div
                    key={payroll.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-slate-200/70 dark:border-gray-700/60 rounded-2xl p-4 hover:shadow-md transition-shadow bg-white/50 dark:bg-gray-900/40"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {payroll.employee_name}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payroll.status)}`}>
                            {getStatusIcon(payroll.status)}
                            {payroll.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Building className="w-4 h-4" />
                              <span>{payroll.department}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{payroll.month} {payroll.year}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <User className="w-4 h-4" />
                              <span>
                                ID: {employees.find(e => String(e.id) === String(payroll.employee_id))?.employee_id || payroll.employee_id}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Basic Salary:</span>
                              <span className="font-medium">{formatCurrency(payroll.basic_salary)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Allowances:</span>
                              <span className="font-medium">{formatCurrency(payroll.allowances)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Overtime:</span>
                              <span className="font-medium">{formatCurrency((payroll.overtime_hours || 0) * (payroll.overtime_rate || 0))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Bonus:</span>
                              <span className="font-medium">{formatCurrency(payroll.bonus)}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Gross Salary:</span>
                              <span className="font-medium text-green-600">{formatCurrency(payroll.gross_salary)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Deductions:</span>
                              <span className="font-medium text-red-600">-{formatCurrency(payroll.deductions)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-2">
                              <span className="text-gray-700">Net Salary:</span>
                              <span className="text-blue-600">{formatCurrency(payroll.net_salary)}</span>
                            </div>
                          </div>
                        </div>

                        {payroll.notes && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Notes:</span> {payroll.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {payroll.processed_date && (
                            <span>Processed: {new Date(payroll.processed_date).toLocaleDateString()}</span>
                          )}
                          {payroll.processed_by && (
                            <span>By: {payroll.processed_by}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Status Change Controls */}
                        {canChangeStatus(payroll) && (
                          <select
                            value={payroll.status}
                            onChange={(e) => handleStatusChange(payroll.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="processed">Processed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}

                        {canEdit(payroll) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(payroll)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete(payroll) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(payroll.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default PayrollRecordsTab;
