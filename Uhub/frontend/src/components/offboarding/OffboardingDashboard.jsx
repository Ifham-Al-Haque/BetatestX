import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, CheckCircle, Clock, AlertTriangle, TrendingUp, 
  ArrowRight, Plus, Calendar, Target, Award, Key, CreditCard,
  Building, Shield, Monitor
} from 'lucide-react';

export default function OffboardingDashboard({ 
  stats, 
  recentRecords, 
  onViewRecord, 
  onStartOffboarding 
}) {
  const statCards = [
    {
      title: 'Total Offboarding',
      value: stats.total,
      icon: Users,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    }
  ];

  const getStatusColor = (status, statusIndicator) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        if (statusIndicator === 'Overdue') return 'bg-red-100 text-red-800 border-red-200';
        if (statusIndicator === 'Due Soon') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on_hold':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status, statusIndicator) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        if (statusIndicator === 'Overdue') return <AlertTriangle className="w-4 h-4" />;
        return <Clock className="w-4 h-4" />;
      case 'on_hold':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.bgColor} rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className={`text-3xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            onClick={onStartOffboarding}
            className="flex items-center space-x-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5 text-red-600" />
            <div className="text-left">
              <p className="font-medium text-red-900">Start New Offboarding</p>
              <p className="text-sm text-red-600">Begin offboarding process</p>
            </div>
          </motion.button>

          <motion.button
            className="flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Key className="w-5 h-5 text-orange-600" />
            <div className="text-left">
              <p className="font-medium text-orange-900">Asset Management</p>
              <p className="text-sm text-orange-600">Track asset returns</p>
            </div>
          </motion.button>

          <motion.button
            className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Shield className="w-5 h-5 text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-purple-900">Access Revocation</p>
              <p className="text-sm text-purple-600">Manage access removal</p>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* Recent Records */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Offboarding Records
            </h3>
            <button className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {recentRecords.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No offboarding records found</p>
              <button
                onClick={onStartOffboarding}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Start First Offboarding
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRecords.map((record, index) => (
                <motion.div
                  key={record.record_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                  onClick={() => onViewRecord(record)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-semibold">
                        {record.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {record.full_name || 'Unknown Employee'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {record.department} • {record.position}
                      </p>
                      <p className="text-xs text-gray-500">
                        Reason: {record.reason_for_leaving || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status, record.status_indicator)}`}>
                        {getStatusIcon(record.status, record.status_indicator)}
                        <span>{record.status.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {record.progress_percentage}% Complete
                      </p>
                      <p className="text-xs text-gray-400">
                        Last Day: {new Date(record.last_working_date).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Offboarding Progress Overview
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Completion Rate</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium">{stats.completed}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-medium">{stats.inProgress}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-3">Timeline Status</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">On Track</span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {stats.inProgress - stats.overdue - stats.dueSoon}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Due Soon</span>
                </div>
                <span className="text-sm font-medium text-yellow-600">
                  {stats.dueSoon}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800">Overdue</span>
                </div>
                <span className="text-sm font-medium text-red-600">
                  {stats.overdue}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Asset Return Status */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Asset Returns</h4>
            <Building className="w-6 h-6 text-blue-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pending Returns</span>
              <span className="font-medium text-orange-600">12</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completed Returns</span>
              <span className="font-medium text-green-600">8</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Overdue Returns</span>
              <span className="font-medium text-red-600">3</span>
            </div>
          </div>
        </div>

        {/* Access Revocation Status */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Access Revocation</h4>
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pending Revocation</span>
              <span className="font-medium text-orange-600">15</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completed Revocation</span>
              <span className="font-medium text-green-600">22</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Failed Revocation</span>
              <span className="font-medium text-red-600">1</span>
            </div>
          </div>
        </div>

        {/* Exit Interview Status */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Exit Interviews</h4>
            <Target className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Scheduled</span>
              <span className="font-medium text-blue-600">5</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completed</span>
              <span className="font-medium text-green-600">18</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pending</span>
              <span className="font-medium text-yellow-600">7</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
