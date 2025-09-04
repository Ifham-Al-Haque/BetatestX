// src/components/CalendarView.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Filter,
  Search,
  Eye,
  TrendingUp,
  Plus,
  Settings,
  Download,
  Share2,
  Bell,
  Star,
  Users,
  MapPin,
  Tag,
  X,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  CalendarDays,
  BarChart3,
  Zap,
  Sparkles
} from "lucide-react";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// Enhanced event component with better styling and more information
const EventComponent = ({ event }) => {
  const getEventTypeConfig = (type) => {
    switch (type) {
      case 'meeting':
        return {
          color: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          icon: Users,
          label: 'Meeting'
        };
      case 'deadline':
        return {
          color: 'bg-gradient-to-r from-red-500 to-pink-500',
          icon: AlertTriangle,
          label: 'Deadline'
        };
      case 'reminder':
        return {
          color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          icon: Bell,
          label: 'Reminder'
        };
      case 'event':
        return {
          color: 'bg-gradient-to-r from-green-500 to-emerald-500',
          icon: CalendarIcon,
          label: 'Event'
        };
      case 'task':
        return {
          color: 'bg-gradient-to-r from-purple-500 to-violet-500',
          icon: CheckCircle,
          label: 'Task'
        };
      default:
        return {
          color: 'bg-gradient-to-r from-gray-500 to-slate-500',
          icon: Clock,
          label: 'Event'
        };
    }
  };

  const eventConfig = getEventTypeConfig(event.type || 'event');
  const IconComponent = eventConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${eventConfig.color} text-white p-2 rounded-lg shadow-sm border border-white/20 cursor-pointer hover:shadow-md transition-all duration-200`}
      onClick={() => console.log('Event clicked:', event)}
    >
      <div className="flex items-center gap-2 mb-1">
        <IconComponent className="w-3 h-3" />
        <span className="text-xs font-semibold">{eventConfig.label}</span>
        {event.priority === 'high' && (
          <Star className="w-3 h-3 text-yellow-300" />
        )}
      </div>
      <div className="font-medium text-sm truncate mb-1">{event.title}</div>
      {event.description && (
        <div className="text-xs opacity-90 truncate">{event.description}</div>
      )}
      {event.location && (
        <div className="flex items-center gap-1 text-xs opacity-90 mt-1">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{event.location}</span>
        </div>
      )}
    </motion.div>
  );
};

// Enhanced toolbar component with more features
const CustomToolbar = ({ onNavigate, label, onView, view, onAddEvent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const goToToday = () => {
    onNavigate('TODAY');
  };

  const goToPrevious = () => {
    onNavigate('PREV');
  };

  const goToNext = () => {
    onNavigate('NEXT');
  };

  const viewNames = {
    month: { icon: Grid, label: 'Month' },
    week: { icon: CalendarDays, label: 'Week' },
    day: { icon: CalendarIcon, label: 'Day' },
    agenda: { icon: List, label: 'Agenda' }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 rounded-t-xl text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">General Calendar</h2>
            <p className="text-indigo-100 text-sm">Manage all your events, meetings, and tasks</p>
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 bg-white/20 rounded-xl p-1 backdrop-blur-sm">
          {Object.entries(viewNames).map(([viewName, { icon: Icon, label }]) => (
            <button
              key={viewName}
              onClick={() => onView(viewName)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                view === viewName 
                  ? 'bg-white text-indigo-600 shadow-lg' 
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
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-indigo-200" />
          <input
            type="text"
            placeholder="Search events, meetings, tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm"
          />
        </div>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm"
        >
          <option value="all">All Types</option>
          <option value="meeting">Meetings</option>
          <option value="deadline">Deadlines</option>
          <option value="reminder">Reminders</option>
          <option value="event">Events</option>
          <option value="task">Tasks</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 backdrop-blur-sm"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(!showFilters)}
          className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200 backdrop-blur-sm"
        >
          <Filter className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddEvent}
          className="px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </motion.button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToPrevious}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors duration-200 backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToToday}
            className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors duration-200 shadow-lg flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Today
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToNext}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors duration-200 backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold">{label}</div>
          <div className="text-indigo-100 text-sm">Current Period</div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20"
          >
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-indigo-100 mb-2">Date Range</label>
                <select className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm">
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>Next 30 Days</option>
                  <option>Custom Range</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-indigo-100 mb-2">Category</label>
                <select className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm">
                  <option>All Categories</option>
                  <option>Work</option>
                  <option>Personal</option>
                  <option>Health</option>
                  <option>Education</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-indigo-100 mb-2">Status</label>
                <select className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm">
                  <option>All Status</option>
                  <option>Upcoming</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Quick Actions Component
const QuickActions = ({ onAddEvent, onExport, onShare }) => {
  return (
    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-indigo-50 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Quick Actions</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddEvent}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Event
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExport}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onShare}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default function CalendarView({ events = [], onEventClick, onAddEvent }) {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Transform events to match react-big-calendar format with enhanced data
  const transformedEvents = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: event.title || event.description || 'Event',
      start: new Date(event.start_date || event.due_date || event.date),
      end: new Date(event.end_date || event.due_date || event.date),
      type: event.type || 'event',
      priority: event.priority || 'medium',
      description: event.description,
      location: event.location,
      category: event.category,
      status: event.status,
      resource: event
    }));
  }, [events]);

  // Enhanced event styling with better visual hierarchy
  const eventStyleGetter = (event) => {
    const getEventStyle = (type, priority) => {
      const baseStyle = {
        borderRadius: '8px',
        border: '2px solid',
        fontWeight: '600',
        fontSize: '12px',
        padding: '4px 8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease'
      };

      switch (type) {
        case 'meeting':
          return {
            ...baseStyle,
            backgroundColor: priority === 'high' ? '#1e40af' : '#3b82f6',
            borderColor: priority === 'high' ? '#1e3a8a' : '#2563eb',
            color: 'white'
          };
        case 'deadline':
          return {
            ...baseStyle,
            backgroundColor: priority === 'high' ? '#dc2626' : '#ef4444',
            borderColor: priority === 'high' ? '#b91c1c' : '#dc2626',
            color: 'white'
          };
        case 'reminder':
          return {
            ...baseStyle,
            backgroundColor: priority === 'high' ? '#d97706' : '#f59e0b',
            borderColor: priority === 'high' ? '#b45309' : '#d97706',
            color: 'white'
          };
        case 'event':
          return {
            ...baseStyle,
            backgroundColor: priority === 'high' ? '#059669' : '#10b981',
            borderColor: priority === 'high' ? '#047857' : '#059669',
            color: 'white'
          };
        case 'task':
          return {
            ...baseStyle,
            backgroundColor: priority === 'high' ? '#7c3aed' : '#8b5cf6',
            borderColor: priority === 'high' ? '#6d28d9' : '#7c3aed',
            color: 'white'
          };
        default:
          return {
            ...baseStyle,
            backgroundColor: '#6b7280',
            borderColor: '#4b5563',
            color: 'white'
          };
      }
    };

    return getEventStyle(event.type, event.priority);
  };

  // Handle event selection
  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
    if (onEventClick) {
      onEventClick(event);
    }
  };

  // Custom components
  const components = {
    event: EventComponent,
    toolbar: CustomToolbar
  };

  // Enhanced calendar messages
  const messages = {
    allDay: 'All Day',
    previous: 'Previous',
    next: 'Next',
    today: 'Today',
    month: 'Month',
    week: 'Week',
    day: 'Day',
    agenda: 'Agenda',
    date: 'Date',
    time: 'Time',
    event: 'Event',
    noEventsInRange: 'No events in this range.',
    showMore: (total) => `+ Show more (${total})`,
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    noEventsInRange: 'No events scheduled for this period.',
    allDay: 'All Day Event',
    date: 'Date',
    time: 'Time',
    event: 'Event',
    noEventsInRange: 'No events in this range.',
    showMore: (total) => `+ Show more (${total})`,
  };

  // Calculate calendar statistics
  const stats = useMemo(() => {
    const total = transformedEvents.length;
    const meetings = transformedEvents.filter(e => e.type === 'meeting').length;
    const deadlines = transformedEvents.filter(e => e.type === 'deadline').length;
    const tasks = transformedEvents.filter(e => e.type === 'task').length;
    const highPriority = transformedEvents.filter(e => e.priority === 'high').length;
    
    return { total, meetings, deadlines, tasks, highPriority };
  }, [transformedEvents]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
    >
      <div style={{ height: 700 }}>
        <Calendar
          localizer={localizer}
          events={transformedEvents}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          components={components}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          selectable
          popup
          step={60}
          timeslots={2}
          defaultView="month"
          className="enhanced-calendar"
          onSelectEvent={handleEventSelect}
          onSelectSlot={({ start, end }) => {
            console.log('Slot selected:', { start, end });
            // Could open add event modal here
          }}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions 
        onAddEvent={() => onAddEvent && onAddEvent()}
        onExport={() => console.log('Export calendar')}
        onShare={() => console.log('Share calendar')}
      />

      {/* Enhanced Stats Footer */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-indigo-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Calendar Overview</span>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Meetings: {stats.meetings}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Deadlines: {stats.deadlines}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Tasks: {stats.tasks}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">High Priority: {stats.highPriority}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              <span className="text-gray-600">Total: {stats.total}</span>
            </div>
          </div>
        </div>
      </div>

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
                  <h4 className="font-semibold text-gray-900 mb-2">Title</h4>
                  <p className="text-gray-700">{selectedEvent.title}</p>
                </div>
                
                {selectedEvent.description && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700">{selectedEvent.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Type</h4>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      getEventTypeConfig(selectedEvent.type).color
                    } text-white`}>
                      {(() => {
                        const IconComponent = getEventTypeConfig(selectedEvent.type).icon;
                        return IconComponent && <IconComponent className="w-4 h-4" />;
                      })()}
                      {getEventTypeConfig(selectedEvent.type).label}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Priority</h4>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      selectedEvent.priority === 'high' ? 'bg-red-500' :
                      selectedEvent.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    } text-white`}>
                      <Star className="w-4 h-4" />
                      {selectedEvent.priority?.charAt(0).toUpperCase() + selectedEvent.priority?.slice(1)}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Date & Time</h4>
                  <p className="text-gray-700">
                    {format(selectedEvent.start, 'PPP')} at {format(selectedEvent.start, 'p')}
                    {selectedEvent.end && selectedEvent.end !== selectedEvent.start && 
                      ` - ${format(selectedEvent.end, 'p')}`
                    }
                  </p>
                </div>

                {selectedEvent.location && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Location</h4>
                    <p className="text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {selectedEvent.location}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Custom CSS */}
      <style jsx>{`
        .enhanced-calendar {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .enhanced-calendar .rbc-header {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-bottom: 2px solid #e2e8f0;
          font-weight: 600;
          color: #475569;
          padding: 16px 8px;
          font-size: 14px;
        }
        
        .enhanced-calendar .rbc-month-view {
          border: none;
          border-radius: 0 0 12px 12px;
        }
        
        .enhanced-calendar .rbc-month-row {
          border: none;
        }
        
        .enhanced-calendar .rbc-date-cell {
          padding: 12px 8px;
          font-weight: 500;
          font-size: 14px;
        }
        
        .enhanced-calendar .rbc-off-range-bg {
          background: #f8fafc;
        }
        
        .enhanced-calendar .rbc-off-range {
          color: #94a3b8;
        }
        
        .enhanced-calendar .rbc-today {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          font-weight: 600;
        }
        
        .enhanced-calendar .rbc-event {
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .enhanced-calendar .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .enhanced-calendar .rbc-toolbar {
          margin-bottom: 0;
          padding: 0;
        }
        
        .enhanced-calendar .rbc-toolbar-label {
          display: none;
        }
        
        .enhanced-calendar .rbc-btn-group {
          display: none;
        }

        .enhanced-calendar .rbc-time-view {
          border: none;
          border-radius: 0 0 12px 12px;
        }

        .enhanced-calendar .rbc-time-header {
          border: none;
        }

        .enhanced-calendar .rbc-time-content {
          border: none;
        }

        .enhanced-calendar .rbc-timeslot-group {
          border: none;
        }

        .enhanced-calendar .rbc-day-slot {
          border: none;
        }

        .enhanced-calendar .rbc-time-slot {
          border: none;
        }

        .enhanced-calendar .rbc-agenda-view {
          border: none;
          border-radius: 0 0 12px 12px;
        }

        .enhanced-calendar .rbc-agenda-content {
          border: none;
        }

        .enhanced-calendar .rbc-agenda-date-cell {
          border: none;
          padding: 8px;
          font-weight: 500;
        }

        .enhanced-calendar .rbc-agenda-time-cell {
          border: none;
          padding: 8px;
        }

        .enhanced-calendar .rbc-agenda-event-cell {
          border: none;
          padding: 8px;
        }
      `}</style>
    </motion.div>
  );
}

// Helper function for event type configuration
function getEventTypeConfig(type) {
  switch (type) {
    case 'meeting':
      return {
        color: 'bg-gradient-to-r from-blue-500 to-indigo-500',
        icon: Users,
        label: 'Meeting'
      };
    case 'deadline':
      return {
        color: 'bg-gradient-to-r from-red-500 to-pink-500',
        icon: AlertTriangle,
        label: 'Deadline'
      };
    case 'reminder':
      return {
        color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
        icon: Bell,
        label: 'Reminder'
      };
    case 'event':
      return {
        color: 'bg-gradient-to-r from-green-500 to-emerald-500',
        icon: CalendarIcon,
        label: 'Event'
      };
    case 'task':
      return {
        color: 'bg-gradient-to-r from-purple-500 to-violet-500',
        icon: CheckCircle,
        label: 'Task'
      };
    default:
      return {
        color: 'bg-gradient-to-r from-gray-500 to-slate-500',
        icon: Clock,
        label: 'Event'
      };
  }
}
