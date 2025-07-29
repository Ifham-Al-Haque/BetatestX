import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

// Sample upcoming payment events - you can replace this with real data from your backend
const sampleUpcomingEvents = [
  {
    id: 1,
    service: 'Atlassian',
    description: 'Jira & Confluence License',
    amount: 2500,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    status: 'upcoming',
    category: 'Software License',
    priority: 'high'
  },
  {
    id: 2,
    service: 'Ziwo',
    description: 'Call Center Software',
    amount: 1800,
    dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
    status: 'upcoming',
    category: 'Communication',
    priority: 'medium'
  },
  {
    id: 3,
    service: 'AWS',
    description: 'Cloud Infrastructure',
    amount: 3200,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    status: 'urgent',
    category: 'Infrastructure',
    priority: 'high'
  },
  {
    id: 4,
    service: 'Microsoft 365',
    description: 'Office Suite License',
    amount: 1500,
    dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    status: 'upcoming',
    category: 'Software License',
    priority: 'medium'
  },
  {
    id: 5,
    service: 'Zoom',
    description: 'Video Conferencing',
    amount: 800,
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    status: 'upcoming',
    category: 'Communication',
    priority: 'low'
  }
];

export default function UpcomingPaymentEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, urgent, upcoming, overdue

  useEffect(() => {
    // Simulate loading real data
    setTimeout(() => {
      setEvents(sampleUpcomingEvents);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'urgent':
        return 'bg-red-500';
      case 'overdue':
        return 'bg-orange-500';
      case 'upcoming':
        return 'bg-blue-500';
      case 'paid':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} days`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.status === filter;
  });

  const totalUpcoming = events.reduce((sum, event) => sum + event.amount, 0);
  const urgentEvents = events.filter(event => event.status === 'urgent').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with Summary */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Upcoming Payment Events</h3>
            <p className="text-sm text-gray-600">Track your upcoming service payments</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              AED {totalUpcoming.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Upcoming</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div 
          className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <div className="text-sm text-blue-600 font-medium">Total Events</div>
          </div>
          <div className="text-xl font-bold text-blue-800">{events.length}</div>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <div className="text-sm text-red-600 font-medium">Urgent</div>
          </div>
          <div className="text-xl font-bold text-red-800">{urgentEvents}</div>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <div className="text-sm text-green-600 font-medium">This Month</div>
          </div>
          <div className="text-xl font-bold text-green-800">
            {events.filter(e => new Date(e.dueDate).getMonth() === new Date().getMonth()).length}
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <div className="text-sm text-purple-600 font-medium">Avg. Amount</div>
          </div>
          <div className="text-xl font-bold text-purple-800">
            AED {Math.round(totalUpcoming / events.length).toLocaleString()}
          </div>
        </motion.div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'All Events', color: 'bg-gray-600 hover:bg-gray-700' },
          { key: 'urgent', label: 'Urgent', color: 'bg-red-600 hover:bg-red-700' },
          { key: 'upcoming', label: 'Upcoming', color: 'bg-blue-600 hover:bg-blue-700' },
          { key: 'overdue', label: 'Overdue', color: 'bg-orange-600 hover:bg-orange-700' }
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${filter === key ? color : 'bg-gray-400 hover:bg-gray-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(event.status)}`}></div>
                      <h4 className="font-semibold text-gray-800">{event.service}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(event.priority)}`}>
                        {event.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getDaysUntilDue(event.dueDate)}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {event.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-blue-600">
                      AED {event.amount.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {getStatusIcon(event.status)}
                      <span className="text-xs text-gray-500 capitalize">{event.status}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              <div className="text-4xl mb-2">📅</div>
              <div>No {filter === 'all' ? '' : filter} events found</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Event Button */}
      <div className="mt-6 text-center">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto">
          <span>➕</span>
          Add New Payment Event
        </button>
      </div>
    </div>
  );
} 