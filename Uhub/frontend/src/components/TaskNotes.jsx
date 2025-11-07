import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  StickyNote, Plus, Edit, Trash2, Share2, UserPlus, 
  Lock, Unlock, X, Check, AtSign
} from 'lucide-react';
import taskNotesApi from '../services/taskNotesApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';


const TaskNotes = ({ taskId, allUsers = [] }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]); // For sharing/tagging
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(''); // For @ mention autocomplete
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionPosition, setMentionPosition] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const textareaRef = useRef(null);

  // Get current user's users.id
  useEffect(() => {
    const getCurrentUserId = async () => {
      if (user?.id) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
        if (currentUser) {
          setCurrentUserId(currentUser.id);
        }
      }
    };
    getCurrentUserId();
  }, [user]);

  // Load notes
  useEffect(() => {
    if (taskId) {
      loadNotes();
    }
  }, [taskId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await taskNotesApi.getTaskNotes(taskId);
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      showError('Error', 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  // Handle @ mentions in note content
  const handleNoteInput = (e) => {
    const value = e.target.value;
    setNoteContent(value);
    
    // Check for @ mentions
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // If there's a space or newline after @, don't show picker
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionQuery(textAfterAt.toLowerCase());
        setMentionPosition(lastAtIndex);
        setShowMentionPicker(true);
      } else {
        setShowMentionPicker(false);
      }
    } else {
      setShowMentionPicker(false);
    }
  };

  // Insert @ mention into note
  const insertMention = (user) => {
    const beforeMention = noteContent.substring(0, mentionPosition);
    const afterMention = noteContent.substring(mentionPosition + 1 + mentionQuery.length);
    const newContent = `${beforeMention}@${user.full_name || user.email} ${afterMention}`;
    setNoteContent(newContent);
    setShowMentionPicker(false);
    setMentionQuery('');
    
    // Also add to selected users for tagging
    if (!selectedUsers.includes(user.id)) {
      setSelectedUsers(prev => [...prev, user.id]);
    }
  };

  // Filter users for mention picker
  const getMentionableUsers = () => {
    if (!mentionQuery) return allUsers.filter(u => u.id !== currentUserId).slice(0, 5);
    return allUsers
      .filter(u => 
        u.id !== currentUserId &&
        (u.full_name?.toLowerCase().includes(mentionQuery) ||
         u.email?.toLowerCase().includes(mentionQuery))
      )
      .slice(0, 5);
  };

  // Extract @ mentions from text
  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  // Create a new note
  const handleCreateNote = async () => {
    if (!noteContent.trim()) {
      showError('Error', 'Note content cannot be empty');
      return;
    }

    try {
      const newNote = await taskNotesApi.createNote(taskId, noteContent, isPrivate);
      
      // If users are selected, share the note with them
      if (selectedUsers.length > 0) {
        await taskNotesApi.shareNote(newNote.id, selectedUsers);
      }

      // Extract @ mentions and tag users
      const mentions = extractMentions(noteContent);
      if (mentions.length > 0) {
        // Find users by email or name
        const mentionedUserIds = allUsers
          .filter(u => {
            const emailMatch = u.email?.toLowerCase().includes(mentions[0]?.toLowerCase());
            const nameMatch = u.full_name?.toLowerCase().includes(mentions[0]?.toLowerCase());
            return emailMatch || nameMatch;
          })
          .map(u => u.id);
        
        if (mentionedUserIds.length > 0) {
          await taskNotesApi.tagUsersInNote(newNote.id, mentionedUserIds);
        }
      }

      success('Success', 'Note created successfully');
      setNoteContent('');
      setIsPrivate(false);
      setSelectedUsers([]);
      setShowAddNote(false);
      loadNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      showError('Error', 'Failed to create note');
    }
  };

  // Update a note
  const handleUpdateNote = async (noteId) => {
    if (!noteContent.trim()) {
      showError('Error', 'Note content cannot be empty');
      return;
    }

    try {
      await taskNotesApi.updateNote(noteId, noteContent);
      success('Success', 'Note updated successfully');
      setEditingNoteId(null);
      setNoteContent('');
      loadNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      showError('Error', 'Failed to update note');
    }
  };

  // Delete a note
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await taskNotesApi.deleteNote(noteId);
      success('Success', 'Note deleted successfully');
      loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      showError('Error', 'Failed to delete note');
    }
  };

  // Share note with users
  const handleShareNote = async (noteId, userIds) => {
    try {
      await taskNotesApi.shareNote(noteId, userIds);
      success('Success', 'Note shared successfully');
      loadNotes();
    } catch (error) {
      console.error('Error sharing note:', error);
      showError('Error', 'Failed to share note');
    }
  };

  // Start editing
  const startEditing = (note) => {
    setEditingNoteId(note.note_id);
    setNoteContent(note.content);
    setIsPrivate(note.is_private);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingNoteId(null);
    setNoteContent('');
    setIsPrivate(false);
    setSelectedUsers([]);
    setShowAddNote(false);
  };

  // Get user avatar initials
  const getUserInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Check if note is created by current user
  const isMyNote = (note) => {
    return note.created_by_user_id === currentUserId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Task Notes</h3>
          <span className="text-sm text-gray-500">({notes.length})</span>
        </div>
        <button
          onClick={() => setShowAddNote(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      {/* Add Note Form */}
      <AnimatePresence>
        {showAddNote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <StickyNote className="w-4 h-4" />
                  New Note
                </label>
                <button
                  onClick={cancelEditing}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={noteContent}
                  onChange={handleNoteInput}
                  onKeyDown={(e) => {
                    if (showMentionPicker && e.key === 'ArrowDown') {
                      e.preventDefault();
                      // Could implement keyboard navigation here
                    }
                  }}
                  placeholder="Write your note here... Use @ to mention users"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                />
                
                {/* @ Mention Picker */}
                {showMentionPicker && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {getMentionableUsers().length > 0 ? (
                      getMentionableUsers().map(user => (
                        <button
                          key={user.id}
                          onClick={() => insertMention(user)}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                            {getUserInitials(user.full_name, user.email)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user.full_name || user.email}
                            </p>
                            {user.full_name && (
                              <p className="text-xs text-gray-500">{user.email}</p>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No users found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isPrivate
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : 'bg-green-100 text-green-700 border border-green-300'
                  }`}
                >
                  {isPrivate ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Private (Only you can see)
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      Public (Visible to task participants)
                    </>
                  )}
                </button>
              </div>

              {/* Share with Users */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share with specific users (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(userId => {
                    const user = allUsers.find(u => u.id === userId);
                    return user ? (
                      <span
                        key={userId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        {user.full_name || user.email}
                        <button
                          onClick={() => setSelectedUsers(prev => prev.filter(id => id !== userId))}
                          className="hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                  <button
                    onClick={() => setShowUserPicker(!showUserPicker)}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200"
                  >
                    <UserPlus className="w-3 h-3" />
                    Add User
                  </button>
                </div>

                {/* User Picker */}
                {showUserPicker && (
                  <div className="bg-white border border-gray-300 rounded-lg p-2 max-h-40 overflow-y-auto">
                    {allUsers
                      .filter(u => !selectedUsers.includes(u.id) && u.id !== currentUserId)
                      .map(user => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUsers(prev => [...prev, user.id]);
                            setShowUserPicker(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                        >
                          {user.full_name || user.email}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateNote}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Save Note
                </button>
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <StickyNote className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No notes yet. Add your first note to remember important details!</p>
          </div>
        ) : (
          notes.map((note) => (
            <motion.div
              key={note.note_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white border rounded-lg p-4 ${
                note.is_private ? 'border-purple-200 bg-purple-50' : 'border-gray-200'
              }`}
            >
              {editingNoteId === note.note_id ? (
                // Edit Mode
                <div className="space-y-3">
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateNote(note.note_id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                        {getUserInitials(note.created_by_name, note.created_by_email)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {note.created_by_name || note.created_by_email}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {note.is_private && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Private
                        </span>
                      )}
                      {isMyNote(note) && (
                        <>
                          <button
                            onClick={() => startEditing(note)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit note"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.note_id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-gray-700 whitespace-pre-wrap mb-3">
                    {note.content}
                  </div>

                  {/* Shared With & Tagged Users */}
                  {(note.shared_with_users?.length > 0 || note.tagged_users?.length > 0) && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                      {note.shared_with_users?.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Share2 className="w-3 h-3" />
                          <span className="font-medium">Shared with:</span>
                          {note.shared_with_users.map((u, idx) => (
                            <span key={u.user_id} className="text-blue-600">
                              {u.full_name || u.email}
                              {idx < note.shared_with_users.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}
                      {note.tagged_users?.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <AtSign className="w-3 h-3" />
                          <span className="font-medium">Tagged:</span>
                          {note.tagged_users.map((u, idx) => (
                            <span key={u.user_id} className="text-purple-600">
                              {u.full_name || u.email}
                              {idx < note.tagged_users.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskNotes;

