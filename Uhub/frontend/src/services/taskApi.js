import { supabase } from '../supabaseClient';

class TaskApi {
  // Get all tasks with filters and pagination
  async getAll(filters = {}, page = 1, limit = 50) {
    try {
      // Get current user to check role and department
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.warn('User not authenticated, returning empty data');
        return {
          data: [],
          count: 0,
          page,
          limit,
          totalPages: 0
        };
      }

      // Get user profile to check role and department
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role, department')
        .eq('auth_user_id', authUser.id)
        .single();

      if (profileError) {
        console.warn('Error fetching user profile:', profileError);
        // Continue without department filtering if profile fetch fails
      }

      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_user:assigned_to(
            id,
            email,
            raw_user_meta_data
          ),
          assigned_by_user:assigned_by(
            id,
            email,
            raw_user_meta_data
          )
        `)
        .order('created_at', { ascending: false });

      // Apply department filtering based on user role
      if (userProfile && userProfile.role !== 'admin' && userProfile.role !== 'manager' && userProfile.department) {
        query = query.eq('department', userProfile.department);
      }

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error fetching tasks:', error);
        // Return empty data instead of throwing error
        return {
          data: [],
          count: 0,
          page,
          limit,
          totalPages: 0
        };
      }

      // Transform data to include user names
      const transformedData = data?.map(task => ({
        ...task,
        assigned_to_name: task.assigned_to_user?.raw_user_meta_data?.full_name || 'Unknown User',
        assigned_by_name: task.assigned_by_user?.raw_user_meta_data?.full_name || 'Unknown User',
        assigned_to_email: task.assigned_to_user?.email || '',
        assigned_by_email: task.assigned_by_user?.email || ''
      })) || [];

      return {
        data: transformedData,
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Return empty data instead of throwing error
      return {
        data: [],
        count: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  }

  // Get task by ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_user:assigned_to(
            id,
            email,
            raw_user_meta_data
          ),
          assigned_by_user:assigned_by(
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        assigned_to_name: data.assigned_to_user?.raw_user_meta_data?.full_name || 'Unknown User',
        assigned_by_name: data.assigned_by_user?.raw_user_meta_data?.full_name || 'Unknown User',
        assigned_to_email: data.assigned_to_user?.email || '',
        assigned_by_email: data.assigned_by_user?.email || ''
      };
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  }

  // Create new task
  async create(taskData) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;

      // Send notification to assigned user
      await this.sendNotification(data.assigned_to, data.id, 'assignment', 'New Task Assigned', `You have been assigned a new task: ${data.title}`);

      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // Update task
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Send notification if status changed
      if (updates.status) {
        await this.sendNotification(data.assigned_to, id, 'status_change', 'Task Status Updated', `Task "${data.title}" status changed to ${updates.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // Delete task
  async delete(id) {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // Get task statistics
  async getStats(userId = null) {
    try {
      const { data, error } = await supabase
        .rpc('get_task_stats', { p_user_id: userId });

      if (error) {
        console.warn('Error fetching task stats:', error);
        return {
          total_tasks: 0,
          my_tasks: 0,
          assigned_by_me: 0,
          pending_tasks: 0,
          in_progress_tasks: 0,
          completed_tasks: 0,
          overdue_tasks: 0
        };
      }

      return data[0] || {
        total_tasks: 0,
        my_tasks: 0,
        assigned_by_me: 0,
        pending_tasks: 0,
        in_progress_tasks: 0,
        completed_tasks: 0,
        overdue_tasks: 0
      };
    } catch (error) {
      console.error('Error fetching task stats:', error);
      return {
        total_tasks: 0,
        my_tasks: 0,
        assigned_by_me: 0,
        pending_tasks: 0,
        in_progress_tasks: 0,
        completed_tasks: 0,
        overdue_tasks: 0
      };
    }
  }

  // Get task comments
  async getComments(taskId) {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          user:user_id(
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data?.map(comment => ({
        ...comment,
        user_name: comment.user?.raw_user_meta_data?.full_name || 'Unknown User',
        user_email: comment.user?.email || ''
      })) || [];
    } catch (error) {
      console.error('Error fetching task comments:', error);
      throw error;
    }
  }

  // Add comment to task
  async addComment(taskId, content) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: taskId,
          user_id: user.user.id,
          content: content
        }])
        .select(`
          *,
          user:user_id(
            id,
            email,
            raw_user_meta_data
          )
        `)
        .single();

      if (error) throw error;

      // Send notification to task assignee and creator
      const task = await this.getById(taskId);
      await this.sendNotification(task.assigned_to, taskId, 'comment', 'New Comment Added', `A new comment was added to task "${task.title}"`);
      if (task.assigned_by !== task.assigned_to) {
        await this.sendNotification(task.assigned_by, taskId, 'comment', 'New Comment Added', `A new comment was added to task "${task.title}"`);
      }

      return {
        ...data,
        user_name: data.user?.raw_user_meta_data?.full_name || 'Unknown User',
        user_email: data.user?.email || ''
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Send notification
  async sendNotification(userId, taskId, type, title, message) {
    try {
      const { error } = await supabase
        .rpc('send_task_notification', {
          p_user_id: userId,
          p_task_id: taskId,
          p_type: type,
          p_title: title,
          p_message: message
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw error for notification failures
    }
  }

  // Get user's notifications
  async getNotifications(userId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('task_notifications')
        .select(`
          *,
          task:tasks(
            id,
            title,
            status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('task_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Get tasks by user (assigned to or created by)
  async getTasksByUser(userId, filters = {}) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_user:assigned_to(
            id,
            email,
            raw_user_meta_data
          ),
          assigned_by_user:assigned_by(
            id,
            email,
            raw_user_meta_data
          )
        `)
        .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Apply additional filters
      let filteredData = data || [];
      
      if (filters.status) {
        filteredData = filteredData.filter(task => task.status === filters.status);
      }
      if (filters.priority) {
        filteredData = filteredData.filter(task => task.priority === filters.priority);
      }
      if (filters.department) {
        filteredData = filteredData.filter(task => task.department === filters.department);
      }

      return filteredData.map(task => ({
        ...task,
        assigned_to_name: task.assigned_to_user?.raw_user_meta_data?.full_name || 'Unknown User',
        assigned_by_name: task.assigned_by_user?.raw_user_meta_data?.full_name || 'Unknown User',
        assigned_to_email: task.assigned_to_user?.email || '',
        assigned_by_email: task.assigned_by_user?.email || ''
      }));
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      throw error;
    }
  }
}

export const taskApi = new TaskApi();
