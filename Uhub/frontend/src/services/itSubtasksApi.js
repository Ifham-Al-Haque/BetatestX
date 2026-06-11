import { supabase } from '../supabaseClient';

// Checklist items (subtasks) inside an IT request ticket.
// Read: any authenticated UHub user. Write: admin/IT staff (enforced by RLS).
const itSubtasksApi = {
  getByRequest: async (requestId) => {
    const { data, error } = await supabase
      .from('it_request_subtasks')
      .select('*')
      .eq('request_id', requestId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  add: async (requestId, title) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('it_request_subtasks')
      .insert({
        request_id: requestId,
        title: title.trim(),
        created_by: user?.id || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  toggle: async (id, isDone) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('it_request_subtasks')
      .update({
        is_done: isDone,
        done_at: isDone ? new Date().toISOString() : null,
        done_by: isDone ? (user?.id || null) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  remove: async (id) => {
    const { error } = await supabase
      .from('it_request_subtasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },
};

export default itSubtasksApi;
