// Enhanced Task Management UI Improvements
// This file contains the improved UI components for the Task Management page

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, FileText, Clock, User, 
  AlertCircle, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building, 
  CheckSquare, ClipboardList, Users, AlertTriangle,
  MessageCircle, Bell, Star, TrendingUp, BarChart3,
  RefreshCw, Send, ThumbsUp, ThumbsDown, Flag,
  Target, Timer, Award, Activity, Zap, Grid, List,
  SortAsc, SortDesc, Download, Upload, Settings,
  FilterX, ChevronDown, ChevronUp, Sparkles,
  Lightbulb, Rocket, Shield, Heart, Crown
} from 'lucide-react';

// Enhanced Header Component
const EnhancedHeader = ({ allUsers, onRefresh, refreshing, onCreateTask }) => (
  <motion.div 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-r from-white via-blue-50 to-indigo-50 rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100 relative overflow-hidden"
  >
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm-20 18c-9.925 0-18-8.075-18-18s8.075-18 18-18 18 8.075 18 18-8.075 18-18 18z'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat'
      }}></div>
    </div>
    
    <div className="flex items-center justify-between relative z-10">
      <div className="flex items-center space-x-6">
        <div className="relative group">
          <motion.div 
            className="p-5 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <CheckSquare className="w-12 h-12 text-white" />
          </motion.div>
          <motion.div 
            className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Star className="w-4 h-4 text-white" />
          </motion.div>
          <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
        
        <div>
          <motion.h1 
            className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Task Management
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            Create, assign, and track tasks efficiently across your team
          </motion.p>
          
          <div className="flex items-center space-x-6">
            <motion.div 
              className="flex items-center space-x-3 px-4 py-2 bg-green-100 rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">System Online</span>
            </motion.div>
            
            <motion.div 
              className="flex items-center space-x-3 px-4 py-2 bg-blue-100 rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{allUsers.length} Team Members</span>
            </motion.div>
            
            <motion.div 
              className="flex items-center space-x-3 px-4 py-2 bg-purple-100 rounded-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Rocket className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">High Performance</span>
            </motion.div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={onRefresh}
            disabled={refreshing}
            variant="outline"
            className="flex items-center space-x-2 px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 shadow-lg"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="font-medium">Refresh</span>
          </Button>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={onCreateTask}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Create Task</span>
          </Button>
        </motion.div>
      </div>
    </div>
  </motion.div>
);

// Enhanced Stats Cards Component
const EnhancedStatsCards = ({ stats, activeTab, onTabChange }) => {
  const tabs = [
    { id: 'all', label: 'All Tasks', icon: Grid, count: stats.total, color: 'from-blue-500 to-indigo-600' },
    { id: 'my-tasks', label: 'My Tasks', icon: User, count: stats.myTasks, color: 'from-green-500 to-emerald-600' },
    { id: 'assigned-by-me', label: 'Assigned by Me', icon: Send, count: stats.assignedByMe, color: 'from-purple-500 to-pink-600' },
    { id: 'pending', label: 'Pending', icon: Clock, count: stats.pending, color: 'from-yellow-500 to-orange-600' },
    { id: 'in-progress', label: 'In Progress', icon: Timer, count: stats.inProgress, color: 'from-blue-500 to-cyan-600' },
    { id: 'completed', label: 'Completed', icon: CheckCircle, count: stats.completed, color: 'from-green-500 to-teal-600' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Task Overview</h3>
            <p className="text-gray-600">Real-time statistics and insights</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative p-4 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r ' + tab.color + ' text-white shadow-xl scale-105' 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow-lg'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center space-y-2">
                <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
                  {tab.label}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isActive 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              </div>
              
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-white border-opacity-30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

// Enhanced Filters Component
const EnhancedFilters = ({ filters, onFilterChange, onClearFilters, allUsers, departments }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100"
  >
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
          <Filter className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Advanced Filters</h3>
          <p className="text-gray-600">Find exactly what you're looking for</p>
        </div>
      </div>
      
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={onClearFilters}
          variant="outline"
          className="flex items-center space-x-2 px-4 py-2 rounded-xl border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 transition-all duration-300"
        >
          <FilterX className="w-4 h-4" />
          <span>Clear All</span>
        </Button>
      </motion.div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
          />
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Status</label>
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 appearance-none cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Under Review</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Priority</label>
        <select
          value={filters.priority}
          onChange={(e) => onFilterChange('priority', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 appearance-none cursor-pointer"
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Department */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Department</label>
        <select
          value={filters.department}
          onChange={(e) => onFilterChange('department', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 appearance-none cursor-pointer"
        >
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Assigned To */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Assigned To</label>
        <select
          value={filters.assigned_to}
          onChange={(e) => onFilterChange('assigned_to', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 appearance-none cursor-pointer"
        >
          <option value="">All Users</option>
          {allUsers.map(user => (
            <option key={user.id} value={user.id}>{user.full_name}</option>
          ))}
        </select>
      </div>
    </div>
  </motion.div>
);

// Enhanced Task Card Component
const EnhancedTaskCard = ({ task, onEdit, onDelete, onView, getStatusColor, getPriorityColor, priorities, getAssignedUserName, getAssignedByUserName }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden group"
  >
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {task.title}
            </h3>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${getPriorityColor(task.priority)}`}>
              {priorities.find(p => p.value === task.priority)?.label || task.priority}
            </span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{task.description}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onView(task)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
          >
            <Eye className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(task)}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
          >
            <Edit className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(task.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="w-4 h-4 text-blue-500" />
          <span className="font-medium">Assigned to:</span>
          <span className="text-gray-900">{getAssignedUserName(task.assigned_to)}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="w-4 h-4 text-green-500" />
          <span className="font-medium">Assigned by:</span>
          <span className="text-gray-900">{getAssignedByUserName(task.assigned_by)}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Building className="w-4 h-4 text-purple-500" />
          <span className="font-medium">Department:</span>
          <span className="text-gray-900">{task.department}</span>
        </div>
        {task.due_date && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span className="font-medium">Due:</span>
            <span className="text-gray-900">{new Date(task.due_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
          </div>
          {task.estimated_hours && (
            <div className="flex items-center space-x-1">
              <Timer className="w-3 h-3" />
              <span>Est. {task.estimated_hours}h</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              {task.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {tag}
                </span>
              ))}
              {task.tags.length > 2 && (
                <span className="text-xs text-gray-500">+{task.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

export {
  EnhancedHeader,
  EnhancedStatsCards,
  EnhancedFilters,
  EnhancedTaskCard
};
