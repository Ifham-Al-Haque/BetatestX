import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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
import { emailService } from '../services/emailService';
import { supabase } from '../supabaseClient';
import { DEPARTMENTS } from '../config/departments';

import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import EnhancedButton from '../components/ui/EnhancedButton';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';
import TaskCard from '../components/TaskCard';
import TaskNotes from '../components/TaskNotes';
import MyTaskCard from '../components/MyTaskCard';
import { CardSkeleton } from '../components/LoadingSkeleton';
import PaginationControls from '../components/ui/PaginationControls';
import { safeMotion } from '../utils/motion';

const TaskManagement = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const queryClient = useQueryClient();
  
  const [allUsers, setAllUsers] = useState([]);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'my-tasks', 'assigned-by-me'
  const [showComments, setShowComments] = useState(false);
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
  const [currentUserId, setCurrentUserId] = useState(null); // Store current user's users.id (primary key)
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    assigned_to_multiple: [], // Array of user IDs for coordinated tasks
    priority: 'medium',
    department: '',
    due_date: '',
    estimated_hours: '',
    tags: '',
    category: 'general',
    assignToMyself: false, // New field to track if assigning to self
    assignmentType: 'single', // 'single', 'coordinated', 'self'
    notes: '' // Notes field for task
  });
  const [newComment, setNewComment] = useState(''); // For adding new comments

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

  const formatDateInputValue = useCallback((value) => {
    if (!value) return '';

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return '';
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
        return trimmed.slice(0, 10);
      }
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const formatDateTimeLocalValue = useCallback((value) => {
    if (!value) return '';

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return '';
      const tzOffset = value.getTimezoneOffset();
      const localDate = new Date(value.getTime() - tzOffset * 60000);
      return localDate.toISOString().slice(0, 16);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return '';

      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
        return trimmed;
      }

      const date = new Date(trimmed);
      if (Number.isNaN(date.getTime())) return '';
      const tzOffset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - tzOffset * 60000);
      return localDate.toISOString().slice(0, 16);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const tzOffset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - tzOffset * 60000);
    return localDate.toISOString().slice(0, 16);
  }, []);

  const normalizeDueDateForSave = useCallback((value) => {
    if (!value) return '';

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? '' : value.toISOString();
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return '';

      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const date = new Date(`${trimmed}T00:00:00`);
        return Number.isNaN(date.getTime()) ? '' : date.toISOString();
      }

      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
        const date = new Date(trimmed);
        return Number.isNaN(date.getTime()) ? '' : date.toISOString();
      }

      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
    }

    return '';
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('🔄 Fetching real UHub users for task assignment...');
      
      // Fetch users from the users table
      const users = await apiService.userManagement.getAll();
      
      console.log('📊 Raw users data from UHub database:', users);
      
      if (users && users.length > 0) {
        // First, filter users with basic criteria
        const basicFilteredUsers = users
          .filter(user => {
            // CRITICAL: Only include users that have auth_user_id (they must be linked to auth.users)
            const hasAuthUserId = user.auth_user_id && 
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.auth_user_id);
            
            // Only include active users with valid departments
            const hasValidDepartment = user.department && 
              user.department !== 'N/A' && 
              user.department !== '' && 
              user.department !== 'Unassigned' &&
              user.department !== null;
            
            const isActive = user.status === 'active';
            
            return hasAuthUserId && hasValidDepartment && isActive;
          });
        
        console.log(`📋 Found ${basicFilteredUsers.length} users after basic filtering`);
        
        // Note: We're using users.id (primary key) for task assignment, which matches
        // the foreign key constraint on tasks.assigned_to -> users.id
        // All users that pass the basic filtering are valid for task assignment
        
        // Map to final format
        // IMPORTANT: Use users.id (primary key) for task assignment, not auth_user_id
        // This matches the foreign key constraint on tasks.assigned_to -> users.id
        const finalUsers = basicFilteredUsers.map(user => ({
          id: user.id, // Use users.id for task assignment (references users table primary key)
          auth_user_id: user.auth_user_id, // Keep original for reference
          users_table_id: user.id, // Same as id (for consistency)
          full_name: user.full_name || user.email || 'N/A',
          email: user.email || 'N/A',
          department: user.department,
          status: user.status || 'active',
          role: user.role || 'employee',
          position: user.position || 'N/A',
          phone: user.phone || 'N/A',
          location: user.location || 'N/A'
        }));
        
        console.log(`✅ Valid UHub users for task assignment: ${finalUsers.length} users`);
        console.log('🏢 Available departments:', [...new Set(finalUsers.map(u => u.department))]);
        console.log('🔑 User IDs (users.id) for task assignment:', finalUsers.map(u => ({ id: u.id, email: u.email, users_table_id: u.users_table_id })));
        
        if (finalUsers.length > 0) {
          console.log('🎉 Successfully loaded real UHub users!');
          setAllUsers(finalUsers);
          return;
        } else {
          console.warn('⚠️ No valid users found in UHub database after auth verification');
          console.log('🔍 All users were filtered out. Check department assignments, status, and auth accounts.');
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
    console.log('🔍 Filtering users by department:', department);
    console.log('📊 All users:', allUsers);
    console.log('🏢 User departments:', allUsers.map(u => ({ name: u.full_name, dept: u.department, status: u.status })));
    
    if (!department) {
      console.log('⚠️ No department selected');
      setDepartmentUsers([]);
      return;
    }
    
    const filtered = allUsers.filter(user => {
      // Handle case-insensitive matching and different department formats
      const userDept = (user.department || '').toString().toUpperCase().trim();
      const selectedDept = (department || '').toString().toUpperCase().trim();
      
      // Normalize department names for better matching
      // Handle common variations: OPERATION/OPERATIONS, CUSTOMER_SERVICE/CUSTOMER SERVICE, etc.
      const normalizeDept = (dept) => {
        if (!dept) return '';
        return dept
          .replace(/\s+/g, '_')      // Replace spaces with underscores
          .replace(/[_-]/g, '')     // Remove underscores and hyphens
          .replace(/S$/, '')        // Remove trailing 'S' for plural/singular matching (OPERATIONS -> OPERATION)
          .toUpperCase();
      };
      
      const normalizedUserDept = normalizeDept(userDept);
      const normalizedSelectedDept = normalizeDept(selectedDept);
      
      // Check exact match (case-insensitive)
      const exactMatch = userDept === selectedDept;
      
      // Check normalized match (handles OPERATION/OPERATIONS, CUSTOMER_SERVICE/CUSTOMER SERVICE, etc.)
      const normalizedMatch = normalizedUserDept === normalizedSelectedDept && normalizedUserDept.length > 0;
      
      // Check if one contains the other (for partial matches)
      const containsMatch = userDept.includes(selectedDept) || selectedDept.includes(userDept);
      
      // Check if normalized versions contain each other
      const normalizedContainsMatch = normalizedUserDept.length > 0 && normalizedSelectedDept.length > 0 &&
                                     (normalizedUserDept.includes(normalizedSelectedDept) || 
                                      normalizedSelectedDept.includes(normalizedUserDept));
      
      // Special handling for OPERATION/OPERATIONS
      const operationMatch = (userDept === 'OPERATION' && selectedDept === 'OPERATIONS') ||
                            (userDept === 'OPERATIONS' && selectedDept === 'OPERATION');
      
      const isMatch = exactMatch || normalizedMatch || containsMatch || normalizedContainsMatch || operationMatch;
      
      const isActive = (user.status || '').toLowerCase() === 'active';
      
      console.log(`👤 User: ${user.full_name}`);
      console.log(`   User Dept: "${userDept}" (normalized: "${normalizedUserDept}")`);
      console.log(`   Selected: "${selectedDept}" (normalized: "${normalizedSelectedDept}")`);
      console.log(`   Match: ${isMatch} (exact: ${exactMatch}, normalized: ${normalizedMatch}, contains: ${containsMatch})`);
      console.log(`   Active: ${isActive}`);
      console.log(`   ✅ Result: ${isMatch && isActive ? 'INCLUDED' : 'EXCLUDED'}`);
      
      return isMatch && isActive;
    });
    
    console.log(`✅ Filtered ${filtered.length} users for department "${department}":`, filtered.map(u => u.full_name));
    setDepartmentUsers(filtered);
    
    if (filtered.length === 0 && allUsers.length > 0) {
      console.warn('⚠️ No users found! Available departments in database:', 
        [...new Set(allUsers.map(u => u.department))].filter(Boolean)
      );
    }
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

  // Memoize task filters to prevent unnecessary refetches
  const taskFilters = useMemo(() => {
    const cleanFilters = {
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.department && { department: filters.department }),
      ...(filters.assigned_to && { assigned_to: filters.assigned_to }),
      ...(filters.search && { search: filters.search }),
      ...(filters.category && { category: filters.category })
    };
    
    // Filter by user's department unless user is admin/manager
    if (userProfile?.role !== 'admin' && userProfile?.role !== 'manager' && userProfile?.department) {
      cleanFilters.department = userProfile.department;
    }
    
    return cleanFilters;
  }, [filters, userProfile]);

  // Fetch user profile and set currentUserId
  const { data: userProfileData } = useQuery({
    queryKey: ['taskUserProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      if (error) {
        console.warn('Error fetching user profile:', error);
        return null;
      }

      return profile;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  // Set user department and currentUserId when profile is loaded
  useEffect(() => {
    if (userProfileData) {
      setUserDepartment(userProfileData.department);
      setCurrentUserId(userProfileData.id);
    }
  }, [userProfileData]);

  // Fetch tasks with React Query - includes caching and prevents reloads
  const { 
    data: tasksData, 
    isLoading: tasksLoading, 
    refetch: refetchTasks,
    isRefetching: isRefetchingTasks
  } = useQuery({
    queryKey: ['tasks', taskFilters, activeTab], // Include activeTab in key for tab-specific caching
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        return { data: [], commentsMap: {} };
      }

      const tasksResponse = await taskApi.getAll(taskFilters, 1, 100);
      
      if (!tasksResponse || !tasksResponse.data) {
        return { data: [], commentsMap: {} };
      }
      
      // Fetch comments for each task
      const commentsMap = {};
      await Promise.all(
        tasksResponse.data.map(async (task) => {
          try {
            const comments = await taskApi.getComments(task.id);
            commentsMap[task.id] = comments || [];
          } catch (error) {
            console.error(`Error fetching comments for task ${task.id}:`, error);
            commentsMap[task.id] = [];
          }
        })
      );

      return { data: tasksResponse.data, commentsMap };
    },
    enabled: !!user?.id && !!currentUserId, // Only fetch when user is available
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes - cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Use cached data if available
    refetchOnReconnect: true, // Only refetch on reconnect
    keepPreviousData: true, // Keep previous data while fetching new data
  });

  // Extract tasks and comments from query data
  const tasks = useMemo(() => tasksData?.data || [], [tasksData]);
  const taskComments = useMemo(() => tasksData?.commentsMap || {}, [tasksData]);
  const loading = tasksLoading && !tasksData; // Only show loading if we don't have cached data

  // Handle refresh manually
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchTasks();
    // Also refetch stats
    queryClient.invalidateQueries(['taskStats']);
    setRefreshing(false);
  }, [refetchTasks, queryClient]);
  
  // Use query's refetching state combined with manual refreshing state
  const isRefreshing = refreshing || isRefetchingTasks;

  // Fetch all users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch stats with React Query - cached separately
  const { data: statsData } = useQuery({
    queryKey: ['taskStats', user?.id],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        return { total: 0, myTasks: 0, assignedByMe: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 };
      }
      return await getTaskStats();
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Update stats state when query data changes
  useEffect(() => {
    if (statsData) {
      setStats({
        total: statsData.total_tasks || statsData.total || 0,
        myTasks: statsData.my_tasks || statsData.myTasks || 0,
        assignedByMe: statsData.assigned_by_me || statsData.assignedByMe || 0,
        pending: statsData.pending_tasks || statsData.pending || 0,
        inProgress: statsData.in_progress_tasks || statsData.inProgress || 0,
        completed: statsData.completed_tasks || statsData.completed || 0,
        overdue: statsData.overdue_tasks || statsData.overdue || 0
      });
    }
  }, [statsData]);

  // Set form department when user department is loaded
  useEffect(() => {
    if (userDepartment && !formData.department) {
      setFormData(prev => ({ ...prev, department: userDepartment }));
    }
  }, [userDepartment, formData.department]);

  // Comments are now loaded with tasks via React Query, no separate useEffect needed

  // Note: Department filtering removed - users are now selected from all UHub account holders

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        showError('Error', 'User not authenticated');
        return;
      }

      // Get current user's users.id (primary key) from users table
      // This is needed because tasks.assigned_by references users.id, not auth.users.id
      const { data: currentUser, error: currentUserError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (currentUserError || !currentUser) {
        console.error('❌ Error fetching current user from users table:', currentUserError);
        showError('Error', 'Your account is not properly set up in the system. Please contact your administrator.');
        return;
      }

      const currentUserId = currentUser.id; // This is users.id (primary key)

      // Validate required fields
      if (!formData.title || !formData.title.trim()) {
        showError('Validation Error', 'Task title is required');
        return;
      }

      if (!formData.description || !formData.description.trim()) {
        showError('Validation Error', 'Task description is required');
        return;
      }

      // Department is optional - will be auto-determined from selected users or use current user's department

      // Determine assignment type and validate
      let assignedToId = null;
      let assignees = [];
      let assignmentType = formData.assignmentType || 'single';

      if (assignmentType === 'self') {
        // For self-assignment, use current user's users.id
        assignedToId = currentUserId;
        assignmentType = 'self';
      } else if (assignmentType === 'coordinated') {
        assignees = formData.assigned_to_multiple || [];
        if (assignees.length === 0) {
          showError('Error', 'Please select at least one user for coordinated task');
          return;
        }
        if (assignees.length === 1) {
          // If only one user selected, treat as single assignment
          assignedToId = assignees[0];
          assignmentType = 'single';
          assignees = [];
        } else {
          // Multiple users - coordinated task
          assignedToId = assignees[0]; // Keep first as primary for backward compatibility
          assignmentType = 'coordinated';
        }
      } else {
        // Single assignment
        assignedToId = formData.assigned_to;
        if (!assignedToId) {
          showError('Error', 'Please select a user to assign the task to');
          return;
        }
        assignmentType = 'single';
      }

      // Validate that assigned users have valid auth_user_id
      if (assignedToId && !allUsers.find(u => u.id === assignedToId)) {
        console.error('❌ Selected user not found in allUsers:', assignedToId);
        console.log('Available users:', allUsers.map(u => ({ id: u.id, email: u.email })));
        showError('Error', 'Selected user is not valid. Please select a different user.');
        return;
      }

      // Auto-determine department from selected users if not set
      let finalDepartment = formData.department || userDepartment;
      if (!finalDepartment && assignmentType === 'coordinated' && assignees.length > 0) {
        // Get department from first assignee
        const firstAssignee = allUsers.find(u => u.id === assignees[0]);
        finalDepartment = firstAssignee?.department || userDepartment || 'OTHERS';
      } else if (!finalDepartment && assignedToId) {
        // Get department from selected user
        const selectedUser = allUsers.find(u => u.id === assignedToId);
        finalDepartment = selectedUser?.department || userDepartment || 'OTHERS';
      }

      // Default to user's department or 'OTHERS' if still not set
      if (!finalDepartment) {
        finalDepartment = userDepartment || 'OTHERS';
      }

      // Validate that assignedToId is a valid UUID (auth_user_id)
      if (assignedToId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assignedToId)) {
        console.error('❌ Invalid UUID format for assigned_to:', assignedToId);
        showError('Error', 'Invalid user ID format. Please select a user again.');
        return;
      }

      const normalizedDueDateForSubmit = normalizeDueDateForSave(formData.due_date);

      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        notes: formData.notes ? formData.notes.trim() : null, // Add notes field
        assigned_to: assignedToId, // This is users.id (primary key from users table)
        assigned_by: currentUserId, // This is users.id (primary key from users table)
        priority: formData.priority || 'medium',
        department: finalDepartment,
        category: formData.category || 'general',
        due_date: normalizedDueDateForSubmit || null,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
        assignment_type: assignmentType,
        assignees: assignees // Array of users.id values for coordinated tasks
      };

      console.log('📝 Submitting task with data:', taskData);
      console.log('👤 Assigned to (users.id):', assignedToId);
      console.log('👤 Assigned by (users.id):', currentUserId);
      console.log('👥 Assignees (users.ids):', assignees);
      console.log('📋 Selected user details:', allUsers.find(u => u.id === assignedToId));
      console.log('🔍 All available users:', allUsers.map(u => ({ id: u.id, email: u.email })));

      if (editingTask) {
        // Update existing task
        const updatedTask = await taskApi.update(editingTask.id, taskData);
        // Invalidate and refetch tasks to get fresh data
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['taskStats']);
        success('Success', 'Task updated successfully!');
      } else {
        // Create new task
        const newTask = await taskApi.create(taskData);
        // Invalidate and refetch tasks to get fresh data
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['taskStats']);
        success('Success', 'Task created and assigned successfully!');

        // Notify assignee(s): in-app + push + email
        const assigneeUserIds = assignmentType === 'coordinated' && assignees.length > 0 ? assignees : (assignedToId ? [assignedToId] : []);
        const assignedByName = userProfile?.full_name || user?.email || 'A colleague';
        import('../services/notificationService').then(({ default: notificationService }) => {
          assigneeUserIds.forEach((uid) => {
            notificationService.notifyTaskAssigned(
              { id: newTask.id, title: newTask.title, description: newTask.description, priority: newTask.priority, due_date: newTask.due_date, department: newTask.department },
              uid,
              assignedByName
            ).catch((err) => console.warn('Task assignment notification failed (non-critical):', err));
          });
        });
      }

      setShowForm(false);
      setEditingTask(null);
      resetForm();
    } catch (err) {
      console.error('❌ Error submitting task:', err);
      console.error('Error details:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to submit task. Please try again.';
      
      if (err.message) {
        if (err.message.includes('duplicate') || err.message.includes('unique')) {
          errorMessage = 'A task with this title already exists. Please use a different title.';
        } else if (err.message.includes('foreign key') || err.message.includes('constraint')) {
          errorMessage = 'Invalid user selected. Please select a valid UHub user.';
        } else if (err.message.includes('permission') || err.message.includes('policy')) {
          errorMessage = 'You do not have permission to create tasks. Please contact your administrator.';
        } else if (err.message.includes('null value') || err.message.includes('not null')) {
          errorMessage = 'Required fields are missing. Please fill in all required fields.';
        } else if (err.message.includes('invalid input') || err.message.includes('syntax')) {
          errorMessage = 'Invalid data format. Please check your input and try again.';
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }
      
      showError('Error', errorMessage);
    }
  };


  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        ...(newStatus === 'in_progress' && { started_at: new Date().toISOString() }),
        ...(newStatus === 'completed' && { completed_at: new Date().toISOString() })
      };

      await taskApi.update(taskId, updateData);
      
      // Invalidate and refetch tasks to get fresh data
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['taskStats']);
      success('Success', `Task status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      console.error('Error updating status:', err);
      showError('Error', 'Failed to update task status');
    }
  };

  const handleAddComment = async (taskId) => {
    if (!newComment.trim()) return;
    
    try {
      await taskApi.addComment(taskId, newComment.trim());
      
      // Invalidate tasks query to refetch with new comments
      queryClient.invalidateQueries(['tasks']);
      setNewComment('');
      success('Success', 'Comment added successfully');
    } catch (err) {
      console.error('Error adding comment:', err);
      showError('Error', 'Failed to add comment');
    }
  };

  // handleRefresh is now defined above with useCallback

  const handleEdit = (task) => {
    // Get current user to check if task is assigned to self
    const checkSelfAssignment = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const isSelfAssigned = task.assigned_to === authUser?.id && task.assigned_by === authUser?.id;
        
        setEditingTask(task);
        setFormData({
          title: task.title,
          description: task.description,
          notes: task.notes || '',
          assigned_to: isSelfAssigned ? '' : task.assigned_to,
          assigned_to_multiple: task.assignment_type === 'coordinated' && task.assignees 
            ? task.assignees.map(a => a.user_id) 
            : [],
          priority: task.priority,
          department: task.department,
          due_date: normalizeDueDateForSave(task.due_date) || '',
          estimated_hours: task.estimated_hours ? task.estimated_hours.toString() : '',
          tags: task.tags ? task.tags.join(', ') : '',
          category: task.category || 'general',
          assignToMyself: isSelfAssigned,
          assignmentType: task.assignment_type || 'single'
        });
        setShowForm(true);
      } catch (err) {
        console.error('Error checking self assignment:', err);
        // Fallback to regular assignment
        setEditingTask(task);
        setFormData({
          title: task.title,
          description: task.description,
          assigned_to: task.assigned_to,
          priority: task.priority,
          department: task.department,
          due_date: normalizeDueDateForSave(task.due_date) || '',
          estimated_hours: task.estimated_hours ? task.estimated_hours.toString() : '',
          tags: task.tags ? task.tags.join(', ') : '',
          category: task.category || 'general',
          assignToMyself: false
        });
        setShowForm(true);
      }
    };
    
    checkSelfAssignment();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskApi.delete(id);
        // Invalidate and refetch tasks to get fresh data
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['taskStats']);
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
      assigned_to_multiple: [],
      priority: 'medium',
      department: userDepartment || '',
      due_date: '',
      estimated_hours: '',
      tags: '',
      category: 'general',
      assignToMyself: false,
      assignmentType: 'single',
      notes: ''
    });
  };

  // Filter tasks based on active tab and filters
  const getFilteredTasks = () => {
    let filtered = [...tasks];

    // Use currentUserId from state (users.id primary key)
    // Note: tasks use users.id, not auth.users.id
    if (!currentUserId) {
      console.warn('⚠️ Current user ID not available for filtering, showing all tasks');
      // Still apply other filters
    } else {
      // Filter by tab with visibility rules
      if (activeTab === 'my-tasks') {
        // Show tasks assigned to me OR tasks assigned by me
        // This includes:
        // 1. Tasks assigned to me by others (assigned_to === currentUserId)
        // 2. Tasks I assigned to myself (assigned_to === currentUserId AND assigned_by === currentUserId)
        // 3. Tasks I assigned to others (assigned_by === currentUserId)
        filtered = filtered.filter(task => 
          task.assigned_to === currentUserId || task.assigned_by === currentUserId
        );
      } else if (activeTab === 'assigned-by-me') {
        // Show tasks I assigned (both to myself and to others)
        filtered = filtered.filter(task => task.assigned_by === currentUserId);
      } else {
        // For 'all' tab, show tasks based on visibility rules:
        // - Tasks assigned to self: only visible to creator (assigned_by === currentUserId)
        // - Tasks assigned to others: visible to both assigned_by and assigned_to
        filtered = filtered.filter(task => {
          const isSelfAssigned = task.assigned_to === task.assigned_by;
          if (isSelfAssigned) {
            // Self-assigned tasks: only visible to the creator
            return task.assigned_by === currentUserId;
          } else {
            // Tasks assigned to others: visible to both assigner and assignee
            return task.assigned_by === currentUserId || task.assigned_to === currentUserId;
          }
        });
      }
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

  const filteredTasks = getFilteredTasks();
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedTasks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTasks.slice(start, start + PAGE_SIZE);
  }, [filteredTasks, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, filters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <CardSkeleton cards={4} />
          <CardSkeleton cards={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800/95 dark:backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 dark:shadow-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Management</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create, assign, and track tasks efficiently across your team</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={safeMotion(prefersReducedMotion, { scale: 1.05 }, {})}
                whileTap={safeMotion(prefersReducedMotion, { scale: 0.95 }, {})}
              >
                <EnhancedButton
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="secondary"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </EnhancedButton>
              </motion.div>
              <motion.div
                whileHover={safeMotion(prefersReducedMotion, { scale: 1.05 }, {})}
                whileTap={safeMotion(prefersReducedMotion, { scale: 0.95 }, {})}
              >
                <EnhancedButton
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-4 h-4" />
                  New Task
                </EnhancedButton>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header with Stats */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Task Management</h1>
              <p className="text-blue-100 text-lg">
                Manage and monitor your team's tasks with comprehensive analytics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <motion.div 
                className="flex items-center space-x-3 px-4 py-2 bg-white/20 rounded-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">System Online</span>
              </motion.div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Tasks</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <ClipboardList className="w-6 h-6 text-blue-200" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">My Tasks</p>
                  <p className="text-2xl font-bold">{stats.myTasks}</p>
                </div>
                <Target className="w-6 h-6 text-green-200" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Assigned by Me</p>
                  <p className="text-2xl font-bold">{stats.assignedByMe}</p>
                </div>
                <Users className="w-6 h-6 text-purple-200" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">In Progress</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
                <Timer className="w-6 h-6 text-orange-200" />
              </div>
            </div>
          </div>
        </div>


        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm rounded-xl shadow-sm dark:shadow-lg dark:shadow-blue-500/5 border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
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
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm rounded-xl shadow-sm dark:shadow-lg dark:shadow-blue-500/5 border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Tasks</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Find exactly what you're looking for</p>
              </div>
            </div>
            <Button
              onClick={() => setFilters({ status: '', priority: '', assigned_to: '', department: '', search: '' })}
              variant="outline"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear All</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
              <Input
                placeholder="Search tasks, users..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all duration-300"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative group">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-300 appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
            </div>

            {/* Department Filter */}
            <div className="relative group">
              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-300 appearance-none cursor-pointer disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
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
                <Building className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
            </div>

            {/* Priority Filter */}
            <div className="relative group">
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-all duration-300 appearance-none cursor-pointer"
              >
                <option value="">All Priorities</option>
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <AlertTriangle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.search || filters.status || filters.department || filters.priority) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active filters:</span>
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
        </div>

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
                {/* Task Title */}
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

                {/* Notes Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="space-y-2"
                >
                  <Label htmlFor="notes" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Add any additional notes, reminders, or important information about this task..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 resize-none"
                  />
                  <p className="text-xs text-gray-500">These notes will be visible to all assigned users and the task creator</p>
                </motion.div>

                {/* Task Type Selection - Individual or Joined Task */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-500" />
                    Task Type *
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg hover:bg-white transition-colors border-2 border-transparent hover:border-green-300">
                      <input
                        type="radio"
                        name="assignmentType"
                        value="single"
                        checked={formData.assignmentType === 'single'}
                        onChange={() => setFormData({ 
                          ...formData, 
                          assignmentType: 'single',
                          assignToMyself: false,
                          assigned_to_multiple: [],
                          assigned_to: ''
                        })}
                        className="w-5 h-5 text-green-600 focus:ring-green-500 focus:ring-2"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <User className="w-6 h-6 text-green-500" />
                        <div>
                          <span className="font-bold text-gray-900 block">Individual Task</span>
                          <span className="text-xs text-gray-600">Assign to one person</span>
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg hover:bg-white transition-colors border-2 border-transparent hover:border-purple-300">
                      <input
                        type="radio"
                        name="assignmentType"
                        value="coordinated"
                        checked={formData.assignmentType === 'coordinated'}
                        onChange={() => setFormData({ 
                          ...formData, 
                          assignmentType: 'coordinated',
                          assignToMyself: false,
                          assigned_to: ''
                        })}
                        className="w-5 h-5 text-purple-600 focus:ring-purple-500 focus:ring-2"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <Users className="w-6 h-6 text-purple-500" />
                        <div>
                          <span className="font-bold text-gray-900 block">Joined Task</span>
                          <span className="text-xs text-gray-600">Assign to multiple people</span>
                        </div>
                      </div>
                    </label>
                  </div>
                  {formData.assignmentType === 'single' && (
                    <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <User className="w-4 h-4 text-green-500" />
                      <p className="text-sm text-green-600 font-medium">
                        This task will be assigned to one person - visible to both you and the assignee
                      </p>
                    </div>
                  )}
                  {formData.assignmentType === 'coordinated' && (
                    <div className="flex items-center gap-2 mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <Users className="w-4 h-4 text-purple-500" />
                      <p className="text-sm text-purple-600 font-medium">
                        This task will be assigned to multiple people for coordination - visible to all assignees and you
                      </p>
                    </div>
                  )}
                </motion.div>

                {/* Assignment Section - Show all UHub account holders */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    {formData.assignmentType === 'coordinated' ? (
                      <Users className="w-4 h-4 text-purple-500" />
                    ) : (
                      <User className="w-4 h-4 text-blue-500" />
                    )}
                    {formData.assignmentType === 'coordinated'
                      ? 'Select Multiple UHub Users *'
                      : 'Assign To UHub User *'}
                  </Label>
                  
                  {formData.assignmentType === 'coordinated' ? (
                    <div className="space-y-3">
                      <div className="max-h-60 overflow-y-auto border-2 border-gray-200 rounded-xl p-3 bg-white">
                        {allUsers.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No UHub users available</p>
                        ) : (
                          <div className="space-y-2">
                            {allUsers.map(user => {
                              const isSelected = formData.assigned_to_multiple.includes(user.id);
                              return (
                                <label
                                  key={user.id}
                                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-purple-50 border-2 border-purple-300'
                                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({
                                          ...formData,
                                          assigned_to_multiple: [...formData.assigned_to_multiple, user.id],
                                          // Auto-set department from first selected user if not set
                                          department: formData.department || user.department || formData.department
                                        });
                                      } else {
                                        setFormData({
                                          ...formData,
                                          assigned_to_multiple: formData.assigned_to_multiple.filter(id => id !== user.id)
                                        });
                                      }
                                    }}
                                    className="w-5 h-5 text-purple-600 focus:ring-purple-500 focus:ring-2 rounded"
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{user.full_name}</p>
                                    <p className="text-sm text-gray-500">{user.email} {user.department && `• ${user.department}`}</p>
                                  </div>
                                  {isSelected && (
                                    <CheckCircle className="w-5 h-5 text-purple-500" />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {formData.assigned_to_multiple.length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <Users className="w-4 h-4 text-purple-500" />
                          <p className="text-sm text-purple-600 font-medium">
                            {formData.assigned_to_multiple.length} UHub user(s) selected for coordination
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        id="assigned_to"
                        value={formData.assigned_to}
                        onChange={(e) => {
                          const selectedUserId = e.target.value;
                          const selectedUser = allUsers.find(u => u.id === selectedUserId);
                          setFormData({ 
                            ...formData, 
                            assigned_to: selectedUserId,
                            // Auto-set department from selected user if not set
                            department: formData.department || selectedUser?.department || formData.department
                          });
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 appearance-none cursor-pointer text-lg bg-white"
                        required={formData.assignmentType === 'single'}
                      >
                        <option value="">Select UHub User</option>
                        {allUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.full_name} - {user.email} {user.department && `(${user.department})`}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Error message if no users available */}
                {allUsers.length === 0 && (
                  <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="text-sm text-red-600 font-medium">
                        No UHub users found in database
                      </p>
                      <p className="text-xs text-red-500 mt-1">
                        Please ensure users are registered in the UHub system.
                      </p>
                    </div>
                  </div>
                )}

                {/* Priority, and Due Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        value={formatDateInputValue(formData.due_date)}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          due_date: e.target.value ? normalizeDueDateForSave(e.target.value) : '' 
                        })}
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
              className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-xl dark:shadow-2xl p-16 text-center border border-gray-100 dark:border-gray-700"
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
                className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
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
                className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto leading-relaxed"
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
                className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl border border-blue-100 dark:border-gray-600"
              >
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
                  Quick Tips
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
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
            <>
              {/* Enhanced My Tasks Header */}
              {activeTab === 'my-tasks' && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                        <Target className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">My Tasks</h2>
                        <p className="text-blue-100 text-sm">
                          Tasks assigned to you or created by you • {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-white/90">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{filteredTasks.filter(t => t.status === 'pending').length}</div>
                        <div className="text-xs text-blue-100">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{filteredTasks.filter(t => t.status === 'in_progress').length}</div>
                        <div className="text-xs text-blue-100">In Progress</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{filteredTasks.filter(t => t.status === 'completed').length}</div>
                        <div className="text-xs text-blue-100">Completed</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className={`grid gap-6 ${
                activeTab === 'my-tasks' 
                  ? 'grid-cols-1 lg:grid-cols-2' 
                  : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
              }`}>
              <AnimatePresence>
                {pagedTasks.map((task, index) => {
                  // Use MyTaskCard for "My Tasks" tab for enhanced UI with inline notes
                  if (activeTab === 'my-tasks') {
                    return (
                      <MyTaskCard
                        key={task.id}
                        task={task}
                        onView={setSelectedTask}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        getAssignedUserName={getAssignedUserName}
                        getAssignedByUserName={getAssignedByUserName}
                        isOverdue={isOverdue}
                        allUsers={allUsers}
                        currentUserId={currentUserId}
                      />
                    );
                  }
                  // Use regular TaskCard for other tabs
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onView={setSelectedTask}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      getAssignedUserName={getAssignedUserName}
                      getAssignedByUserName={getAssignedByUserName}
                      isOverdue={isOverdue}
                    />
                  );
                })}
              </AnimatePresence>
              </div>
              <PaginationControls
                page={currentPage}
                totalPages={totalPages}
                totalItems={filteredTasks.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
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
                  
                  {selectedTask.notes && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-500" />
                        Notes
                      </h3>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedTask.notes}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Change Section */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                      Task Status
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      {statuses.map(status => {
                        const StatusIcon = status.icon;
                        return (
                          <button
                            key={status.value}
                            onClick={async () => {
                              try {
                                await taskApi.update(selectedTask.id, { status: status.value });
                                const updatedTask = { ...selectedTask, status: status.value };
                                setSelectedTask(updatedTask);
                                // Invalidate queries to refresh data
                                queryClient.invalidateQueries(['tasks']);
                                success('Success', `Task status updated to ${status.label}`);
                              } catch (err) {
                                console.error('Error updating status:', err);
                                showError('Error', 'Failed to update task status');
                              }
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                              selectedTask.status === status.value
                                ? `${status.color} border-2 border-current shadow-md`
                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {status.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Assigned To</h4>
                      {selectedTask.assignment_type === 'coordinated' && selectedTask.assignees && selectedTask.assignees.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {selectedTask.assignees.map((assignee, idx) => (
                              <span key={assignee.user_id || idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                {assignee.user_name || 'Unknown'}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-purple-600 font-semibold">
                            Coordinated Task - {selectedTask.assignees.length} assignee(s)
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-900">{getAssignedUserName(selectedTask.assigned_to)}</p>
                      )}
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

                  {/* Notes Section */}
                  {selectedTask && (
                    <div className="border-t border-gray-200 pt-6">
                      <TaskNotes taskId={selectedTask.id} allUsers={allUsers} />
                    </div>
                  )}

                  {/* Comments Section */}
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-blue-500" />
                      Comments
                    </h3>
                    
                    {/* Comments List */}
                    <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                      {taskComments[selectedTask.id] && taskComments[selectedTask.id].length > 0 ? (
                        taskComments[selectedTask.id].map((comment) => (
                          <div key={comment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  {comment.user_name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{comment.user_name || 'Unknown User'}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(comment.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap mt-2">{comment.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-8">No comments yet. Be the first to add a comment!</p>
                      )}
                    </div>
                    
                    {/* Add Comment Form */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <Label htmlFor="new_comment" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Add Comment or Note
                      </Label>
                      <Textarea
                        id="new_comment"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment or note about this task..."
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 resize-none mb-3"
                      />
                      <Button
                        onClick={async () => {
                          if (!newComment.trim()) {
                            showError('Error', 'Please enter a comment');
                            return;
                          }
                          try {
                            const comment = await taskApi.addComment(selectedTask.id, newComment.trim());
                            setNewComment('');
                            // Invalidate queries to refresh comments
                            queryClient.invalidateQueries(['tasks']);
                            success('Success', 'Comment added successfully!');
                          } catch (err) {
                            console.error('Error adding comment:', err);
                            showError('Error', 'Failed to add comment');
                          }
                        }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg"
                      >
                        <Send className="w-4 h-4 inline mr-2" />
                        Post Comment
                      </Button>
                    </div>
                  </div>
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
                      resetForm();
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
                    
                    {/* Department field removed - will be auto-determined from selected users */}
                    
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
                    
                    {/* Notes Section */}
                    <div className="md:col-span-2">
                      <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-2 block">
                        Notes
                      </Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 min-h-[80px]"
                        placeholder="Add any additional notes, reminders, or important information about this task..."
                      />
                      <p className="text-xs text-gray-500 mt-1">These notes will be visible to all assigned users and the task creator</p>
                    </div>

                    {/* Task Type Selection - Individual or Joined Task */}
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Task Type *
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                        <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg hover:bg-white transition-colors border-2 border-transparent hover:border-green-300">
                          <input
                            type="radio"
                            name="assignmentType"
                            value="single"
                            checked={formData.assignmentType === 'single'}
                            onChange={() => setFormData({ 
                              ...formData, 
                              assignmentType: 'single',
                              assignToMyself: false,
                              assigned_to_multiple: [],
                              assigned_to: ''
                            })}
                            className="w-5 h-5 text-green-600 focus:ring-green-500 focus:ring-2"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <User className="w-6 h-6 text-green-500" />
                            <div>
                              <span className="font-bold text-gray-900 block">Individual Task</span>
                              <span className="text-xs text-gray-600">Assign to one person</span>
                            </div>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg hover:bg-white transition-colors border-2 border-transparent hover:border-purple-300">
                          <input
                            type="radio"
                            name="assignmentType"
                            value="coordinated"
                            checked={formData.assignmentType === 'coordinated'}
                            onChange={() => setFormData({ 
                              ...formData, 
                              assignmentType: 'coordinated',
                              assignToMyself: false,
                              assigned_to: ''
                            })}
                            className="w-5 h-5 text-purple-600 focus:ring-purple-500 focus:ring-2"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <Users className="w-6 h-6 text-purple-500" />
                            <div>
                              <span className="font-bold text-gray-900 block">Joined Task</span>
                              <span className="text-xs text-gray-600">Assign to multiple people</span>
                            </div>
                          </div>
                        </label>
                      </div>
                      {formData.assignmentType === 'single' && (
                        <div className="flex items-center gap-2 mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <User className="w-4 h-4 text-green-500" />
                          <p className="text-sm text-green-600 font-medium">
                            This task will be assigned to one person - visible to both you and the assignee
                          </p>
                        </div>
                      )}
                      {formData.assignmentType === 'coordinated' && (
                        <div className="flex items-center gap-2 mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <Users className="w-4 h-4 text-purple-500" />
                          <p className="text-sm text-purple-600 font-medium">
                            This task will be assigned to multiple people for coordination - visible to all assignees and you
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Assignment Section - Show all UHub account holders */}
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        {formData.assignmentType === 'coordinated'
                          ? 'Select Multiple UHub Users *'
                          : 'Assign To UHub User *'}
                      </Label>
                      
                      {formData.assignmentType === 'coordinated' ? (
                        <div className="space-y-3">
                          <div className="max-h-60 overflow-y-auto border-2 border-gray-200 rounded-xl p-3 bg-white">
                            {allUsers.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">No UHub users available</p>
                            ) : (
                              <div className="space-y-2">
                                {allUsers.map(user => {
                                  const isSelected = formData.assigned_to_multiple.includes(user.id);
                                  return (
                                    <label
                                      key={user.id}
                                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                        isSelected
                                          ? 'bg-purple-50 border-2 border-purple-300'
                                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setFormData({
                                              ...formData,
                                              assigned_to_multiple: [...formData.assigned_to_multiple, user.id],
                                              department: formData.department || user.department || formData.department
                                            });
                                          } else {
                                            setFormData({
                                              ...formData,
                                              assigned_to_multiple: formData.assigned_to_multiple.filter(id => id !== user.id)
                                            });
                                          }
                                        }}
                                        className="w-5 h-5 text-purple-600 focus:ring-purple-500 focus:ring-2 rounded"
                                      />
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">{user.full_name}</p>
                                        <p className="text-sm text-gray-500">{user.email} {user.department && `• ${user.department}`}</p>
                                      </div>
                                      {isSelected && (
                                        <CheckCircle className="w-5 h-5 text-purple-500" />
                                      )}
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          {formData.assigned_to_multiple.length > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <Users className="w-4 h-4 text-purple-500" />
                              <p className="text-sm text-purple-600 font-medium">
                                {formData.assigned_to_multiple.length} UHub user(s) selected for coordination
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            id="assigned_to"
                            value={formData.assigned_to}
                            onChange={(e) => {
                              const selectedUserId = e.target.value;
                              const selectedUser = allUsers.find(u => u.id === selectedUserId);
                              setFormData({ 
                                ...formData, 
                                assigned_to: selectedUserId,
                                department: formData.department || selectedUser?.department || formData.department
                              });
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 appearance-none cursor-pointer text-lg bg-white"
                            required={formData.assignmentType === 'single'}
                          >
                            <option value="">Select UHub User</option>
                            {allUsers.map(user => (
                              <option key={user.id} value={user.id}>
                                {user.full_name} - {user.email} {user.department && `(${user.department})`}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      )}
                      
                      {allUsers.length === 0 && (
                        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <p className="text-sm text-red-600 font-medium">
                            No UHub users found in database
                          </p>
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
                        value={formatDateTimeLocalValue(formData.due_date)}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          due_date: e.target.value ? normalizeDueDateForSave(e.target.value) : '' 
                        })}
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
                          category: 'general',
                          assignToMyself: false
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
