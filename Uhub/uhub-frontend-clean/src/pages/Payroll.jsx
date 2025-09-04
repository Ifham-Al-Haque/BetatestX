import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Filter, FileText, Clock, User, 
  AlertTriangle, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building, 
  DollarSign, CreditCard, Download, Upload, Calculator
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';

const Payroll = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      const mockEmployees = [
        { id: '1', name: 'John Doe', department: 'IT', position: 'Developer' },
        { id: '2', name: 'Jane Smith', department: 'HR', position: 'Manager' },
        { id: '3', name: 'Mike Johnson', department: 'Finance', position: 'Analyst' }
      ];

      const mockPayrolls = [
        {
          id: '1',
          employee_id: '1',
          employee_name: 'John Doe',
          department: 'IT',
          month: 'January',
          year: '2024',
          basic_salary: 5000,
          allowances: 500,
          deductions: 200,
          overtime_hours: 10,
          overtime_rate: 25,
          bonus: 300,
          gross_salary: 5800,
          net_salary: 5600,
          status: 'processed',
          processed_date: '2024-01-31T10:00:00Z',
          processed_by: 'HR Manager',
          notes: 'Regular monthly payroll'
        },
        {
          id: '2',
          employee_id: '2',
          employee_name: 'Jane Smith',
          department: 'HR',
          month: 'January',
          year: '2024',
          basic_salary: 6000,
          allowances: 600,
          deductions: 250,
          overtime_hours: 5,
          overtime_rate: 30,
          bonus: 400,
          gross_salary: 7000,
          net_salary: 6750,
          status: 'pending',
          processed_date: null,
          processed_by: null,
          notes: 'Pending approval'
        }
      ];

      setEmployees(mockEmployees);
      setPayrolls(mockPayrolls);
    } catch (err) {
      console.error('Error fetching data:', err);
      showError('Error', 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      const salaryCalculations = calculateSalary(formData);
      const employee = employees.find(emp => emp.id === formData.employee_id);
      
      const payrollData = {
        ...formData,
        employee_name: employee?.name || 'Unknown',
        department: employee?.department || 'Unknown',
        gross_salary: salaryCalculations.gross,
        net_salary: salaryCalculations.net,
        status: 'pending',
        created_by: user.id,
        created_at: new Date().toISOString()
      };

      if (editingPayroll) {
        // Update existing payroll
        const updatedPayrolls = payrolls.map(payroll => 
          payroll.id === editingPayroll.id ? { ...payroll, ...payrollData } : payroll
        );
        setPayrolls(updatedPayrolls);
        success('Success', 'Payroll updated successfully!');
      } else {
        // Create new payroll
        const newPayroll = {
          ...payrollData,
          id: Date.now().toString()
        };
        setPayrolls([...payrolls, newPayroll]);
        success('Success', 'Payroll created successfully!');
      }

      setShowForm(false);
      setEditingPayroll(null);
      resetForm();
    } catch (err) {
      console.error('Error submitting payroll:', err);
      showError('Error', 'Failed to submit payroll. Please try again.');
    }
  };

  const handleEdit = (payroll) => {
    setEditingPayroll(payroll);
    setFormData({
      employee_id: payroll.employee_id,
      month: payroll.month,
      year: payroll.year,
      basic_salary: payroll.basic_salary.toString(),
      allowances: payroll.allowances.toString(),
      deductions: payroll.deductions.toString(),
      overtime_hours: payroll.overtime_hours.toString(),
      overtime_rate: payroll.overtime_rate.toString(),
      bonus: payroll.bonus.toString(),
      notes: payroll.notes
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payroll record?')) {
      try {
        const updatedPayrolls = payrolls.filter(payroll => payroll.id !== id);
        setPayrolls(updatedPayrolls);
        success('Success', 'Payroll deleted successfully!');
      } catch (err) {
        console.error('Error deleting payroll:', err);
        showError('Error', 'Failed to delete payroll. Please try again.');
      }
    }
  };

  const handleStatusChange = async (payrollId, newStatus) => {
    try {
      const updatedPayrolls = payrolls.map(payroll => 
        payroll.id === payrollId ? { 
          ...payroll, 
          status: newStatus,
          processed_date: newStatus === 'processed' ? new Date().toISOString() : null,
          processed_by: newStatus === 'processed' ? userProfile?.full_name || 'Unknown' : null
        } : payroll
      );
      setPayrolls(updatedPayrolls);
      success('Success', `Payroll status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating payroll status:', err);
      showError('Error', 'Failed to update payroll status. Please try again.');
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

  const canEdit = (payroll) => {
    return userProfile?.role === 'admin' || userProfile?.role === 'hr';
  };

  const canDelete = (payroll) => {
    return userProfile?.role === 'admin';
  };

  const canChangeStatus = (payroll) => {
    return userProfile?.role === 'admin' || userProfile?.role === 'hr';
  };

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
      <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
        
        <div className="ml-80 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
      
      <div className="ml-80 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-gray-600">Manage employee payroll processing and calculations</p>
          </div>
          <div className="flex items-center space-x-4">
            <DarkModeToggle />
            <UserDropdown />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Payroll</p>
                  <p className="text-2xl font-bold text-gray-900">${getTotalPayroll().toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Processed</p>
                  <p className="text-2xl font-bold text-gray-900">{getProcessedPayrolls()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{getPendingPayrolls()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-400" />
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
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Months</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>

                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processed">Processed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Payroll
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                          {employee.name} - {employee.department}
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
                        <span>${parseFloat(formData.basic_salary) || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allowances:</span>
                        <span>${parseFloat(formData.allowances) || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overtime:</span>
                        <span>${(parseFloat(formData.overtime_hours) || 0) * (parseFloat(formData.overtime_rate) || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bonus:</span>
                        <span>${parseFloat(formData.bonus) || 0}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Gross Salary:</span>
                        <span>${calculateSalary(formData).gross}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deductions:</span>
                        <span>-${parseFloat(formData.deductions) || 0}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Net Salary:</span>
                        <span>${calculateSalary(formData).net}</span>
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
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingPayroll ? 'Update Payroll' : 'Create Payroll'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Payroll List */}
        <Card>
          <CardHeader>
            <CardHeader>Payroll Records</CardHeader>
          </CardHeader>
          <CardContent>
            {payrolls.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No payroll records found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payrolls.map((payroll) => (
                  <motion.div
                    key={payroll.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {payroll.employee_name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payroll.status)}`}>
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
                              <span>ID: {payroll.employee_id}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Basic Salary:</span>
                              <span className="font-medium">${payroll.basic_salary}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Allowances:</span>
                              <span className="font-medium">${payroll.allowances}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Overtime:</span>
                              <span className="font-medium">${payroll.overtime_hours * payroll.overtime_rate}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Bonus:</span>
                              <span className="font-medium">${payroll.bonus}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Gross Salary:</span>
                              <span className="font-medium text-green-600">${payroll.gross_salary}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Deductions:</span>
                              <span className="font-medium text-red-600">-${payroll.deductions}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-lg">
                              <span className="text-gray-700">Net Salary:</span>
                              <span className="text-blue-600">${payroll.net_salary}</span>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Payroll;
