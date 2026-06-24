import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Timer,
  Eye,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  GripVertical,
  ChevronDown
} from 'lucide-react';

const COLUMNS = [
  {
    id: 'pending',
    label: 'Pending',
    icon: Clock,
    header: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    accent: 'border-t-slate-400'
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    icon: Timer,
    header: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    accent: 'border-t-amber-400'
  },
  {
    id: 'review',
    label: 'Under Review',
    icon: Eye,
    header: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    accent: 'border-t-purple-400'
  },
  {
    id: 'completed',
    label: 'Completed',
    icon: CheckCircle,
    header: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    accent: 'border-t-emerald-400'
  }
];

const PRIORITY_DOT = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500 animate-pulse'
};

const KanbanCard = ({
  task,
  onView,
  onStatusChange,
  isOverdue,
  draggingId,
  isTouchDevice,
  columnId
}) => {
  const overdue = task.due_date && isOverdue(task.due_date);

  const handleStatusSelect = (e) => {
    e.stopPropagation();
    const next = e.target.value;
    if (next && next !== task.status) {
      onStatusChange(task.id, next);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: draggingId === task.id ? 0.4 : 1, scale: 1 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow border-t-2 ${
        overdue ? 'border-t-red-500' : 'border-t-transparent'
      } ${isTouchDevice ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
      draggable={!isTouchDevice}
      onDragStart={(e) => {
        if (isTouchDevice) return;
        e.dataTransfer.setData('text/task-id', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => onView(task)}
    >
      <div className="flex items-start gap-2 mb-2">
        {!isTouchDevice && (
          <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
        )}
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white leading-snug flex-1">
          {task.title}
        </h4>
        <span
          className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${PRIORITY_DOT[task.priority] || PRIORITY_DOT.medium}`}
          title={task.priority}
        />
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 ml-0 sm:ml-6">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2 ml-0 sm:ml-6">
        {task.assigned_to_name && (
          <span className="flex items-center gap-1 truncate max-w-[120px]">
            <User className="w-3 h-3" />
            {task.assigned_to_name}
          </span>
        )}
        {task.due_date && (
          <span
            className={`flex items-center gap-1 ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}
          >
            {overdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
            {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {isTouchDevice && (
        <div className="relative mt-2" onClick={(e) => e.stopPropagation()}>
          <label className="sr-only" htmlFor={`status-${task.id}`}>
            Move task
          </label>
          <div className="relative">
            <select
              id={`status-${task.id}`}
              value={task.status}
              onChange={handleStatusSelect}
              className="w-full appearance-none text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 pl-3 pr-8"
            >
              {COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>
                  Move to {col.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {columnId !== task.status && (
            <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">
              Tap dropdown to change status
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
};

const TaskKanbanBoard = ({ tasks, onView, onStatusChange, isOverdue }) => {
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const check = () => {
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const narrow = window.innerWidth < 768;
      setIsTouchDevice(coarse || narrow);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const tasksByColumn = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {});

  const handleDragOver = (e, columnId) => {
    if (isTouchDevice) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDrop = async (e, columnId) => {
    if (isTouchDevice) return;
    e.preventDefault();
    setDragOverColumn(null);
    setDraggingId(null);
    const taskId = e.dataTransfer.getData('text/task-id');
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== columnId) {
      await onStatusChange(taskId, columnId);
    }
  };

  return (
    <div>
      {isTouchDevice && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 px-1">
          Swipe columns horizontally. Use the dropdown on each card to move tasks.
        </p>
      )}
      <div className="overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory">
        <div className="flex gap-4 min-w-max lg:min-w-0 lg:grid lg:grid-cols-4">
          {COLUMNS.map((column) => {
            const Icon = column.icon;
            const columnTasks = tasksByColumn[column.id] || [];
            const isDropTarget = dragOverColumn === column.id;

            return (
              <div
                key={column.id}
                className={`flex flex-col rounded-2xl border min-h-[420px] w-[85vw] sm:w-72 lg:w-auto snap-center transition-all ${
                  isDropTarget
                    ? 'ring-2 ring-purple-400 ring-offset-2 dark:ring-offset-gray-900 scale-[1.01]'
                    : ''
                } ${column.header}`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div
                  className={`flex items-center justify-between p-4 border-b ${column.accent} border-t-4 rounded-t-2xl`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      {column.label}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/80 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)]">
                  {columnTasks.length === 0 ? (
                    <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 text-center px-2">
                      {isTouchDevice ? 'No tasks here' : 'Drop tasks here'}
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        onDragStart={() => setDraggingId(task.id)}
                        onDragEnd={() => setDraggingId(null)}
                      >
                        <KanbanCard
                          task={task}
                          onView={onView}
                          onStatusChange={onStatusChange}
                          isOverdue={isOverdue}
                          draggingId={draggingId}
                          isTouchDevice={isTouchDevice}
                          columnId={column.id}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TaskKanbanBoard;
