import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  User, Building, Calendar, Eye, 
  StickyNote, Share2, Plus, X, Lock, Unlock, AtSign
} from 'lucide-react';
import taskNotesApi from '../services/taskNotesApi';
import { useToast } from '../context/ToastContext';

const MyTaskCard = ({ 
  task, 
  onView, 
  onEdit, 
  onDelete, 
  getAssignedUserName,
  getAssignedByUserName,
  isOverdue,
  allUsers = [],
  currentUserId
}) => {
  const { success, error: showError } = useToast();
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserPicker, setShowUserPicker] = useState(false);

  const getPriorityConfig = (priority) => {
    const configs = {
      low: { color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 dark:shadow-[0_0_10px_rgba(16,185,129,0.3)]', icon: '🟢' },
      medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700 dark:shadow-[0_0_10px_rgba(245,158,11,0.3)]', icon: '🟡' },
      high: { color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700 dark:shadow-[0_0_10px_rgba(249,115,22,0.3)]', icon: '🟠' },
      urgent: { color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 dark:shadow-[0_0_10px_rgba(239,68,68,0.3)]', icon: '🔴' }
    };
    return configs[priority] || configs.medium;
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700/50 dark:text-gray-200 dark:border-gray-600', label: 'Pending' },
      in_progress: { color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 dark:shadow-[0_0_10px_rgba(59,130,246,0.3)]', label: 'In Progress' },
      review: { color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700 dark:shadow-[0_0_10px_rgba(139,92,246,0.3)]', label: 'Review' },
      completed: { color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 dark:shadow-[0_0_10px_rgba(16,185,129,0.3)]', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 dark:shadow-[0_0_10px_rgba(239,68,68,0.3)]', label: 'Cancelled' }
    };
    return configs[status] || configs.pending;
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(task.status);

  // Load notes when panel opens
  const handleShowNotes = async () => {
    if (!showNotes) {
      setLoadingNotes(true);
      try {
        const taskNotes = await taskNotesApi.getTaskNotes(task.id);
        setNotes(taskNotes || []);
      } catch (error) {
        console.error('Error loading notes:', error);
        showError('Error', 'Failed to load notes');
      } finally {
        setLoadingNotes(false);
      }
    }
    setShowNotes(!showNotes);
  };

  // Create a new note
  const handleCreateNote = async () => {
    if (!noteContent.trim()) {
      showError('Error', 'Note content cannot be empty');
      return;
    }

    try {
      const newNote = await taskNotesApi.createNote(task.id, noteContent, isPrivate);
      
      if (selectedUsers.length > 0) {
        await taskNotesApi.shareNote(newNote.id, selectedUsers);
      }

      success('Success', 'Note created successfully');
      setNoteContent('');
      setIsPrivate(false);
      setSelectedUsers([]);
      
      // Reload notes
      const taskNotes = await taskNotesApi.getTaskNotes(task.id);
      setNotes(taskNotes || []);
    } catch (error) {
      console.error('Error creating note:', error);
      showError('Error', 'Failed to create note');
    }
  };

  const getUserInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-2xl shadow-lg dark:shadow-xl dark:hover:shadow-2xl hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group dark:hover:border-blue-500/50"
    >
      {/* Main Card Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:group-hover:text-blue-400 group-hover:text-blue-600 transition-colors cursor-pointer"
                  onClick={() => onView(task)}>
                {task.title}
              </h3>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${priorityConfig.color}`}>
                {priorityConfig.icon} {task.priority}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400 text-sm leading-relaxed mb-3">{task.description}</p>
          </div>
        </div>

        {/* Task Details */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <User className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="truncate">By: {getAssignedByUserName(task.assigned_by)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Building className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span className="truncate">{task.department}</span>
          </div>
          {task.due_date && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className={`w-4 h-4 ${isOverdue(task.due_date) ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`} />
              <span className={isOverdue(task.due_date) ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                Due: {new Date(task.due_date).toLocaleDateString()}
              </span>
            </div>
          )}
          {task.estimated_hours && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              <span>Est: {task.estimated_hours}h</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShowNotes}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all text-sm font-medium"
          >
            <StickyNote className="w-4 h-4" />
            Notes ({notes.length})
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onView(task)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:shadow-lg dark:hover:shadow-blue-500/20 transition-all text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Notes Panel */}
      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
          >
            <div className="p-6 space-y-4">
              {/* Notes Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Task Notes</h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">({notes.length})</span>
                </div>
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add Note Form */}
              <div className="bg-white dark:bg-gray-700/80 dark:backdrop-blur-sm rounded-lg p-4 border border-blue-200 dark:border-blue-800/50 dark:shadow-lg dark:shadow-blue-500/10 shadow-sm">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add a note... Use @ to mention users"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm dark:bg-gray-600 dark:text-white dark:placeholder-gray-400"
                  rows={3}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      isPrivate
                        ? 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
                        : 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700'
                    }`}
                  >
                    {isPrivate ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {isPrivate ? 'Private' : 'Public'}
                  </button>
                  {selectedUsers.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {selectedUsers.map(userId => {
                        const user = allUsers.find(u => u.id === userId);
                        return user ? (
                          <span key={userId} className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs">
                            {user.full_name || user.email}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                  <button
                    onClick={() => setShowUserPicker(!showUserPicker)}
                    className="ml-auto px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 rounded text-xs hover:bg-purple-200 dark:hover:bg-purple-800 flex items-center gap-1"
                  >
                    <Share2 className="w-3 h-3" />
                    Share
                  </button>
                </div>
                {showUserPicker && (
                  <div className="mt-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg p-2 max-h-32 overflow-y-auto">
                    {allUsers
                      .filter(u => u.id !== currentUserId && !selectedUsers.includes(u.id))
                      .map(user => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUsers(prev => [...prev, user.id]);
                            setShowUserPicker(false);
                          }}
                          className="w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm dark:text-gray-200"
                        >
                          {user.full_name || user.email}
                        </button>
                      ))}
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateNote}
                  className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Note
                </motion.button>
              </div>

              {/* Notes List */}
              {loadingNotes ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading notes...</div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <StickyNote className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">No notes yet. Add your first note!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notes.map((note) => (
                    <div
                      key={note.note_id}
                      className={`bg-white dark:bg-gray-700/80 dark:backdrop-blur-sm rounded-lg p-4 border transition-all ${
                        note.is_private 
                          ? 'border-purple-200 bg-purple-50 dark:border-purple-800/50 dark:bg-purple-900/20 dark:shadow-[0_0_15px_rgba(139,92,246,0.2)]' 
                          : 'border-gray-200 dark:border-gray-600/50 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                            {getUserInitials(note.created_by_name, note.created_by_email)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {note.created_by_name || note.created_by_email}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(note.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {note.is_private && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 rounded-full text-xs flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Private
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap mb-2">{note.content}</p>
                      {(note.shared_with_users?.length > 0 || note.tagged_users?.length > 0) && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs">
                          {note.shared_with_users?.length > 0 && (
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Share2 className="w-3 h-3" />
                              <span>Shared: {note.shared_with_users.map(u => u.full_name || u.email).join(', ')}</span>
                            </div>
                          )}
                          {note.tagged_users?.length > 0 && (
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <AtSign className="w-3 h-3" />
                              <span>Tagged: {note.tagged_users.map(u => u.full_name || u.email).join(', ')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyTaskCard;

