// EnhancedCalendar.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, ChevronLeft, ChevronRight, Clock, DollarSign, 
  TrendingUp, TrendingDown, CheckCircle, AlertTriangle, XCircle,
  Plus, Eye, Filter, Search, Sparkles, Zap, Grid, List, CalendarDays,
  BarChart3, PieChart, LineChart, Settings, Download, Share2, X
} from 'lucide-react';
import { supabase } from '../supabaseClient';

const EnhancedCalendar = ({ events = [], onDateClick, onEventsUpdate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [viewMode, setViewMode] = useState('month'); // month, week, list, agenda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Check and update overdue events automatically
  useEffect(() => {
    const checkAndUpdateOverdueEvents = async () => {
      const today = new Date();
      const overdueEvents = events.filter(event => {
        if (event.status === 'paid' || event.status === 'cancelled') return false;
        const dueDate = new Date(event.due_date);
        return dueDate < today;
      });

      if (overdueEvents.length > 0) {
        try {
          const eventIds = overdueEvents.map(event => event.id);
          const { error } = await supabase
            .from('payment_events')
            .update({ status: 'overdue' })
            .in('id', eventIds);

          if (error) {
            console.error('Error updating overdue events:', error);
          } else {
            const updatedEvents = events.map(event => {
              if (eventIds.includes(event.id)) {
                return { ...event, status: 'overdue' };
              }
              return event;
            });
            
            if (onEventsUpdate) {
              onEventsUpdate(updatedEvents);
            }
          }
        } catch (error) {
          console.error('Error updating overdue events:', error);
        }
      }
    };

    checkAndUpdateOverdueEvents();
  }, [events, onEventsUpdate]);

  // Generate calendar days with proper week alignment
  const calendarDays = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const days = [];
    
    // Add previous month's days to fill first week
    const firstDayOfWeek = start.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(start);
      prevDate.setDate(start.getDate() - (i + 1));
      days.push(prevDate);
    }
    
    // Add current month's days
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    // Add next month's days to fill last week
    const lastDayOfWeek = end.getDay();
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      const nextDate = new Date(end);
      nextDate.setDate(end.getDate() + i);
      days.push(nextDate);
    }
    
    return days;
  }, [currentDate]);

  // Filter events based on search and status
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.amount?.toString().includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [events, searchTerm, statusFilter]);

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.due_date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Get status configuration for events
  const getStatusConfig = (status) => {
    switch (status) {
      case 'paid':
        return {
          color: 'bg-gradient-to-r from-green-500 to-emerald-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          label: 'Paid',
          priority: 1
        };
      case 'pending':
        return {
          color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: Clock,
          label: 'Pending',
          priority: 2
        };
      case 'overdue':
        return {
          color: 'bg-gradient-to-r from-red-500 to-pink-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: AlertTriangle,
          label: 'Overdue',
          priority: 3
        };
      case 'cancelled':
        return {
          color: 'bg-gradient-to-r from-gray-500 to-slate-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: XCircle,
          label: 'Cancelled',
          priority: 4
        };
      default:
        return {
          color: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: Clock,
          label: 'Unknown',
          priority: 5
        };
    }
  };

  // Get calendar day background color based on events
  const getDayBackgroundColor = (date) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return 'bg-white hover:bg-gray-50';
    
    const hasOverdue = dayEvents.some(event => event.status === 'overdue');
    const hasPaid = dayEvents.some(event => event.status === 'paid');
    const hasPending = dayEvents.some(event => event.status === 'pending');
    
    if (hasOverdue) return 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:from-red-100 hover:to-pink-100';
    if (hasPaid) return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100';
    if (hasPending) return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 hover:from-yellow-100 hover:to-orange-100';
    
    return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100';
  };

  // Navigation functions
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

  // Get day names for header
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const total = filteredEvents.length;
    const pending = filteredEvents.filter(e => e.status === 'pending').length;
    const paid = filteredEvents.filter(e => e.status === 'paid').length;
    const overdue = filteredEvents.filter(e => e.status === 'overdue').length;
    const cancelled = filteredEvents.filter(e => e.status === 'cancelled').length;
    const totalAmount = filteredEvents.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const pendingAmount = filteredEvents
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const overdueAmount = filteredEvents
      .filter(e => e.status === 'overdue')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    return { 
      total, pending, paid, overdue, cancelled, 
      totalAmount, pendingAmount, overdueAmount 
    };
  }, [filteredEvents]);

  const handleDateClick = (day, dayEvents) => {
    setSelectedDate(day);
    if (dayEvents.length > 0) {
      setShowEventDetails(true);
    }
    if (onDateClick) {
      onDateClick(day, dayEvents);
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Render different view modes
  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-2">
      {/* Day Headers */}
      {dayNames.map((day, index) => (
        <motion.div
          key={day}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-4 text-center text-sm font-semibold text-gray-600 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200"
        >
          {day}
        </motion.div>
      ))}

      {/* Calendar Days */}
      {calendarDays.map((day, index) => {
        const dayEvents = getEventsForDate(day);
        const isToday = day.toDateString() === new Date().toDateString();
        const isCurrentMonth = day.getMonth() === currentDate.getMonth() && day.getFullYear() === currentDate.getFullYear();
        const isSelected = selectedDate && selectedDate.toDateString() === day.toDateString();

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDateClick(day, dayEvents)}
            className={`
              relative p-3 min-h-[100px] border-2 rounded-xl cursor-pointer transition-all duration-300
              ${isCurrentMonth ? getDayBackgroundColor(day) : 'bg-gray-50 border-gray-200'}
              ${isToday ? 'ring-2 ring-blue-500 ring-opacity-70 shadow-lg' : ''}
              ${isSelected ? 'ring-2 ring-purple-500 ring-opacity-70 shadow-xl' : ''}
              hover:shadow-lg transform hover:-translate-y-1
            `}
          >
            {/* Day Number */}
            <div className={`
              text-sm font-bold mb-2 flex items-center justify-between
              ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
              ${isToday ? 'text-blue-600' : ''}
              ${isSelected ? 'text-purple-600' : ''}
            `}>
              <span>{day.getDate()}</span>
              {dayEvents.length > 0 && (
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              )}
            </div>

            {/* Event Indicators */}
            {dayEvents.length > 0 && (
              <div className="space-y-1">
                {dayEvents
                  .sort((a, b) => getStatusConfig(a.status).priority - getStatusConfig(b.status).priority)
                  .slice(0, 3)
                  .map((event, eventIndex) => {
                    const statusConfig = getStatusConfig(event.status);
                    const IconComponent = statusConfig.icon;
                    
                    return (
                      <motion.div
                        key={eventIndex}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: eventIndex * 0.1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className={`
                          flex items-center space-x-2 p-2 rounded-lg text-xs font-medium
                          ${statusConfig.bgColor} ${statusConfig.borderColor} border
                          hover:shadow-md transition-all duration-200 cursor-pointer
                        `}
                        title={`${event.description} - ${event.amount} ${event.currency}`}
                      >
                        <IconComponent className="w-3 h-3" />
                        <span className={`${statusConfig.textColor} truncate`}>
                          {event.description?.substring(0, 15)}...
                        </span>
                      </motion.div>
                    );
                  })}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 text-center bg-white/50 rounded-lg py-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-3">
      {filteredEvents
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .map((event, index) => {
          const statusConfig = getStatusConfig(event.status);
          const IconComponent = statusConfig.icon;
          
          return (
            <motion.div
              key={event.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleEventClick(event)}
              className={`
                p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${statusConfig.borderColor} ${statusConfig.bgColor}
                hover:shadow-lg transform hover:-translate-y-1
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${statusConfig.color} rounded-full flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{event.description}</h4>
                    <p className="text-sm text-gray-600">
                      Due: {new Date(event.due_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color} text-white`}>
                    {statusConfig.label}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-1">
                    {event.amount} {event.currency}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
    </div>
  );

  const renderAgendaView = () => (
    <div className="space-y-4">
      {filteredEvents
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .map((event, index) => {
          const statusConfig = getStatusConfig(event.status);
          const IconComponent = statusConfig.icon;
          const dueDate = new Date(event.due_date);
          const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
          
          return (
            <motion.div
              key={event.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleEventClick(event)}
              className={`
                p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${statusConfig.borderColor} ${statusConfig.bgColor}
                hover:shadow-lg transform hover:-translate-y-1
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${statusConfig.color} rounded-full flex items-center justify-center`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{event.description}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {dueDate.toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        daysUntilDue < 0 ? 'bg-red-100 text-red-700' :
                        daysUntilDue === 0 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                         daysUntilDue === 0 ? 'Due today' :
                         `${daysUntilDue} days remaining`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${statusConfig.color} text-white mb-2`}>
                    {statusConfig.label}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {event.amount} {event.currency}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Enhanced Calendar</h2>
              <p className="text-blue-100 text-sm">Advanced payment tracking and management</p>
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-white/20 rounded-xl p-1 backdrop-blur-sm">
            {[
              { key: 'month', icon: Grid, label: 'Month' },
              { key: 'week', icon: CalendarDays, label: 'Week' },
              { key: 'list', icon: List, label: 'List' },
              { key: 'agenda', icon: BarChart3, label: 'Agenda' }
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  viewMode === key 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-200" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200 backdrop-blur-sm"
          >
            <Filter className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Navigation and Month Display */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToPreviousMonth}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToToday}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Today
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToNextMonth}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>
          
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900"
          >
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </motion.h3>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
        <div className="grid grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Paid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">AED {stats.totalAmount.toLocaleString()}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Total Amount</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">AED {stats.pendingAmount.toLocaleString()}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Pending Amount</div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-6">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'list' && renderListView()}
        {viewMode === 'agenda' && renderAgendaView()}
        {viewMode === 'week' && (
          <div className="text-center py-12 text-gray-500">
            <CalendarDays className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Week view coming soon!</p>
          </div>
        )}
      </div>

      {/* Enhanced Legend */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Event Status Legend
        </h4>
        <div className="flex flex-wrap gap-4">
          {['paid', 'pending', 'overdue', 'cancelled'].map((status) => {
            const config = getStatusConfig(status);
            const IconComponent = config.icon;
            
            return (
              <div key={status} className="flex items-center space-x-2">
                <div className={`w-4 h-4 ${config.color} rounded-full flex items-center justify-center`}>
                  <IconComponent className="w-2.5 h-2.5 text-white" />
                </div>
                <span className="text-sm text-gray-600 font-medium">{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Modal */}
      <AnimatePresence>
        {showEventDetails && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Events for {selectedDate.toLocaleDateString()}
                </h3>
                <button
                  onClick={() => setShowEventDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {getEventsForDate(selectedDate).map((event, index) => {
                  const statusConfig = getStatusConfig(event.status);
                  const IconComponent = statusConfig.icon;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg border ${statusConfig.borderColor} ${statusConfig.bgColor}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{event.description}</h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color} text-white`}>
                          {statusConfig.label}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium">{event.amount} {event.currency}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconComponent className="w-4 h-4" />
                          <span>{statusConfig.label}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {showEventModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Event Details</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedEvent.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Amount</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedEvent.amount} {selectedEvent.currency}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      getStatusConfig(selectedEvent.status).color
                    } text-white`}>
                                             {(() => {
                         const IconComponent = getStatusConfig(selectedEvent.status).icon;
                         return IconComponent && <IconComponent className="w-4 h-4" />;
                       })()}
                      {getStatusConfig(selectedEvent.status).label}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Due Date</h4>
                  <p className="text-gray-700">
                    {new Date(selectedEvent.due_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedCalendar;
