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

      // Get user profile to check role and department, and get users.id (primary key)
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('id, role, department')
        .eq('auth_user_id', authUser.id)
        .single();

      if (profileError || !userProfile) {
        console.warn('Error fetching user profile:', profileError);
        // Continue without department filtering if profile fetch fails
      }

      // Get current user's users.id (primary key) - this is what's stored in tasks.assigned_to and tasks.assigned_by
      const currentUserId = userProfile?.id;
      if (!currentUserId) {
        console.warn('Current user not found in users table, returning empty data');
        return {
          data: [],
          count: 0,
          page,
          limit,
          totalPages: 0
        };
      }

      // First, get all tasks that match the visibility rules
      // Tasks use users.id (primary key) for assigned_to and assigned_by
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply visibility rules based on task assignment:
      // - Tasks assigned to self (assigned_to === assigned_by): only visible to creator
      // - Tasks assigned to others: visible to both assigned_by and assigned_to
      // This is done using OR condition: (assigned_by = user OR assigned_to = user) AND (if self-assigned, then assigned_by = user)
      // Simplified: Show tasks where user is assigned_by OR assigned_to, but for self-assigned tasks, only show if user is the creator
      // IMPORTANT: Use users.id (primary key), not auth.users.id
      query = query.or(`assigned_by.eq.${currentUserId},assigned_to.eq.${currentUserId}`);

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

      // Fetch user details from users table for all assigned users
      // Note: task.assigned_to and task.assigned_by now contain users.id (primary key), not auth_user_id
      const allUserIds = new Set();
      data?.forEach(task => {
        if (task.assigned_to) allUserIds.add(task.assigned_to);
        if (task.assigned_by) allUserIds.add(task.assigned_by);
      });

      let userDetailsMap = {};
      if (allUserIds.size > 0) {
        const userIdsArray = Array.from(allUserIds);
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email, full_name')
          .in('id', userIdsArray);

        if (usersData) {
          usersData.forEach(user => {
            userDetailsMap[user.id] = {
              email: user.email || '',
              full_name: user.full_name || user.email || 'Unknown User'
            };
          });
        }
      }

      // Transform data to include user names and apply visibility rules
      let transformedData = data?.map(task => ({
        ...task,
        assigned_to_name: userDetailsMap[task.assigned_to]?.full_name || 'Unknown User',
        assigned_by_name: userDetailsMap[task.assigned_by]?.full_name || 'Unknown User',
        assigned_to_email: userDetailsMap[task.assigned_to]?.email || '',
        assigned_by_email: userDetailsMap[task.assigned_by]?.email || '',
        assignees: [] // Will be populated below for coordinated tasks
      })) || [];

      // For coordinated tasks, fetch assignees from task_assignees table and join with users table
      const coordinatedTasks = transformedData.filter(t => t.assignment_type === 'coordinated');
      if (coordinatedTasks.length > 0) {
        const coordinatedTaskIds = coordinatedTasks.map(t => t.id);
        
        // Fetch all assignees for coordinated tasks
        const { data: assigneesData } = await supabase
          .from('task_assignees')
          .select('task_id, user_id')
          .in('task_id', coordinatedTaskIds);

        if (assigneesData && assigneesData.length > 0) {
          // Get unique user IDs
          const allAssigneeIds = [...new Set(assigneesData.map(ta => ta.user_id))];
          
          // Fetch user details from users table
          // Note: task_assignees.user_id contains users.id (primary key), not auth_user_id
          const { data: usersData } = await supabase
            .from('users')
            .select('id, email, full_name')
            .in('id', allAssigneeIds);

          if (usersData) {
            // Update tasks with assignees
            transformedData = transformedData.map(task => {
              if (task.assignment_type === 'coordinated') {
                const taskAssignees = assigneesData.filter(ta => ta.task_id === task.id);
                const assignees = taskAssignees.map(ta => {
                  const user = usersData.find(u => u.id === ta.user_id);
                  return {
                    user_id: ta.user_id,
                    user_name: user?.full_name || user?.email || 'Unknown User',
                    user_email: user?.email || ''
                  };
                });
                return { ...task, assignees };
              }
              return task;
            });
          }
        }
      }

      // Apply visibility rules: Filter out self-assigned tasks where user is not the creator
      // Also include coordinated tasks where user is one of the assignees
      // IMPORTANT: Use currentUserId (users.id), not authUser.id (auth.users.id)
      transformedData = transformedData.filter(task => {
        const isSelfAssigned = task.assignment_type === 'self' || (task.assigned_to === task.assigned_by);
        const isCoordinated = task.assignment_type === 'coordinated';
        
        if (isSelfAssigned) {
          // Self-assigned tasks: only visible to the creator
          return task.assigned_by === currentUserId;
        } else if (isCoordinated && task.assignees && task.assignees.length > 0) {
          // Coordinated tasks: visible to creator and all assignees
          const isAssignee = task.assignees.some(a => a.user_id === currentUserId);
          return task.assigned_by === currentUserId || isAssignee;
        } else {
          // Single assignment tasks: visible to both assigner and assignee
          return task.assigned_by === currentUserId || task.assigned_to === currentUserId;
        }
      });

      return {
        data: transformedData,
        count: transformedData.length, // Use filtered count
        page,
        limit,
        totalPages: Math.ceil(transformedData.length / limit)
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
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch user details from users table
      const userIds = [];
      if (data.assigned_to) userIds.push(data.assigned_to);
      if (data.assigned_by) userIds.push(data.assigned_by);

      let userDetailsMap = {};
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('auth_user_id, email, full_name')
          .in('auth_user_id', userIds);

        if (usersData) {
          usersData.forEach(user => {
            userDetailsMap[user.auth_user_id] = {
              email: user.email || '',
              full_name: user.full_name || user.email || 'Unknown User'
            };
          });
        }
      }

      // Fetch assignees if this is a coordinated task
      let assignees = [];
      if (data.assignment_type === 'coordinated') {
        // First get the assignee user IDs
        const { data: assigneesData, error: assigneesError } = await supabase
          .from('task_assignees')
          .select('user_id')
          .eq('task_id', id);

        if (!assigneesError && assigneesData && assigneesData.length > 0) {
          // Then fetch user details from the users table
          const assigneeUserIds = assigneesData.map(ta => ta.user_id);
          const { data: assigneeUsersData, error: usersError } = await supabase
            .from('users')
            .select('auth_user_id, email, full_name')
            .in('auth_user_id', assigneeUserIds);

          if (!usersError && assigneeUsersData) {
            // Map assignees with user details
            assignees = assigneesData.map(ta => {
              const user = assigneeUsersData.find(u => u.auth_user_id === ta.user_id);
              return {
                user_id: ta.user_id,
                user_name: user?.full_name || user?.email || 'Unknown User',
                user_email: user?.email || ''
              };
            });
          } else {
            // Fallback: just use user IDs if users table lookup fails
            assignees = assigneesData.map(ta => ({
              user_id: ta.user_id,
              user_name: 'Unknown User',
              user_email: ''
            }));
          }
        }
      }

      return {
        ...data,
        assigned_to_name: userDetailsMap[data.assigned_to]?.full_name || 'Unknown User',
        assigned_by_name: userDetailsMap[data.assigned_by]?.full_name || 'Unknown User',
        assigned_to_email: userDetailsMap[data.assigned_to]?.email || '',
        assigned_by_email: userDetailsMap[data.assigned_by]?.email || '',
        assignees: assignees
      };
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  }

  // Create new task
  async create(taskData) {
    try {
      console.log('📝 TaskApi.create called with data:', taskData);
      
      // Validate required fields
      if (!taskData.title || !taskData.title.trim()) {
        throw new Error('Task title is required');
      }
      if (!taskData.description || !taskData.description.trim()) {
        throw new Error('Task description is required');
      }
      if (!taskData.assigned_to) {
        throw new Error('Assigned to user is required');
      }
      if (!taskData.assigned_by) {
        throw new Error('Assigned by user is required');
      }
      if (!taskData.department) {
        throw new Error('Department is required');
      }

      // Extract assignees array if it exists (for coordinated tasks)
      const assignees = taskData.assignees || [];
      const assignmentType = taskData.assignment_type || 'single';
      
      // Remove assignees and assignment_type from taskData before inserting (they're not columns in tasks table)
      const { assignees: _, assignment_type: __, ...taskInsertData } = taskData;

      // Validate that assigned_to is a valid UUID
      if (taskInsertData.assigned_to && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskInsertData.assigned_to)) {
        throw new Error('Invalid user ID format. Please select a valid UHub user.');
      }

      // Validate that assigned_to user exists in the users table
      // Note: assigned_to should be users.id (primary key), not auth_user_id
      if (taskInsertData.assigned_to) {
        const { data: assignedUser, error: userCheckError } = await supabase
          .from('users')
          .select('id, auth_user_id, email, full_name, status')
          .eq('id', taskInsertData.assigned_to)
          .single();

        if (userCheckError || !assignedUser) {
          console.error('❌ User validation failed:', {
            userId: taskInsertData.assigned_to,
            error: userCheckError
          });
          throw new Error('Invalid user selected. The selected user does not exist in the users table. Please select a valid UHub user from the dropdown.');
        }
        
        // Verify the user ID matches (data consistency check)
        if (assignedUser.id !== taskInsertData.assigned_to) {
          console.error('❌ User ID mismatch:', {
            expected: taskInsertData.assigned_to,
            found: assignedUser.id
          });
          throw new Error('User data inconsistency detected. The selected user ID does not match. Please contact your administrator.');
        }

        if (assignedUser.status !== 'active') {
          throw new Error(`Cannot assign task to ${assignedUser.full_name || assignedUser.email}. The user account is not active.`);
        }

        console.log('✅ User validation passed:', {
          userId: taskInsertData.assigned_to,
          email: assignedUser.email,
          name: assignedUser.full_name,
          users_table_id: assignedUser.id
        });
      }

      // Validate assigned_by user exists
      if (taskInsertData.assigned_by) {
        const { data: assignedByUser, error: assignedByCheckError } = await supabase
          .from('users')
          .select('id, email, full_name, status')
          .eq('id', taskInsertData.assigned_by)
          .single();

        if (assignedByCheckError || !assignedByUser) {
          console.error('❌ Assigned by user validation failed:', {
            userId: taskInsertData.assigned_by,
            error: assignedByCheckError
          });
          throw new Error('Your account is not properly set up in the users table. Please contact your administrator.');
        }
      }

      // Validate assignees for coordinated tasks
      if (assignmentType === 'coordinated' && assignees.length > 0) {
        const { data: assigneeUsers, error: assigneesCheckError } = await supabase
          .from('users')
          .select('id, email, full_name, status')
          .in('id', assignees);

        if (assigneesCheckError) {
          console.error('❌ Assignees validation failed:', assigneesCheckError);
          throw new Error('Error validating assignees. Please try again.');
        }

        if (!assigneeUsers || assigneeUsers.length !== assignees.length) {
          const foundIds = assigneeUsers?.map(u => u.id) || [];
          const missingIds = assignees.filter(id => !foundIds.includes(id));
          console.error('❌ Some assignees do not exist:', missingIds);
          throw new Error('One or more selected assignees do not exist in the users table. Please select valid users and try again.');
        }

        // Check if any assignee is inactive
        const inactiveAssignees = assigneeUsers.filter(u => u.status !== 'active');
        if (inactiveAssignees.length > 0) {
          const inactiveNames = inactiveAssignees.map(u => u.full_name || u.email).join(', ');
          throw new Error(`Cannot assign task to inactive users: ${inactiveNames}. Please select active users only.`);
        }
      }

      console.log('📤 Inserting task data:', {
        ...taskInsertData,
        assigned_to: taskInsertData.assigned_to,
        assigned_by: taskInsertData.assigned_by
      });

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskInsertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error creating task:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Provide more specific error message for foreign key violations
        if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key constraint')) {
          // Check which field caused the foreign key violation
          const isAssignedTo = error.message?.includes('assigned_to') || error.details?.includes('assigned_to');
          const isAssignedBy = error.message?.includes('assigned_by') || error.details?.includes('assigned_by');
          
          // Try to get user details for better error message
          let userInfo = '';
          try {
            if (isAssignedTo && taskInsertData.assigned_to) {
              const { data: userData } = await supabase
                .from('users')
                .select('email, full_name')
                .eq('auth_user_id', taskInsertData.assigned_to)
                .single();
              if (userData) {
                userInfo = ` (${userData.full_name || userData.email})`;
              }
            }
          } catch (e) {
            // Ignore errors when fetching user info
          }
          
          let errorMessage = 'Invalid user selected. The selected user does not exist in the authentication system.';
          if (isAssignedTo) {
            errorMessage = `The user you selected to assign this task to${userInfo} does not exist in the authentication system. This indicates a data inconsistency where the user exists in the users table but not in auth.users. Please select a different user or contact your administrator to fix this user's account.`;
          } else if (isAssignedBy) {
            errorMessage = 'Your account does not exist in the authentication system. Please contact your administrator.';
          }
          
          console.error('❌ Foreign key violation details:', {
            field: isAssignedTo ? 'assigned_to' : isAssignedBy ? 'assigned_by' : 'unknown',
            userId: isAssignedTo ? taskInsertData.assigned_to : taskInsertData.assigned_by,
            userInfo,
            errorCode: error.code,
            errorDetails: error.details
          });
          
          const enhancedError = new Error(errorMessage);
          enhancedError.code = error.code;
          enhancedError.details = error.details;
          enhancedError.hint = error.hint;
          throw enhancedError;
        }
        
        throw error;
      }

      console.log('✅ Task created successfully:', data);

      // Handle coordinated tasks - create entries in task_assignees table
      if (assignmentType === 'coordinated' && assignees.length > 0) {
        try {
          // Update assignment_type in tasks table
          await supabase
            .from('tasks')
            .update({ assignment_type: 'coordinated' })
            .eq('id', data.id);

          // Create entries in task_assignees table for all assignees
          const assigneeEntries = assignees.map(userId => ({
            task_id: data.id,
            user_id: userId
          }));

          const { error: assigneeError } = await supabase
            .from('task_assignees')
            .insert(assigneeEntries);

          if (assigneeError) {
            console.error('⚠️ Error creating task assignees:', assigneeError);
            // Don't throw - task is already created, just log the error
          } else {
            console.log('✅ Task assignees created successfully:', assignees.length);
          }
        } catch (assigneeErr) {
          console.error('⚠️ Error handling coordinated task assignees:', assigneeErr);
          // Don't throw - task is already created
        }
      } else if (assignmentType === 'self') {
        // Update assignment_type for self-assigned tasks
        await supabase
          .from('tasks')
          .update({ assignment_type: 'self' })
          .eq('id', data.id);
      }

      // Send notifications to all assignees
      const usersToNotify = assignmentType === 'coordinated' && assignees.length > 0 
        ? assignees 
        : [data.assigned_to];

      for (const userId of usersToNotify) {
        if (userId !== data.assigned_by) {
          try {
            await this.sendNotification(userId, data.id, 'assignment', 'New Task Assigned', `You have been assigned a new task: ${data.title}`);
          } catch (notifError) {
            console.warn(`⚠️ Failed to send notification to ${userId} (non-critical):`, notifError);
            // Don't throw - notification failure shouldn't prevent task creation
          }
        }
      }

      // Fetch task with assignees if coordinated
      if (assignmentType === 'coordinated' && assignees.length > 0) {
        const taskWithAssignees = await this.getById(data.id);
        return taskWithAssignees;
      }

      return data;
    } catch (error) {
      console.error('❌ Error creating task:', error);
      // Re-throw with more context if it's a database error
      if (error.code) {
        const enhancedError = new Error(error.message || 'Failed to create task');
        enhancedError.details = error.details;
        enhancedError.hint = error.hint;
        enhancedError.code = error.code;
        throw enhancedError;
      }
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
        const task = await this.getById(id);
        const updaterId = (await supabase.auth.getUser()).data.user?.id;
        
        // Get all users who should be notified (excluding the updater)
        const usersToNotify = new Set();
        
        // Add task creator
        if (task.assigned_by && task.assigned_by !== updaterId) {
          usersToNotify.add(task.assigned_by);
        }
        
        // For coordinated tasks, notify all assignees
        if (task.assignment_type === 'coordinated' && task.assignees && task.assignees.length > 0) {
          task.assignees.forEach(assignee => {
            if (assignee.user_id && assignee.user_id !== updaterId) {
              usersToNotify.add(assignee.user_id);
            }
          });
        } else if (task.assigned_to && task.assigned_to !== updaterId) {
          // For single tasks, notify the assignee
          usersToNotify.add(task.assigned_to);
        }
        
        // Send notifications to all relevant users
        const notificationPromises = Array.from(usersToNotify).map(userId => 
          this.sendNotification(userId, id, 'status_change', 'Task Status Updated', `Task "${task.title}" status changed to ${updates.status}`)
        );
        
        await Promise.all(notificationPromises);
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
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(data.map(c => c.user_id))];
      
      // Fetch user details from users table
      const { data: usersData } = await supabase
        .from('users')
        .select('auth_user_id, email, full_name')
        .in('auth_user_id', userIds);

      // Map comments with user details
      return data.map(comment => {
        const user = usersData?.find(u => u.auth_user_id === comment.user_id);
        return {
          ...comment,
          user_name: user?.full_name || 'Unknown User',
          user_email: user?.email || ''
        };
      });
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

      // Send notification to task assignees and creator
      const task = await this.getById(taskId);
      const commenterId = user.user.id;
      
      // Get all users who should be notified (excluding the commenter)
      const usersToNotify = new Set();
      
      // Add task creator
      if (task.assigned_by && task.assigned_by !== commenterId) {
        usersToNotify.add(task.assigned_by);
      }
      
      // For coordinated tasks, notify all assignees
      if (task.assignment_type === 'coordinated' && task.assignees && task.assignees.length > 0) {
        task.assignees.forEach(assignee => {
          if (assignee.user_id && assignee.user_id !== commenterId) {
            usersToNotify.add(assignee.user_id);
          }
        });
      } else if (task.assigned_to && task.assigned_to !== commenterId) {
        // For single tasks, notify the assignee
        usersToNotify.add(task.assigned_to);
      }
      
      // Send notifications to all relevant users
      const notificationPromises = Array.from(usersToNotify).map(userId => 
        this.sendNotification(userId, taskId, 'comment', 'New Comment Added', `A new comment was added to task "${task.title}"`)
      );
      
      await Promise.all(notificationPromises);

      // Fetch user details from users table for the comment
      const { data: userData } = await supabase
        .from('users')
        .select('auth_user_id, email, full_name')
        .eq('auth_user_id', user.user.id)
        .single();

      return {
        ...data,
        user_name: userData?.full_name || data.user?.raw_user_meta_data?.full_name || 'Unknown User',
        user_email: userData?.email || data.user?.email || ''
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
        .select('*')
        .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user details from users table
      const allUserIds = new Set();
      data?.forEach(task => {
        if (task.assigned_to) allUserIds.add(task.assigned_to);
        if (task.assigned_by) allUserIds.add(task.assigned_by);
      });

      let userDetailsMap = {};
      if (allUserIds.size > 0) {
        const userIdsArray = Array.from(allUserIds);
        const { data: usersData } = await supabase
          .from('users')
          .select('auth_user_id, email, full_name')
          .in('auth_user_id', userIdsArray);

        if (usersData) {
          usersData.forEach(user => {
            userDetailsMap[user.auth_user_id] = {
              email: user.email || '',
              full_name: user.full_name || user.email || 'Unknown User'
            };
          });
        }
      }

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
        assigned_to_name: userDetailsMap[task.assigned_to]?.full_name || 'Unknown User',
        assigned_by_name: userDetailsMap[task.assigned_by]?.full_name || 'Unknown User',
        assigned_to_email: userDetailsMap[task.assigned_to]?.email || '',
        assigned_by_email: userDetailsMap[task.assigned_by]?.email || ''
      }));
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      throw error;
    }
  }
}

export const taskApi = new TaskApi();
