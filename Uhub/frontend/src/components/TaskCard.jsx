import React from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, Edit, Trash2, Users, User, Building, Calendar, 
  Clock, Timer, Tag, CheckCircle, AlertCircle, XCircle,
  ArrowRight, UserCircle
} from 'lucide-react';

// User Avatar Component
const UserAvatar = ({ name, email, size = 'md' }) => {
  const initials = name 
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email 
    ? email.substring(0, 2).toUpperCase()
    : 'U';
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-semibold shadow-md ring-2 ring-white dark:ring-gray-800`}>
      {initials}
    </div>
  );
};

// Enhanced Status Badge
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { 
      color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700', 
      icon: Clock,
      glow: 'shadow-blue-200 dark:shadow-[0_0_10px_rgba(59,130,246,0.3)]'
    },
    in_progress: { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700', 
      icon: Timer,
      glow: 'shadow-yellow-200 dark:shadow-[0_0_10px_rgba(245,158,11,0.3)]'
    },
    review: { 
      color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700', 
      icon: Eye,
      glow: 'shadow-purple-200 dark:shadow-[0_0_10px_rgba(139,92,246,0.3)]'
    },
    completed: { 
      color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700', 
      icon: CheckCircle,
      glow: 'shadow-green-200 dark:shadow-[0_0_10px_rgba(16,185,129,0.3)]'
    },
    cancelled: { 
      color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700', 
      icon: XCircle,
      glow: 'shadow-red-200 dark:shadow-[0_0_10px_rgba(239,68,68,0.3)]'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.color} ${config.glow} shadow-sm`}>
      <Icon className="w-3.5 h-3.5" />
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

// Enhanced Priority Badge
const PriorityBadge = ({ priority }) => {
  const priorityConfig = {
    low: { 
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
      icon: '↓',
      glow: 'shadow-emerald-200 dark:shadow-[0_0_10px_rgba(16,185,129,0.3)]'
    },
    medium: { 
      color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
      icon: '→',
      glow: 'shadow-amber-200 dark:shadow-[0_0_10px_rgba(245,158,11,0.3)]'
    },
    high: { 
      color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
      icon: '↑',
      glow: 'shadow-orange-200 dark:shadow-[0_0_10px_rgba(249,115,22,0.3)]'
    },
    urgent: { 
      color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
      icon: '⚠',
      glow: 'shadow-red-200 dark:shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse'
    }
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.color} ${config.glow} shadow-sm`}>
      <span className="text-sm">{config.icon}</span>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

// Enhanced Task Card Component
const TaskCard = ({ 
  task, 
  onView, 
  onEdit, 
  onDelete,
  getAssignedUserName,
  getAssignedByUserName,
  isOverdue
}) => {
  const isOverdueTask = task.due_date && isOverdue(task.due_date);
  const assignedToName = getAssignedUserName(task.assigned_to);
  const assignedByName = getAssignedByUserName(task.assigned_by);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative bg-white dark:bg-gray-800 dark:border-gray-700 rounded-2xl shadow-lg dark:shadow-xl dark:hover:shadow-2xl hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group dark:hover:border-blue-500/50"
    >
      {/* Gradient Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      
      {/* Overdue Warning */}
      {isOverdueTask && (
        <div className="absolute top-2 right-2 z-10">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="bg-red-500 dark:bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg dark:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          >
            <AlertCircle className="w-3 h-3" />
            Overdue
          </motion.div>
        </div>
      )}

      <div className="p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">
            <div className="flex items-start gap-3 mb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer flex-1">
                {task.title}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {task.assignment_type === 'coordinated' && (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Team
                  </span>
                )}
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4">
              {task.description}
            </p>
          </div>
        </div>

        {/* User Assignment Section with Avatars */}
        <div className="space-y-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <UserAvatar 
              name={assignedToName} 
              email={task.assigned_to_email || ''} 
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Assigned to</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {task.assignment_type === 'coordinated' && task.assignees && task.assignees.length > 0 ? (
                  <span className="flex items-center gap-2">
                    <span>{task.assignees.length} team members</span>
                    <span className="text-purple-600 dark:text-purple-400 text-xs">({task.assignees.map(a => a.user_name).join(', ')})</span>
                  </span>
                ) : (
                  assignedToName
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UserAvatar 
              name={assignedByName} 
              email={task.assigned_by_email || ''} 
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Created by</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{assignedByName}</p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 dark:shadow-[0_0_10px_rgba(139,92,246,0.3)] rounded-lg">
              <Building className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Department</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.department}</p>
            </div>
          </div>

          {task.due_date && (
            <div className="flex items-center gap-2 text-sm">
              <div className={`p-1.5 rounded-lg ${isOverdueTask ? 'bg-red-100 dark:bg-red-900/30 dark:shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-orange-100 dark:bg-orange-900/30 dark:shadow-[0_0_10px_rgba(249,115,22,0.3)]'}`}>
                <Calendar className={`w-3.5 h-3.5 ${isOverdueTask ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Due Date</p>
                <p className={`text-sm font-medium ${isOverdueTask ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                  {new Date(task.due_date).toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <span>{new Date(task.created_at).toLocaleDateString('en-GB')}</span>
            </div>
            {task.estimated_hours && (
              <div className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                <span className="font-medium">{task.estimated_hours}h</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {task.tags.slice(0, 2).map((tag, index) => (
                <span 
                  key={index} 
                  className="px-2.5 py-1 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-600"
                >
                  <Tag className="w-3 h-3 inline mr-1" />
                  {tag}
                </span>
              ))}
              {task.tags.length > 2 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">+{task.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onView(task)}
            className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors shadow-sm dark:shadow-lg dark:shadow-blue-500/20"
            title="View task"
          >
            <Eye className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(task)}
            className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors shadow-sm dark:shadow-lg dark:shadow-green-500/20"
            title="Edit task"
          >
            <Edit className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(task.id)}
            className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors shadow-sm dark:shadow-lg dark:shadow-red-500/20"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Hover Effect Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default TaskCard;

