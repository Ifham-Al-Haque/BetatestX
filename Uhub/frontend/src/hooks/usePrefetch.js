import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { taskApi } from '../services/taskApi';
import { itServicesApi } from '../services/itServicesApiFixed';
import collectionService from '../services/collectionService';
import { supabase } from '../supabaseClient';
import { apiService } from '../services/api';

/**
 * Custom hook for prefetching data based on routes
 * Provides prefetching functions for common navigation paths
 */
export const usePrefetch = () => {
  const queryClient = useQueryClient();
  const { user, userProfile } = useAuth();

  /**
   * Prefetch tasks data
   */
  const prefetchTasks = async (filters = {}, activeTab = 'all') => {
    if (!user?.id) return;

    try {
      await queryClient.prefetchQuery({
        queryKey: ['tasks', filters, activeTab],
        queryFn: async () => {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) return { data: [], commentsMap: {} };

          const tasksResponse = await taskApi.getAll(filters, 1, 100);
          if (!tasksResponse || !tasksResponse.data) {
            return { data: [], commentsMap: {} };
          }

          const commentsMap = {};
          await Promise.all(
            tasksResponse.data.slice(0, 10).map(async (task) => {
              try {
                const comments = await taskApi.getComments(task.id);
                commentsMap[task.id] = comments || [];
              } catch (error) {
                commentsMap[task.id] = [];
              }
            })
          );

          return { data: tasksResponse.data, commentsMap };
        },
        staleTime: 2 * 60 * 1000,
      });
    } catch (error) {
      console.warn('Failed to prefetch tasks:', error);
    }
  };

  /**
   * Prefetch task stats
   */
  const prefetchTaskStats = async () => {
    if (!user?.id) return;

    try {
      await queryClient.prefetchQuery({
        queryKey: ['taskStats', user.id],
        queryFn: async () => {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) {
            return { total: 0, myTasks: 0, assignedByMe: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 };
          }
          return await taskApi.getStats();
        },
        staleTime: 1 * 60 * 1000,
      });
    } catch (error) {
      console.warn('Failed to prefetch task stats:', error);
    }
  };

  /**
   * Prefetch IT requests data
   */
  const prefetchITRequests = async (filters = {}) => {
    if (!user?.id) return;

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Prefetch requests, categories, and priorities
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['itRequests', filters, authUser.id, userProfile?.role],
          queryFn: async () => {
            const requestsData = await itServicesApi.requests.getAll(
              filters,
              authUser.id,
              userProfile?.role
            );
            return Array.isArray(requestsData) ? requestsData : [];
          },
          staleTime: 2 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ['itCategories'],
          queryFn: () => itServicesApi.categories.getAll(),
          staleTime: 10 * 60 * 1000, // Categories don't change often
        }),
        queryClient.prefetchQuery({
          queryKey: ['itPriorities'],
          queryFn: () => itServicesApi.priorities.getAll(),
          staleTime: 10 * 60 * 1000, // Priorities don't change often
        }),
      ]);
    } catch (error) {
      console.warn('Failed to prefetch IT requests:', error);
    }
  };

  /**
   * Prefetch collections data
   */
  const prefetchCollections = async () => {
    if (!user?.id) return;

    try {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['collections', 'payments'],
          queryFn: () => collectionService.getAllPayments({}),
          staleTime: 2 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ['collections', 'reminders'],
          queryFn: () => collectionService.getAllReminders(),
          staleTime: 2 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ['collections', 'checklist'],
          queryFn: () => collectionService.getAllChecklistItems(),
          staleTime: 2 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ['collections', 'paymentStats'],
          queryFn: () => collectionService.getPaymentStats(),
          staleTime: 1 * 60 * 1000,
        }),
      ]);
    } catch (error) {
      console.warn('Failed to prefetch collections:', error);
    }
  };

  /**
   * Prefetch employees data
   */
  const prefetchEmployees = async () => {
    if (!user?.id) return;

    try {
      await queryClient.prefetchQuery({
        queryKey: ['employees', 1, 50, ''],
        queryFn: () => apiService.employees.getAll(1, 50, ''),
        staleTime: 5 * 60 * 1000,
      });
    } catch (error) {
      console.warn('Failed to prefetch employees:', error);
    }
  };

  /**
   * Prefetch assets data
   */
  const prefetchAssets = async () => {
    if (!user?.id) return;

    try {
      await queryClient.prefetchQuery({
        queryKey: ['assets'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('assets')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          if (error) throw error;
          return data || [];
        },
        staleTime: 5 * 60 * 1000,
      });
    } catch (error) {
      console.warn('Failed to prefetch assets:', error);
    }
  };

  /**
   * Prefetch dashboard data
   */
  const prefetchDashboard = async () => {
    if (!user?.id) return;

    try {
      await Promise.all([
        prefetchTaskStats(),
        prefetchTasks({}, 'all'),
        queryClient.prefetchQuery({
          queryKey: ['dashboard', 'stats', user.id],
          queryFn: async () => {
            // Prefetch common dashboard stats
            return {
              tasks: await taskApi.getStats(),
            };
          },
          staleTime: 1 * 60 * 1000,
        }),
      ]);
    } catch (error) {
      console.warn('Failed to prefetch dashboard:', error);
    }
  };

  /**
   * Route-based prefetching map
   * Maps routes to their prefetch functions
   * Supports both exact matches and pattern matching
   */
  const routePrefetchMap = {
    // Exact route matches
    '/task-management': () => Promise.all([prefetchTasks({}, 'all'), prefetchTaskStats()]),
    '/tasks': () => Promise.all([prefetchTasks({}, 'all'), prefetchTaskStats()]),
    '/it-requests': () => prefetchITRequests({}),
    '/request-inbox': () => prefetchITRequests({}),
    '/collections': () => prefetchCollections(),
    '/employees': () => prefetchEmployees(),
    '/assets': () => prefetchAssets(),
    '/dashboard': () => prefetchDashboard(),
    '/admin/dashboard': () => prefetchDashboard(),
  };

  /**
   * Route patterns for dynamic routes
   * These are checked if exact match fails
   */
  const routePatterns = [
    { pattern: /^\/employee\/[^/]+$/, prefetchFn: () => prefetchEmployees() },
    { pattern: /^\/employee\/[^/]+\/edit$/, prefetchFn: () => prefetchEmployees() },
    { pattern: /^\/driver\/[^/]+$/, prefetchFn: () => Promise.resolve() }, // No specific prefetch for driver details
    { pattern: /^\/driver\/[^/]+\/edit$/, prefetchFn: () => Promise.resolve() },
    { pattern: /^\/assets\/[^/]+$/, prefetchFn: () => prefetchAssets() },
    { pattern: /^\/assets\/[^/]+\/edit$/, prefetchFn: () => prefetchAssets() },
  ];

  /**
   * Prefetch data for a specific route
   * Handles both exact matches and pattern matching for dynamic routes
   */
  const prefetchRoute = async (pathname) => {
    // Check if user is authenticated
    if (!user?.id) {
      return;
    }

    try {
      // First, try exact match
      const exactMatch = routePrefetchMap[pathname];
      if (exactMatch) {
        await exactMatch();
        return;
      }

      // If no exact match, try pattern matching
      for (const { pattern, prefetchFn } of routePatterns) {
        if (pattern.test(pathname)) {
          await prefetchFn();
          return;
        }
      }
    } catch (error) {
      console.warn(`Failed to prefetch route ${pathname}:`, error);
      // Don't throw - prefetch failures shouldn't break the app
    }
  };

  return {
    prefetchTasks,
    prefetchTaskStats,
    prefetchITRequests,
    prefetchCollections,
    prefetchEmployees,
    prefetchAssets,
    prefetchDashboard,
    prefetchRoute,
  };
};

