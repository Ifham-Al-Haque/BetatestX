// PaymentCalendar.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Clock, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isAfter, isBefore } from 'date-fns';
import { supabase } from '../supabaseClient';

const PaymentCalendar = ({ events = [], onDateClick, onEventsUpdate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Check and update overdue events automatically
  useEffect(() => {
    const checkAndUpdateOverdueEvents = async () => {
      const today = new Date();
      const overdueEvents = events.filter(event => {
        if (event.status === 'paid' || event.status === 'cancelled') return false;
        const dueDate = new Date(event.due_date);
        return isBefore(dueDate, today);
      });

      if (overdueEvents.length > 0) {
        try {
          // Update all overdue events to 'overdue' status
          const eventIds = overdueEvents.map(event => event.id);
          const { error } = await supabase
            .from('payment_events')
            .update({ status: 'overdue' })
            .in('id', eventIds);

          if (error) {
            console.error('Error updating overdue events:', error);
          } else {
            // Update local events state
            const updatedEvents = events.map(event => {
              if (eventIds.includes(event.id)) {
                return { ...event, status: 'overdue' };
              }
              return event;
            });
            
            // Notify parent component about the update
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

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.due_date);
      return isSameDay(eventDate, date);
    });
  };

  // Get status color for events
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  // Get calendar day background color based on events
  const getDayBackgroundColor = (date) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return 'bg-white';
    
    const hasOverdue = dayEvents.some(event => event.status === 'overdue');
    const hasPaid = dayEvents.some(event => event.status === 'paid');
    const hasPending = dayEvents.some(event => event.status === 'pending');
    
    if (hasOverdue) return 'bg-red-50 border-red-200';
    if (hasPaid) return 'bg-green-50 border-green-200';
    if (hasPending) return 'bg-yellow-50 border-yellow-200';
    
    return 'bg-blue-50 border-blue-200';
  };

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get day names for header
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Payment Calendar</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Month/Year Display */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {dayNames.map(day => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded-lg"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDateClick && onDateClick(day, dayEvents)}
              className={`
                relative p-3 min-h-[80px] border rounded-lg cursor-pointer transition-all duration-200
                ${isCurrentMonth ? getDayBackgroundColor(day) : 'bg-gray-50 border-gray-200'}
                ${isToday ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                hover:bg-blue-50 hover:border-blue-300
              `}
            >
              {/* Day Number */}
              <div className={`
                text-sm font-medium mb-1
                ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                ${isToday ? 'text-blue-600 font-bold' : ''}
              `}>
                {format(day, 'd')}
              </div>

              {/* Event Indicators */}
              {dayEvents.length > 0 && (
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={`
                        w-full h-2 rounded-full ${getStatusColor(event.status)}
                        opacity-80
                      `}
                      title={`${event.description} - ${event.amount} ${event.currency}`}
                    />
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Event Status Legend</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Paid</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Overdue</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Cancelled</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {events.filter(e => e.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => e.status === 'paid').length}
            </div>
            <div className="text-sm text-gray-600">Paid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {events.filter(e => e.status === 'overdue').length}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCalendar;



