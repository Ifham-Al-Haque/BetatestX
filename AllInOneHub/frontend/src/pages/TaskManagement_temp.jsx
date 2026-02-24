import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, FileText, Clock, User, 
  AlertCircle, CheckCircle, XCircle, MoreHorizontal,
  Edit, Trash2, Eye, Calendar, Tag, Building, 
  CheckSquare, ClipboardList, Users, AlertTriangle,
  MessageCircle, Bell, Star, TrendingUp, BarChart3,
  RefreshCw, Send, ThumbsUp, ThumbsDown, Flag,
  Target, Timer, Award, Activity, Zap, Sparkles, Rocket
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiService } from '../services/api';
import { taskApi } from '../services/taskApi';
import { supabase } from '../supabaseClient';
import { DEPARTMENTS } from '../config/departments';

import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';

const TaskManagement = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'my-tasks', 'assigned-by-me'
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    myTasks: 0,
    assignedByMe: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigned_to: '',
    department: '',
    search: ''
  });
  const [userDepartment, setUserDepartment] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    department: '',
    due_date: '',
    estimated_hours: '',
    tags: '',
    category: 'general'
  });

  // Use centralized departments from config
  const departments = DEPARTMENTS.map(dept => dept.value);

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800', icon: '🟢' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800', icon: '🟠' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800', icon: '🔴' }
  ];

  const categories = [
    'general',
    'bug-fix',
    'feature-request',
    'maintenance',
    'documentation',
    'training',
    'meeting',
    'research'
  ];

  const statuses = [
    { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Timer },
    { value: 'review', label: 'Under Review', color: 'bg-purple-100 text-purple-800', icon: Eye },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
  ];

  const fetchUsers = async () => {
    try {
      console.log('🔄 Fetching real UHub users for task assignment...');
      
      // Fetch users from the users table
      const users = await apiService.userManagement.getAll();
      
      console.log('📊 Raw users data from UHub database:', users);
      
      if (users && users.length > 0) {
        // Process and filter users for task assignment
        const validUsers = users
          .filter(user => {
            // Only include active users with valid departments
            const hasValidDepartment = user.department && 
              user.department !== 'N/A' && 
              user.department !== '' && 
              user.department !== 'Unassigned' &&
              user.department !== null;
            
            const isActive = user.status === 'active';
            
            return hasValidDepartment && isActive;
          })
          .map(user => ({
            id: user.id,
            full_name: user.full_name || user.email || 'N/A',
            email: user.email || 'N/A',
            department: user.department,
            status: user.status || 'active',
            role: user.role || 'employee',
            position: user.position || 'N/A',
            phone: user.phone || 'N/A',
            location: user.location || 'N/A'
          }));
        
        console.log('✅ Valid UHub users for task assignment:', validUsers);
        console.log('🏢 Available departments:', [...new Set(validUsers.map(u => u.department))]);
        
        if (validUsers.length > 0) {
          console.log('🎉 Successfully loaded real UHub users!');
          setAllUsers(validUsers);
          return;
        } else {
          console.warn('⚠️ No valid users found in UHub database');
          console.log('🔍 All users were filtered out. Check department assignments and status.');
        }
      } else {
        console.warn('⚠️ No users found in UHub database');
      }
      
      // If no valid users found, show error message
      console.error('🚨 No active users with valid departments found in UHub database');
      console.log('💡 Please check:');
      console.log('   1. Users have proper department assignments');
      console.log('   2. Users are marked as active');
      console.log('   3. Database connection is working');
      
      // Set empty array instead of mock data
      setAllUsers([]);
      
    } catch (err) {
      console.error('❌ Error fetching UHub users:', err);
      console.log('🔧 This might be due to:');
      console.log('   1. Database connection issues');
      console.log('   2. RLS policies blocking access');
      console.log('   3. API service not working properly');
      console.log('   4. Authentication issues');
      console.log('   5. Table access permissions');
      
      // Show detailed error information
      if (err.message) {
        console.log('Error message:', err.message);
      }
      if (err.details) {
        console.log('Error details:', err.details);
      }
      if (err.hint) {
        console.log('Error hint:', err.hint);
      }
      if (err.code) {
        console.log('Error code:', err.code);
      }
      
      // Set empty array instead of mock data
      setAllUsers([]);
    }
  };

  const filterUsersByDepartment = (department) => {
    console.log('Filtering users by department:', department);
    console.log('All users:', allUsers);
    console.log('User departments:', allUsers.map(u => ({ name: u.full_name, dept: u.department, status: u.status })));
    
    const filtered = allUsers.filter(user => {
      // Handle case-insensitive matching and different department formats
      const userDept = (user.department || '').toString().toUpperCase().trim();
      const selectedDept = (department || '').toString().toUpperCase().trim();
      
      // Also check for partial matches (e.g., "TECHNOLOGY" matches "TECHNOLOGY")
      const isMatch = userDept === selectedDept || 
                     userDept.includes(selectedDept) || 
                     selectedDept.includes(userDept);
      
      const isActive = (user.status || '').toLowerCase() === 'active';
      
      console.log(`User: ${user.full_name}, Dept: "${userDept}", Selected: "${selectedDept}", Match: ${isMatch}, Active: ${isActive}`);
      
      return isMatch && isActive;
    });
    
    console.log('Filtered users:', filtered);
    setDepartmentUsers(filtered);
  };

  const getTaskStats = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.warn('User not authenticated for stats');
        return { total: 0, myTasks: 0, assignedByMe: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 };
      }
      
      const stats = await taskApi.getStats(authUser.id);
      return stats || { total: 0, myTasks: 0, assignedByMe: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 };
    } catch (error) {
      console.error('Error fetching task stats:', error);
      return { total: 0, myTasks: 0, assignedByMe: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 };
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.warn('User not authenticated');
        setTasks([]);
        return;
      }

      // Get user profile to check role and department
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      if (profileError) {
        console.warn('Error fetching user profile:', profileError);
      } else if (userProfile) {
        setUserDepartment(userProfile.department);
      }

      // Fetch tasks based on filters and user role
      const taskFilters = {
        ...filters,
        // Filter by user's department unless user is admin/manager
        ...(userProfile?.role !== 'admin' && userProfile?.role !== 'manager' && userProfile?.department && { 
          department: userProfile.department 
        }),
        // Remove empty filters
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.department && { department: filters.department }),
        ...(filters.assigned_to && { assigned_to: filters.assigned_to }),
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category })
      };

      const tasksResponse = await taskApi.getAll(taskFilters, 1, 100);
      
      // If no tasks returned, set empty array
      if (!tasksResponse || !tasksResponse.data) {
        setTasks([]);
        return;
      }
      
      // Fetch comments for each task
      const tasksWithComments = await Promise.all(
        tasksResponse.data.map(async (task) => {
          try {
            const comments = await taskApi.getComments(task.id);
            return { ...task, comments: comments || [] };
          } catch (error) {
            console.error(`Error fetching comments for task ${task.id}:`, error);
            return { ...task, comments: [] };
          }
        })
      );

      setTasks(tasksWithComments);
    } catch (err) {
      console.error('Error fetching data:', err);
      // Don't show error toast for empty data, just set empty array
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // useEffect hooks
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch all users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch stats when component mounts or tasks change
  useEffect(() => {
    const loadStats = async () => {
      const statsData = await getTaskStats();
      setStats(statsData);
    };
    loadStats();
  }, [getTaskStats, tasks]);

  // Set form department when user department is loaded
  useEffect(() => {
    if (userDepartment && !formData.department) {
      setFormData(prev => ({ ...prev, department: userDepartment }));
    }
  }, [userDepartment, formData.department]);

  // Update department users when department changes
  useEffect(() => {
    if (formData.department) {
      filterUsersByDepartment(formData.department);
    } else {
      setDepartmentUsers([]);
    }
    // Reset assigned_to when department changes
    setFormData(prev => ({ ...prev, assigned_to: '' }));
  }, [formData.department, allUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        showError('Error', 'User not authenticated');
        return;
      }

      const taskData = {
        title: formData.title,
        description: formData.description,
        assigned_to: formData.assigned_to,
        assigned_by: authUser.id,
        priority: formData.priority,
        department: formData.department || userDepartment,
        category: formData.category,
        due_date: formData.due_date || null,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };

      if (editingTask) {
        // Update existing task
        const updatedTask = await taskApi.update(editingTask.id, taskData);
        const updatedTasks = tasks.map(task => 
          task.id === editingTask.id ? { ...task, ...updatedTask } : task
        );
        setTasks(updatedTasks);
        success('Success', 'Task updated successfully!');
      } else {
        // Create new task
        const newTask = await taskApi.create(taskData);
        setTasks([newTask, ...tasks]);
        success('Success', 'Task created and assigned successfully!');
      }

      setShowForm(false);
      setEditingTask(null);
      resetForm();
    } catch (err) {
      console.error('Error submitting task:', err);
      showError('Error', 'Failed to submit task. Please try again.');
    }
  };


  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        ...(newStatus === 'in_progress' && { started_at: new Date().toISOString() }),
        ...(newStatus === 'completed' && { completed_at: new Date().toISOString() })
      };

      const updatedTask = await taskApi.update(taskId, updateData);
      
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, ...updatedTask } : task
      );
      setTasks(updatedTasks);
      success('Success', `Task status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      console.error('Error updating status:', err);
      showError('Error', 'Failed to update task status');
    }
  };

  const handleAddComment = async (taskId) => {
    if (!newComment.trim()) return;
    
    try {
      const comment = await taskApi.addComment(taskId, newComment.trim());
      
      const updatedTasks = tasks.map(task => 
        task.id === taskId 
          ? { ...task, comments: [...(task.comments || []), comment] }
          : task
      );
      setTasks(updatedTasks);
      setNewComment('');
      success('Success', 'Comment added successfully');
    } catch (err) {
      console.error('Error adding comment:', err);
      showError('Error', 'Failed to add comment');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    success('Data refreshed successfully');
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      assigned_to: task.assigned_to,
      priority: task.priority,
      department: task.department,
      due_date: task.due_date || '',
      estimated_hours: task.estimated_hours ? task.estimated_hours.toString() : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskApi.delete(id);
        const updatedTasks = tasks.filter(task => task.id !== id);
        setTasks(updatedTasks);
        success('Success', 'Task deleted successfully!');
      } catch (err) {
        console.error('Error deleting task:', err);
        showError('Error', 'Failed to delete task. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assigned_to: '',
      priority: 'medium',
      department: '',
      due_date: '',
      estimated_hours: '',
      tags: '',
      category: 'general'
    });
  };

  // Filter tasks based on active tab and filters
  const getFilteredTasks = () => {
    let filtered = [...tasks];

    // Filter by tab
    if (activeTab === 'my-tasks') {
      filtered = filtered.filter(task => task.assigned_to === user.id);
    } else if (activeTab === 'assigned-by-me') {
      filtered = filtered.filter(task => task.assigned_by === user.id);
    }

    // Apply other filters
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    if (filters.department) {
      filtered = filtered.filter(task => task.department === filters.department);
    }
    if (filters.assigned_to) {
      filtered = filtered.filter(task => task.assigned_to === filters.assigned_to);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.assigned_to_name.toLowerCase().includes(searchLower) ||
        task.assigned_by_name.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const getPriorityConfig = (priority) => {
    return priorities.find(p => p.value === priority) || priorities[1];
  };

  const getStatusConfig = (status) => {
    return statuses.find(s => s.value === status) || statuses[0];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : 'bg-gray-100 text-gray-800';
  };

  const canEdit = (task) => {
    return user.id === task.assigned_by || userProfile?.role === 'admin';
  };

  const canDelete = (task) => {
    return user.id === task.assigned_by || userProfile?.role === 'admin';
  };

  const getAssignedUserName = (userId) => {
    const user = allUsers.find(u => u.id === userId);
    return user ? user.full_name : 'Unknown';
  };

  const getAssignedByUserName = (userId) => {
    const user = allUsers.find(u => u.id === userId);
    return user ? user.full_name : 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="ml-80 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const filteredTasks = getFilteredTasks();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f1f5f9' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>
      
      <div className="ml-80 p-6 relative z-10">
        {/* Enhanced Header with Modern Design */}
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
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                  New Task
                </Button>
              </motion.div>
              <DarkModeToggle />
              <UserDropdown />
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="group bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">All tasks in system</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300 shadow-lg">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 h-1 bg-blue-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.total / 10) * 100, 100)}%` }}
                transition={{ delay: 0.5, duration: 1 }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="group bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">My Tasks</p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">{stats.myTasks}</p>
                <p className="text-xs text-gray-500 mt-1">Assigned to you</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl group-hover:from-green-600 group-hover:to-green-700 transition-all duration-300 shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 h-1 bg-green-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.myTasks / 5) * 100, 100)}%` }}
                transition={{ delay: 0.6, duration: 1 }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="group bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-purple-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Assigned by Me</p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{stats.assignedByMe}</p>
                <p className="text-xs text-gray-500 mt-1">Created by you</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl group-hover:from-purple-600 group-hover:to-purple-700 transition-all duration-300 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 h-1 bg-purple-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.assignedByMe / 5) * 100, 100)}%` }}
                transition={{ delay: 0.7, duration: 1 }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="group bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-orange-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{stats.inProgress}</p>
                <p className="text-xs text-gray-500 mt-1">Currently active</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl group-hover:from-orange-600 group-hover:to-orange-700 transition-all duration-300 shadow-lg">
                <Timer className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 h-1 bg-orange-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.inProgress / 3) * 100, 100)}%` }}
                transition={{ delay: 0.8, duration: 1 }}
              />
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'all', label: 'All Tasks', icon: ClipboardList, count: stats.total },
              { id: 'my-tasks', label: 'My Tasks', icon: Target, count: stats.myTasks },
              { id: 'assigned-by-me', label: 'Assigned by Me', icon: Users, count: stats.assignedByMe }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Enhanced Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg p-8 mb-8 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filter Tasks</h3>
                <p className="text-sm text-gray-600">Find exactly what you're looking for</p>
              </div>
            </div>
            <Button
              onClick={() => setFilters({ status: '', priority: '', assigned_to: '', department: '', search: '' })}
              variant="outline"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear All</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Search tasks, users..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 w-full rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-all duration-300"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative group">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-white transition-all duration-300 appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Department Filter */}
            <div className="relative group">
              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-white transition-all duration-300 appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={userProfile?.role !== 'admin' && userProfile?.role !== 'manager'}
              >
                <option value="">All Departments</option>
                {(userProfile?.role === 'admin' || userProfile?.role === 'manager' 
                  ? DEPARTMENTS 
                  : userDepartment ? DEPARTMENTS.filter(d => d.value === userDepartment) : []
                ).map(dept => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Building className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Priority Filter */}
            <div className="relative group">
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-white transition-all duration-300 appearance-none cursor-pointer"
              >
                <option value="">All Priorities</option>
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.search || filters.status || filters.department || filters.priority) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-600">Active filters:</span>
                {filters.search && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    <Search className="w-3 h-3 mr-1" />
                    "{filters.search}"
                    <button
                      onClick={() => setFilters({ ...filters, search: '' })}
                      className="ml-2 hover:text-blue-600"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.status && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    <Clock className="w-3 h-3 mr-1" />
                    {statuses.find(s => s.value === filters.status)?.label}
                    <button
                      onClick={() => setFilters({ ...filters, status: '' })}
                      className="ml-2 hover:text-green-600"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.department && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                    <Building className="w-3 h-3 mr-1" />
                    {filters.department}
                    <button
                      onClick={() => setFilters({ ...filters, department: '' })}
                      className="ml-2 hover:text-purple-600"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.priority && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {priorities.find(p => p.value === filters.priority)?.label}
                    <button
                      onClick={() => setFilters({ ...filters, priority: '' })}
                      className="ml-2 hover:text-orange-600"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Task Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              {/* Enhanced Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat'
                  }}></div>
                </div>
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <CheckSquare className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">
                        {editingTask ? 'Edit Task' : 'Create New Task'}
                      </h2>
                      <p className="text-blue-100 mt-1">
                        {editingTask ? 'Update task details and assignments' : 'Set up a new task for your team'}
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowForm(false);
                      setEditingTask(null);
                      resetForm();
                    }}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl backdrop-blur-sm transition-all duration-300"
                  >
                    <XCircle className="w-6 h-6 text-white" />
                  </motion.button>
                </div>

                {/* Department Status */}
                {formData.department && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex items-center gap-3"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                      <Building className="w-4 h-4" />
                      <span className="text-sm font-medium">{formData.department}</span>
                    </div>
                    {departmentUsers.length > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/30 rounded-full backdrop-blur-sm">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">{departmentUsers.length} user(s) available</span>
                      </div>
                    )}
                    {/* Data source indicator and debug button */}
                    <div className="flex items-center gap-2">
                      {allUsers.length === 0 ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-500/30 text-red-200 text-xs rounded">
                          <AlertTriangle className="w-3 h-3" />
                          No Users Found
                        </div>
                      ) : allUsers.length > 0 && allUsers[0].email?.includes('@example.com') ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/30 text-orange-200 text-xs rounded">
                          <AlertTriangle className="w-3 h-3" />
                          Mock Data
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/30 text-green-200 text-xs rounded">
                          <CheckCircle className="w-3 h-3" />
                          Real UHub Users
                        </div>
                      )}
                      <button
                        onClick={() => {
                          console.log('=== TASK ASSIGNMENT DEBUG ===');
                          console.log('All users from users table:', allUsers);
                          console.log('Available departments:', [...new Set(allUsers.map(u => u.department))]);
                          console.log('Selected department:', formData.department);
                          console.log('Filtered department users:', departmentUsers);
                          console.log('User count by department:', 
                            [...new Set(allUsers.map(u => u.department))].map(dept => ({
                              department: dept,
                              count: allUsers.filter(u => u.department === dept).length,
                              users: allUsers.filter(u => u.department === dept).map(u => u.full_name)
                            }))
                          );
                          console.log('=== END DEBUG ===');
                        }}
                        className="px-2 py-1 bg-yellow-500/30 text-yellow-200 text-xs rounded hover:bg-yellow-500/50 transition-colors"
                      >
                        Debug
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Enhanced Instructions */}
              <div className="p-8">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-2 bg-blue-500 rounded-xl">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Assign Tasks</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                          <p className="text-blue-800">First, select the <strong className="text-blue-900">Department</strong> where the task will be performed</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                          <p className="text-blue-800">Then, choose an <strong className="text-blue-900">Employee</strong> from that department to assign the task to</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                          <p className="text-blue-800">Only active users from the selected department will be available for assignment</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Task Title and Department */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Task Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="Enter a descriptive task title"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-lg"
                    />
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="department" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-500" />
                      Department *
                    </Label>
                    <div className="relative">
                      <select
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 appearance-none cursor-pointer text-lg bg-white"
                        required
                        disabled={userProfile?.role !== 'admin' && userProfile?.role !== 'manager'}
                      >
                        <option value="">Select Department</option>
                        {(userProfile?.role === 'admin' || userProfile?.role === 'manager' 
                          ? DEPARTMENTS 
                          : userDepartment ? DEPARTMENTS.filter(d => d.value === userDepartment) : []
                        ).map(dept => (
                          <option key={dept.value} value={dept.value}>{dept.label}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Building className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    {userProfile?.role !== 'admin' && userProfile?.role !== 'manager' && (
                      <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        You can only create tasks in your department: {userDepartment}
                      </p>
                    )}
                  </motion.div>
                </div>

                {/* Task Description */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Task Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    placeholder="Provide a detailed description of what needs to be done, including any specific requirements or guidelines..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 resize-none"
                  />
                </motion.div>

                {/* Assignment, Priority, and Due Date */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="assigned_to" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" />
                      Assign To *
                    </Label>
                    <div className="relative">
                      <select
                        id="assigned_to"
                        value={formData.assigned_to}
                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 appearance-none cursor-pointer text-lg bg-white"
                        required
                        disabled={!formData.department}
                      >
                        <option value="">
                          {!formData.department 
                            ? 'Select Department First' 
                            : departmentUsers.length === 0 
                              ? 'No Users in Department' 
                              : 'Select Employee'
                          }
                        </option>
                        {departmentUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.full_name} - {user.email}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
              {formData.department && departmentUsers.length === 0 && allUsers.length > 0 && (
                <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-sm text-red-600 font-medium">
                      No active users found in {formData.department} department
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      Make sure users have the correct department assigned in their profile
                    </p>
                  </div>
                </div>
              )}
      {allUsers.length === 0 && (
        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <div>
            <p className="text-sm text-red-600 font-medium">
              No UHub users found in database
            </p>
            <p className="text-xs text-red-500 mt-1">
              Run the populate_users_database.sql script to create sample users for testing.
            </p>
            <button
              onClick={() => {
                console.log('=== TASK ASSIGNMENT DEBUG ===');
                console.log('All users from users table:', allUsers);
                console.log('Available departments:', [...new Set(allUsers.map(u => u.department))]);
                console.log('Selected department:', formData.department);
                console.log('Filtered department users:', departmentUsers);
                console.log('User count by department:',
                  [...new Set(allUsers.map(u => u.department))].map(dept => ({
                    department: dept,
                    count: allUsers.filter(u => u.department === dept).length,
                    users: allUsers.filter(u => u.department === dept).map(u => u.full_name)
                  }))
                );
                console.log('=== END DEBUG ===');
              }}
              className="px-2 py-1 bg-yellow-500/30 text-yellow-200 text-xs rounded hover:bg-yellow-500/50 transition-colors mt-2"
            >
              Debug
            </button>
          </div>
        </div>
      )}
                    {formData.department && departmentUsers.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-sm text-green-600 font-medium">
                            {departmentUsers.length} UHub user(s) available in {formData.department}
                          </p>
                          <p className="text-xs text-green-500 mt-1">
                            Real users from your UHub database - they will receive task notifications
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="priority" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Flag className="w-4 h-4 text-blue-500" />
                      Priority *
                    </Label>
                    <div className="relative">
                      <select
                        id="priority"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 appearance-none cursor-pointer text-lg bg-white"
                        required
                      >
                        {priorities.map(priority => (
                          <option key={priority.value} value={priority.value}>{priority.label}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Flag className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="due_date" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      Due Date
                    </Label>
                    <div className="relative">
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-lg"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Calendar className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Estimated Hours */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-2"
                >
                  <Label htmlFor="estimated_hours" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Estimated Hours
                  </Label>
                  <div className="relative">
                    <Input
                      id="estimated_hours"
                      type="number"
                      value={formData.estimated_hours}
                      onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                      placeholder="e.g., 4"
                      min="0"
                      step="0.5"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-lg"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Clock className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Optional: Estimate how many hours this task will take</p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex justify-end space-x-4 pt-8 border-t border-gray-200"
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTask(null);
                      resetForm();
                    }}
                    className="px-8 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 font-semibold"
                  >
                    Cancel
                  </Button>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                    >
                      {editingTask ? 'Update Task' : 'Create Task'}
                    </Button>
                  </motion.div>
                </motion.div>
              </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Enhanced Task Cards */}
        <div className="space-y-6">
          {filteredTasks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl p-16 text-center border border-gray-100"
            >
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    <ClipboardList className="w-16 h-16 text-blue-500" />
                  </motion.div>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Star className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-gray-900 mb-4"
              >
                {filters.search || filters.status || filters.department || filters.priority
                  ? "No tasks match your filters"
                  : "Ready to get things done?"
                }
              </motion.h3>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed"
              >
                {filters.search || filters.status || filters.department || filters.priority
                  ? "Try adjusting your search criteria or clear the filters to see all available tasks."
                  : "Create your first task and start organizing your work efficiently. Track progress, assign team members, and stay on top of deadlines."
                }
              </motion.p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Task
                  </Button>
                </motion.div>
                
                {(filters.search || filters.status || filters.department || filters.priority) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      onClick={() => setFilters({ status: '', priority: '', assigned_to: '', department: '', search: '' })}
                      variant="outline"
                      className="px-6 py-4 rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Quick Tips */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100"
              >
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-500" />
                  Quick Tips
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Set clear priorities
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    Add due dates
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-purple-500" />
                    Assign team members
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTasks.map((task) => {
                const priorityConfig = getPriorityConfig(task.priority);
                const statusConfig = getStatusConfig(task.status);
                const StatusIcon = statusConfig.icon;
                const isOverdueTask = task.due_date && isOverdue(task.due_date);
                
                return (
                  <motion.div
                    key={task.id}
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
                            onClick={() => setSelectedTask(task)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(task)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(task.id)}
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
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Task Details Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTask.title}</h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Created on {new Date(selectedTask.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedTask(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </Button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600">{selectedTask.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Assigned To</h4>
                      <p className="text-gray-900">{getAssignedUserName(selectedTask.assigned_to)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Assigned By</h4>
                      <p className="text-gray-900">{getAssignedByUserName(selectedTask.assigned_by)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Department</h4>
                      <p className="text-gray-900">{selectedTask.department}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Priority</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                        {priorities.find(p => p.value === selectedTask.priority)?.label || selectedTask.priority}
                      </span>
                    </div>
                    {selectedTask.due_date && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Due Date</h4>
                        <p className="text-gray-900">{new Date(selectedTask.due_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedTask.estimated_hours && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Estimated Hours</h4>
                        <p className="text-gray-900">{selectedTask.estimated_hours} hours</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedTask.tags && selectedTask.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create/Edit Task Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {editingTask ? 'Edit Task' : 'Create New Task'}
                      </h2>
                      <p className="text-blue-100 text-sm">
                        {editingTask ? 'Update task details' : 'Fill in the details to create a new task'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowForm(false);
                      setEditingTask(null);
                      setFormData({
                        title: '',
                        description: '',
                        assigned_to: '',
                        priority: 'medium',
                        department: '',
                        due_date: '',
                        estimated_hours: '',
                        tags: '',
                        category: 'general'
                      });
                    }}
                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-2 block">
                        Task Title *
                      </Label>
                      <Input
                        id="title"
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 text-lg"
                        placeholder="Enter task title"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                        Description *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 min-h-[100px]"
                        placeholder="Describe the task details"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="department" className="text-sm font-medium text-gray-700 mb-2 block">
                        Department *
                      </Label>
                      <select
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 appearance-none cursor-pointer text-lg bg-white"
                        required
                        disabled={userProfile?.role !== 'admin' && userProfile?.role !== 'manager'}
                      >
                        <option value="">Select Department</option>
                        {(userProfile?.role === 'admin' || userProfile?.role === 'manager'
                          ? DEPARTMENTS
                          : userDepartment ? DEPARTMENTS.filter(d => d.value === userDepartment) : []
                        ).map(dept => (
                          <option key={dept.value} value={dept.value}>{dept.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="priority" className="text-sm font-medium text-gray-700 mb-2 block">
                        Priority *
                      </Label>
                      <select
                        id="priority"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 appearance-none cursor-pointer text-lg bg-white"
                        required
                      >
                        {priorities.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.icon} {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="assigned_to" className="text-sm font-medium text-gray-700 mb-2 block">
                        Assign To *
                      </Label>
                      <select
                        id="assigned_to"
                        value={formData.assigned_to}
                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 appearance-none cursor-pointer text-lg bg-white"
                        required
                        disabled={!formData.department}
                      >
                        <option value="">Select User</option>
                        {departmentUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.full_name} ({user.email})
                          </option>
                        ))}
                      </select>
                      
                      {/* User Assignment Feedback */}
                      {formData.department && departmentUsers.length === 0 && allUsers.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <div>
                            <p className="text-sm text-red-600 font-medium">
                              No active users found in {formData.department} department
                            </p>
                            <p className="text-xs text-red-500 mt-1">
                              Make sure users have the correct department assigned in their profile
                            </p>
                          </div>
                        </div>
                      )}
                      {allUsers.length === 0 && (
                        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <div>
                            <p className="text-sm text-red-600 font-medium">
                              No UHub users found in database
                            </p>
                            <p className="text-xs text-red-500 mt-1">
                              Run the populate_users_database.sql script to create sample users for testing.
                            </p>
                            <button
                              onClick={() => {
                                console.log('=== TASK ASSIGNMENT DEBUG ===');
                                console.log('All users from users table:', allUsers);
                                console.log('Available departments:', [...new Set(allUsers.map(u => u.department))]);
                                console.log('Selected department:', formData.department);
                                console.log('Filtered department users:', departmentUsers);
                                console.log('User count by department:',
                                  [...new Set(allUsers.map(u => u.department))].map(dept => ({
                                    department: dept,
                                    count: allUsers.filter(u => u.department === dept).length,
                                    users: allUsers.filter(u => u.department === dept).map(u => u.full_name)
                                  }))
                                );
                                console.log('=== END DEBUG ===');
                              }}
                              className="px-2 py-1 bg-yellow-500/30 text-yellow-200 text-xs rounded hover:bg-yellow-500/50 transition-colors mt-2"
                            >
                              Debug
                            </button>
                          </div>
                        </div>
                      )}
                      {formData.department && departmentUsers.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <div>
                            <p className="text-sm text-green-600 font-medium">
                              {departmentUsers.length} UHub user(s) available in {formData.department}
                            </p>
                            <p className="text-xs text-green-500 mt-1">
                              Real users from your UHub database - they will receive task notifications
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="due_date" className="text-sm font-medium text-gray-700 mb-2 block">
                        Due Date
                      </Label>
                      <Input
                        id="due_date"
                        type="datetime-local"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="estimated_hours" className="text-sm font-medium text-gray-700 mb-2 block">
                        Estimated Hours
                      </Label>
                      <Input
                        id="estimated_hours"
                        type="number"
                        min="1"
                        value={formData.estimated_hours}
                        onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                        placeholder="e.g., 8"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category" className="text-sm font-medium text-gray-700 mb-2 block">
                        Category
                      </Label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 appearance-none cursor-pointer bg-white"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="tags" className="text-sm font-medium text-gray-700 mb-2 block">
                        Tags (comma-separated)
                      </Label>
                      <Input
                        id="tags"
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                        placeholder="e.g., urgent, frontend, bug-fix"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingTask(null);
                        setFormData({
                          title: '',
                          description: '',
                          assigned_to: '',
                          priority: 'medium',
                          department: '',
                          due_date: '',
                          estimated_hours: '',
                          tags: '',
                          category: 'general'
                        });
                      }}
                      className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {editingTask ? 'Update Task' : 'Create Task'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManagement;
