import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, DollarSign, Clock, AlertTriangle, CheckCircle, Plus, X } from 'lucide-react';
import paymentService from '../services/paymentService';
import { AnimatePresence, motion } from 'framer-motion';


const UpcomingPaymentEvents = () => {
  const [paymentEvents, setPaymentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPayment, setNewPayment] = useState({
    title: '',
    amount: '',
    dueDate: '',
    type: 'expense',
    priority: 'medium',
    description: ''
  });

  const [scheduleError, setScheduleError] = useState('');

  const formatAED = (amount) =>
    `AED ${Number(amount || 0).toLocaleString()}`;

  useEffect(() => {
    // Load payments from service
    setPaymentEvents(paymentService.getUpcomingPayments());
    setLoading(false);
    
    // Subscribe to payment changes
    const unsubscribe = paymentService.subscribe((updatedPayments) => {
      setPaymentEvents(paymentService.getUpcomingPayments());
    });
    
    return unsubscribe;
  }, []);



  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'salary': return <DollarSign className="w-4 h-4" />;
      case 'expense': return <Clock className="w-4 h-4" />;
      case 'maintenance': return <AlertTriangle className="w-4 h-4" />;
      case 'insurance': return <CheckCircle className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueStatus = (daysUntilDue) => {
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue === 0) return 'due-today';
    if (daysUntilDue <= 3) return 'due-soon';
    return 'upcoming';
  };

  const getDueStatusColor = (status) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'due-today': return 'bg-orange-100 text-orange-800';
      case 'due-soon': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const filteredPaymentEvents = useMemo(() => {
    return paymentEvents.filter((event) => {
      if (filter === 'all') return true;
      if (filter === 'high') return event.priority === 'high';
      if (filter === 'due-soon') {
        const daysUntilDue = getDaysUntilDue(event.dueDate);
        return daysUntilDue >= 0 && daysUntilDue <= 3;
      }
      return true;
    });
  }, [paymentEvents, filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading payment events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Upcoming Payment Events</h1>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Payment
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Export Report
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900">Total Upcoming</h3>
              <p className="text-3xl font-bold text-blue-600">AED {paymentService.getPaymentStats().pending.toLocaleString()}</p>
              <p className="text-sm text-blue-700">This month</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="text-lg font-semibold text-red-900">High Priority</h3>
              <p className="text-3xl font-bold text-red-600">AED {paymentService.getUpcomingPayments().filter(p => p.priority === 'high').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
              <p className="text-sm text-red-700">Requires attention</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900">Due This Week</h3>
              <p className="text-3xl font-bold text-yellow-600">AED {(() => {
                const today = new Date();
                const thisWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                return paymentService.getUpcomingPayments().filter(p => {
                  const dueDate = new Date(p.dueDate);
                  return dueDate <= thisWeek && dueDate >= today;
                }).reduce((sum, p) => sum + p.amount, 0);
              })().toLocaleString()}</p>
              <p className="text-sm text-yellow-700">Next 7 days</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900">Low Priority</h3>
              <p className="text-3xl font-bold text-green-600">AED {paymentService.getUpcomingPayments().filter(p => p.priority === 'low').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
              <p className="text-sm text-green-700">Can wait</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'high'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              High Priority
            </button>
            <button
              onClick={() => setFilter('due-soon')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'due-soon'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Due Soon
            </button>
          </div>

          {/* Payment Events Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payment Schedule</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPaymentEvents.length === 0 ? (
                    <tr>
                      <td className="px-6 py-10 text-center text-gray-500" colSpan={6}>
                        No events match this filter.
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {filteredPaymentEvents.map((event) => {
                        const daysUntilDue = getDaysUntilDue(event.dueDate);
                        const dueStatus = getDueStatus(daysUntilDue);
                        
                        return (
                          <motion.tr
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.18 }}
                            className="hover:bg-gray-50"
                          >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              {getTypeIcon(event.type)}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{event.title}</div>
                              <div className="text-sm text-gray-500">{event.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatAED(event.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{event.dueDate}</div>
                          <div className="text-xs text-gray-500">
                            {daysUntilDue < 0 
                              ? `${Math.abs(daysUntilDue)} days overdue`
                              : daysUntilDue === 0
                              ? 'Due today'
                              : `${daysUntilDue} days left`
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                            {event.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDueStatusColor(dueStatus)}`}>
                            {dueStatus.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          <button className="text-green-600 hover:text-green-900">Process</button>
                        </td>
                        </motion.tr>
                      );
                      })}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Payment Form Modal */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ y: 12, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 12, opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-2xl overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Schedule New Payment</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setScheduleError('');
                      }}
                      className="text-gray-500 hover:text-gray-900 transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                
                  {scheduleError && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                      {scheduleError}
                    </div>
                  )}

                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={newPayment.title}
                      onChange={(e) => setNewPayment({...newPayment, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Payment title"
                    />
                  </div>
                  
                  <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (AED)</label>
                    <input
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newPayment.dueDate}
                      onChange={(e) => setNewPayment({...newPayment, dueDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={newPayment.type}
                      onChange={(e) => setNewPayment({...newPayment, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="expense">Expense</option>
                      <option value="salary">Salary</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="insurance">Insurance</option>
                      <option value="rent">Rent</option>
                      <option value="utilities">Utilities</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={newPayment.priority}
                      onChange={(e) => setNewPayment({...newPayment, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newPayment.description}
                      onChange={(e) => setNewPayment({...newPayment, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Payment description"
                      rows="3"
                    />
                  </div>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newPayment.title || !newPayment.amount || !newPayment.dueDate) {
                          setScheduleError('Please fill Title, Amount, and Due Date.');
                          return;
                        }
                        paymentService.addPayment(newPayment);
                        setNewPayment({
                          title: '',
                          amount: '',
                          dueDate: '',
                          type: 'expense',
                          priority: 'medium',
                          description: ''
                        });
                        setScheduleError('');
                        setShowAddForm(false);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Schedule Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setScheduleError('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
    </div>
  );
};

export default UpcomingPaymentEvents;
