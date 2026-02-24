import { supabase } from '../supabaseClient';

class TaskNotesApi {
  // Get all notes for a task
  async getTaskNotes(taskId) {
    try {
      // Get current user's users.id
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('User not authenticated');
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (!currentUser) {
        throw new Error('User not found in users table');
      }

      // Try RPC function first, fallback to direct query if it doesn't exist
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_task_notes', {
          p_task_id: taskId,
          p_user_id: currentUser.id
        });

      if (!rpcError && rpcData) {
        return rpcData;
      }

      // Fallback: Direct query with manual joins
      console.warn('RPC function not available, using direct query');
      const { data: notes, error: notesError } = await supabase
        .from('task_notes')
        .select(`
          *,
          created_by:users!task_notes_user_id_fkey(id, full_name, email)
        `)
        .eq('task_id', taskId)
        .or(`user_id.eq.${currentUser.id},is_private.eq.false`)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Get shares and tags for each note
      const notesWithDetails = await Promise.all(
        (notes || []).map(async (note) => {
          // Get shares
          const { data: shares } = await supabase
            .from('task_note_shares')
            .select(`
              shared_with_user:users!task_note_shares_shared_with_user_id_fkey(id, full_name, email)
            `)
            .eq('note_id', note.id);

          // Get tags
          const { data: tags } = await supabase
            .from('task_note_tags')
            .select(`
              tagged_user:users!task_note_tags_tagged_user_id_fkey(id, full_name, email)
            `)
            .eq('note_id', note.id);

          return {
            note_id: note.id,
            content: note.content,
            is_private: note.is_private,
            created_at: note.created_at,
            updated_at: note.updated_at,
            created_by_user_id: note.user_id,
            created_by_name: note.created_by?.full_name || '',
            created_by_email: note.created_by?.email || '',
            is_shared_with_me: shares?.some(s => s.shared_with_user?.id === currentUser.id) || false,
            shared_with_users: shares?.map(s => ({
              user_id: s.shared_with_user?.id,
              full_name: s.shared_with_user?.full_name,
              email: s.shared_with_user?.email
            })) || [],
            tagged_users: tags?.map(t => ({
              user_id: t.tagged_user?.id,
              full_name: t.tagged_user?.full_name,
              email: t.tagged_user?.email
            })) || []
          };
        })
      );

      return notesWithDetails;
    } catch (error) {
      console.error('Error fetching task notes:', error);
      throw error;
    }
  }

  // Create a new note
  async createNote(taskId, content, isPrivate = false) {
    try {
      // Get current user's users.id
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('User not authenticated');
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (!currentUser) {
        throw new Error('User not found in users table');
      }

      const { data, error } = await supabase
        .from('task_notes')
        .insert({
          task_id: taskId,
          user_id: currentUser.id,
          content: content.trim(),
          is_private: isPrivate
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  // Update a note
  async updateNote(noteId, content) {
    try {
      // Get current user's users.id
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('User not authenticated');
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (!currentUser) {
        throw new Error('User not found in users table');
      }

      const { data, error } = await supabase
        .from('task_notes')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .eq('user_id', currentUser.id) // Only allow updating own notes
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  // Delete a note
  async deleteNote(noteId) {
    try {
      // Get current user's users.id
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('User not authenticated');
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (!currentUser) {
        throw new Error('User not found in users table');
      }

      const { error } = await supabase
        .from('task_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', currentUser.id); // Only allow deleting own notes

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  // Share a note with specific users
  async shareNote(noteId, userIds) {
    try {
      // Get current user's users.id
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('User not authenticated');
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (!currentUser) {
        throw new Error('User not found in users table');
      }

      // Verify user owns the note
      const { data: note } = await supabase
        .from('task_notes')
        .select('user_id')
        .eq('id', noteId)
        .single();

      if (!note || note.user_id !== currentUser.id) {
        throw new Error('You can only share your own notes');
      }

      // Create share records
      const shares = userIds.map(userId => ({
        note_id: noteId,
        shared_with_user_id: userId,
        shared_by_user_id: currentUser.id
      }));

      const { data, error } = await supabase
        .from('task_note_shares')
        .upsert(shares, { onConflict: 'note_id,shared_with_user_id' })
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sharing note:', error);
      throw error;
    }
  }

  // Tag users in a note
  async tagUsersInNote(noteId, userIds) {
    try {
      // Get current user's users.id
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('User not authenticated');
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (!currentUser) {
        throw new Error('User not found in users table');
      }

      // Create tag records
      const tags = userIds.map(userId => ({
        note_id: noteId,
        tagged_user_id: userId,
        tagged_by_user_id: currentUser.id
      }));

      const { data, error } = await supabase
        .from('task_note_tags')
        .upsert(tags, { onConflict: 'note_id,tagged_user_id' })
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error tagging users in note:', error);
      throw error;
    }
  }

  // Remove a tag from a note
  async removeTag(noteId, userId) {
    try {
      // Get current user's users.id
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('User not authenticated');
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (!currentUser) {
        throw new Error('User not found in users table');
      }

      const { error } = await supabase
        .from('task_note_tags')
        .delete()
        .eq('note_id', noteId)
        .eq('tagged_user_id', userId)
        .eq('tagged_by_user_id', currentUser.id); // Only allow removing own tags

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing tag:', error);
      throw error;
    }
  }

  // Remove a share
  async unshareNote(noteId, userId) {
    try {
      // Get current user's users.id
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('User not authenticated');
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (!currentUser) {
        throw new Error('User not found in users table');
      }

      const { error } = await supabase
        .from('task_note_shares')
        .delete()
        .eq('note_id', noteId)
        .eq('shared_with_user_id', userId)
        .eq('shared_by_user_id', currentUser.id); // Only allow removing own shares

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unsharing note:', error);
      throw error;
    }
  }
}

const taskNotesApi = new TaskNotesApi();
export default taskNotesApi;

