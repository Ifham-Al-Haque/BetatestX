import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, handleApiError } from '../services/api';

// Employee hooks
export const useEmployees = (page = 1, limit = 50, search = '') => {
  return useQuery({
    queryKey: ['employees', page, limit, search],
    queryFn: () => apiService.employees.getAll(page, limit, search),
    staleTime: 30 * 1000, // 30 seconds - reduced for more frequent updates
    keepPreviousData: true,
  });
};

export const useEmployee = (id) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => apiService.employees.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.employees.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
    },
    onError: (error) => {
      console.error('Create employee error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiService.employees.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['employees']);
      queryClient.invalidateQueries(['employee', data.id]);
    },
    onError: (error) => {
      console.error('Update employee error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.employees.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
    },
    onError: (error) => {
      console.error('Delete employee error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

// Asset hooks
export const useAssets = (page = 1, limit = 50, filters = {}) => {
  return useQuery({
    queryKey: ['assets', page, limit, filters],
    queryFn: () => apiService.assets.getAll(page, limit, filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true,
  });
};

export const useAsset = (id) => {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => apiService.assets.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.assets.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
    },
    onError: (error) => {
      console.error('Create asset error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiService.assets.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['assets']);
      queryClient.invalidateQueries(['asset', data.id]);
    },
    onError: (error) => {
      console.error('Update asset error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.assets.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
    },
    onError: (error) => {
      console.error('Delete asset error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

// Expense hooks
export const useExpenses = (page = 1, limit = 100, filters = {}) => {
  return useQuery({
    queryKey: ['expenses', page, limit, filters],
    queryFn: () => apiService.expenses.getAll(page, limit, filters),
    staleTime: 1 * 60 * 1000, // 1 minute
    keepPreviousData: true,
  });
};

export const useExpenseStats = () => {
  return useQuery({
    queryKey: ['expense-stats'],
    queryFn: apiService.expenses.getStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.expenses.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expense-stats']);
    },
    onError: (error) => {
      console.error('Create expense error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiService.expenses.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expense-stats']);
    },
    onError: (error) => {
      console.error('Update expense error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.expenses.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expense-stats']);
    },
    onError: (error) => {
      console.error('Delete expense error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

// User Profile hooks
export const useUserProfile = (userId) => {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => apiService.userProfile.get(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }) => apiService.userProfile.update(userId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['user-profile', data.id]);
    },
    onError: (error) => {
      console.error('Update user profile error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

// User Management hooks
export const useUserManagement = () => {
  return useQuery({
    queryKey: ['user-management'],
    queryFn: apiService.userManagement.getAll,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.userManagement.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['user-management']);
    },
    onError: (error) => {
      console.error('Create user error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiService.userManagement.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['user-management']);
      queryClient.invalidateQueries(['user-profile', data.id]);
    },
    onError: (error) => {
      console.error('Update user error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.userManagement.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['user-management']);
    },
    onError: (error) => {
      console.error('Delete user error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }) => apiService.userManagement.toggleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-management']);
    },
    onError: (error) => {
      console.error('Toggle user status error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

// Access Management hooks
export const useAccessRequests = () => {
  return useQuery({
    queryKey: ['access-requests'],
    queryFn: apiService.accessManagement.getRequests,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useUpdateAccessRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiService.accessManagement.updateRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['access-requests']);
    },
    onError: (error) => {
      console.error('Update access request error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

// Attendance hooks
export const useAttendance = () => {
  return useQuery({
    queryKey: ['attendance'],
    queryFn: apiService.attendance.getAll,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useAttendanceStats = () => {
  return useQuery({
    queryKey: ['attendance-stats'],
    queryFn: apiService.attendance.getStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.attendance.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance']);
      queryClient.invalidateQueries(['attendance-stats']);
    },
    onError: (error) => {
      console.error('Create attendance error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

// User Profile (users table) hooks
export const useUserProfileData = (userId) => {
  return useQuery({
    queryKey: ['user-profile-data', userId],
    queryFn: () => apiService.userProfile.getUserProfile(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateUserProfileData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }) => apiService.userProfile.updateUserProfile(userId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['user-profile-data', data.id]);
    },
    onError: (error) => {
      console.error('Update user profile data error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

// Payment Events hooks
export const usePaymentEvents = () => {
  return useQuery({
    queryKey: ['payment-events'],
    queryFn: apiService.paymentEvents.getAll,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreatePaymentEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.paymentEvents.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-events']);
    },
    onError: (error) => {
      console.error('Create payment event error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

export const useUpdatePaymentEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiService.paymentEvents.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-events']);
    },
    onError: (error) => {
      console.error('Update payment event error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

export const useDeletePaymentEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.paymentEvents.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-events']);
    },
    onError: (error) => {
      console.error('Delete payment event error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

// Driver hooks
export const useDrivers = (page = 1, limit = 50, search = '') => {
  return useQuery({
    queryKey: ['drivers', page, limit, search],
    queryFn: () => apiService.drivers.getAll(page, limit, search),
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true,
  });
};

export const useDriver = (id) => {
  return useQuery({
    queryKey: ['driver', id],
    queryFn: () => apiService.drivers.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateDriver = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.drivers.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers']);
    },
    onError: (error) => {
      console.error('Create driver error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

export const useUpdateDriver = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => apiService.drivers.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['drivers']);
      queryClient.invalidateQueries(['driver', data.id]);
    },
    onError: (error) => {
      console.error('Update driver error:', error);
      throw new Error(handleApiError(error));
    },
  });
};

export const useDeleteDriver = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiService.drivers.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['drivers']);
    },
    onError: (error) => {
      console.error('Delete driver error:', error);
      throw new Error(handleApiError(error));
    },
  });
};