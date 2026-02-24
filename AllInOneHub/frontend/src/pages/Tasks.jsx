import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, Clock, User, Calendar, Building,
  AlertCircle, CheckCircle, XCircle, Edit, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';

const Tasks = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    department: ''
  });

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      // This should filter tasks where assigned_to matches the current user's ID
      const mockTasks = [
        {
          id: '1',
          title: 'System Maintenance',
          description: 'Perform routine system maintenance and updates',
          assigned_to: user?.id || '2',
          assigned_by: '1',
          priority: 'high',
          department: 'IT Services',
          status: 'in_progress',
          due_date: '2024-01-15',
          estimated_hours: 4,
          created_at: '2024-01-10T10:00:00Z',
          started_at: '2024-01-12T09:00:00Z'
        },
        {
          id: '2',
          title: 'Database Backup',
          description: 'Create backup of customer database',
          assigned_to: user?.id || '2',
          assigned_by: '1',
          priority: 'medium',
          department: 'IT Services',
          status: 'pending',
          due_date: '2024-01-20',
          estimated_hours: 2,
          created_at: '2024-01-11T14:00:00Z'
        }
      ];

      // Filter tasks assigned to current user
      const userTasks = mockTasks.filter(task => task.assigned_to === user?.id);
      setTasks(userTasks);
    } catch (err) {
      console.error('Error fetching data:', err);
      showError('Error', 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      setTasks(updatedTasks);
      success('Success', `Task status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      console.error('Error updating task status:', err);
      showError('Error', 'Failed to update task status. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:shadow-[0_0_10px_rgba(59,130,246,0.3)]';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 dark:shadow-[0_0_10px_rgba(245,158,11,0.3)]';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:shadow-[0_0_10px_rgba(16,185,129,0.3)]';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    if (priorityObj) {
      switch (priorityObj.value) {
        case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:shadow-[0_0_10px_rgba(16,185,129,0.3)]';
        case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 dark:shadow-[0_0_10px_rgba(245,158,11,0.3)]';
        case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 dark:shadow-[0_0_10px_rgba(249,115,22,0.3)]';
        case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:shadow-[0_0_10px_rgba(239,68,68,0.3)]';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200';
      }
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200';
  };

  const getAssignedByEmployeeName = (employeeId) => {
    // Mock employee names - replace with actual API call
    const employeeNames = {
      '1': 'Talha',
      '2': 'Ifham',
      '3': 'Admin User'
    };
    return employeeNames[employeeId] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen font-sans bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        
        <div className="ml-80 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800/95 dark:backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 dark:shadow-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Management</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage and track your assigned tasks</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <UserDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm rounded-xl p-6 shadow-sm dark:shadow-lg dark:shadow-blue-500/5 border border-gray-200 dark:border-gray-700 dark:hover:border-gray-600 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 dark:shadow-[0_0_15px_rgba(59,130,246,0.3)] rounded-lg">
                <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm rounded-xl p-6 shadow-sm dark:shadow-lg dark:shadow-blue-500/5 border border-gray-200 dark:border-gray-700 dark:hover:border-gray-600 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 dark:shadow-[0_0_15px_rgba(245,158,11,0.3)] rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm rounded-xl p-6 shadow-sm dark:shadow-lg dark:shadow-blue-500/5 border border-gray-200 dark:border-gray-700 dark:hover:border-gray-600 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 dark:shadow-[0_0_15px_rgba(16,185,129,0.3)] rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm rounded-xl p-6 shadow-sm dark:shadow-lg dark:shadow-blue-500/5 border border-gray-200 dark:border-gray-700 dark:hover:border-gray-600 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 dark:shadow-[0_0_15px_rgba(239,68,68,0.3)] rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.filter(t => t.status === 'pending').length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm rounded-xl p-6 shadow-sm dark:shadow-lg dark:shadow-blue-500/5 border border-gray-200 dark:border-gray-700 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>

            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Departments</option>
              <option value="IT Services">IT Services</option>
              <option value="Customer Service">Customer Service</option>
              <option value="Operations">Operations</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
              <option value="General">General</option>
            </select>
          </div>
        </motion.div>

        {/* Tasks List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm rounded-xl shadow-sm dark:shadow-lg dark:shadow-blue-500/5 border border-gray-200 dark:border-gray-700"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Tasks</h3>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No tasks assigned to you</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 dark:border-gray-700 dark:hover:border-gray-600 rounded-lg p-4 hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-blue-500/10 transition-all bg-white dark:bg-gray-700/80 dark:backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {task.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                            {priorities.find(p => p.value === task.priority)?.label || task.priority}
                          </span>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-3">{task.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span>Assigned by: {getAssignedByEmployeeName(task.assigned_by)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Building className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span>{task.department}</span>
                          </div>
                          {task.due_date && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {task.estimated_hours && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              <span>Est. Hours: {task.estimated_hours}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Status Change Controls */}
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Tasks;
