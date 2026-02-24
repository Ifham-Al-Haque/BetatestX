import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import paymentService from '../services/paymentService';

const PaymentCalendarWidget = ({ 
  showAddForm = false, 
  onAddPayment = null, 
  compact = false,
  showSummary = true,
  showActions = true 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [payments, setPayments] = useState([]);
  const [showAddFormLocal, setShowAddFormLocal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    title: '',
    amount: '',
    dueDate: '',
    type: 'expense',
    priority: 'medium',
    description: ''
  });

  useEffect(() => {
    // Load payments from service
    setPayments(paymentService.getAllPayments());
    
    // Subscribe to payment changes
    const unsubscribe = paymentService.subscribe((updatedPayments) => {
      setPayments(updatedPayments);
    });
    
    return unsubscribe;
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getPaymentsForDate = (date) => {
    return paymentService.getPaymentsForDate(date);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 text-gray-300"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const payments = getPaymentsForDate(date);
      const hasPayments = payments.length > 0;
      
      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`p-2 cursor-pointer hover:bg-blue-50 transition-colors ${
            compact ? 'min-h-[60px]' : 'min-h-[80px]'
          } ${
            isToday ? 'bg-blue-100 font-bold' : ''
          } ${isSelected ? 'bg-blue-200' : ''}`}
        >
          <span className={`${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </span>
          {hasPayments && (
            <div className="mt-1 space-y-1">
              {payments.slice(0, compact ? 1 : 2).map(payment => (
                <div
                  key={payment.id}
                  className={`text-xs px-1 py-0.5 rounded ${getStatusColor(payment.status)}`}
                >
                  ₹{payment.amount.toLocaleString()}
                </div>
              ))}
              {payments.length > (compact ? 1 : 2) && (
                <div className="text-xs text-gray-500">+{payments.length - (compact ? 1 : 2)} more</div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleAddPayment = () => {
    if (onAddPayment) {
      onAddPayment(newPayment);
    } else {
      // Local handling
      if (newPayment.title && newPayment.amount && newPayment.dueDate) {
        paymentService.addPayment(newPayment);
        setNewPayment({
          title: '',
          amount: '',
          dueDate: '',
          type: 'expense',
          priority: 'medium',
          description: ''
        });
        setShowAddFormLocal(false);
      }
    }
  };

  return (
    <div className={`${compact ? '' : 'min-h-screen bg-gray-50 p-6'}`}>
      <div className={`${compact ? '' : 'max-w-7xl mx-auto'}`}>
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${compact ? 'p-4' : 'p-6'}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className={`font-bold text-gray-900 ${compact ? 'text-lg' : 'text-2xl'}`}>
              Payment Calendar
            </h1>
            {showActions && (
              <div className="flex space-x-3">
                <button
                  onClick={goToToday}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Today
                </button>
                <button 
                  onClick={() => setShowAddFormLocal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Payment
                </button>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          {showSummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900">Total Scheduled</h3>
                <p className="text-3xl font-bold text-blue-600">₹{paymentService.getPaymentStats().totalScheduled.toLocaleString()}</p>
                <p className="text-sm text-blue-700">This month</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-900">Completed</h3>
                <p className="text-3xl font-bold text-green-600">₹{paymentService.getPaymentStats().completed.toLocaleString()}</p>
                <p className="text-sm text-green-700">This month</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-900">Pending</h3>
                <p className="text-3xl font-bold text-yellow-600">₹{paymentService.getPaymentStats().pending.toLocaleString()}</p>
                <p className="text-sm text-yellow-700">Awaiting</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-900">Overdue</h3>
                <p className="text-3xl font-bold text-purple-600">₹{paymentService.getPaymentStats().overdue.toLocaleString()}</p>
                <p className="text-sm text-purple-700">Past due</p>
              </div>
            </div>
          )}

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <h2 className={`font-semibold text-gray-900 ${compact ? 'text-lg' : 'text-xl'}`}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-50 p-3 text-center">
                <span className="text-sm font-medium text-gray-700">{day}</span>
              </div>
            ))}
            
            {/* Calendar Days */}
            {renderCalendarDays()}
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                Payments for {selectedDate.toDateString()}
              </h3>
              {(() => {
                const payments = getPaymentsForDate(selectedDate);
                if (payments.length === 0) {
                  return <p className="text-blue-700">No payments scheduled for this date.</p>;
                }
                return (
                  <div className="space-y-3">
                    {payments.map(payment => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(payment.status)}
                          <div>
                            <p className="font-medium text-gray-900">{payment.title}</p>
                            <p className="text-sm text-gray-500">{payment.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">₹{payment.amount.toLocaleString()}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Add Payment Form Modal */}
          {(showAddFormLocal || showAddForm) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule New Payment</h3>
                
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
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
                    onClick={handleAddPayment}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Schedule Payment
                  </button>
                  <button
                    onClick={() => setShowAddFormLocal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCalendarWidget;
