import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

// Fetch all SIM cards
export const useSimCards = () => {
  return useQuery({
    queryKey: ['simCards'],
    queryFn: async () => {
      try {
        console.log('📱 Fetching SIM cards...');
        
        const { data, error } = await supabase
          .from('sim_cards')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) {
          console.error('❌ Error fetching SIM cards:', error);
          throw error;
        }

        console.log(`✅ Loaded ${data?.length || 0} SIM cards`);
        return data || [];
      } catch (error) {
        console.error('❌ Error in useSimCards:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false; // Don't retry on client errors
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

// Create a new SIM card
export const useCreateSimCard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (simCardData) => {
      console.log('📝 Attempting to create SIM card with data:', simCardData);
      
      const { data, error } = await supabase
        .from('sim_cards')
        .insert(simCardData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error creating SIM card:', error);
        throw error;
      }
      
      console.log('✅ Successfully created SIM card:', data);
      return data;
    },
    onSuccess: (newSimCard) => {
      console.log('🎉 SIM card created successfully, updating cache');
      // Update the cache
      queryClient.setQueryData(['simCards'], (oldData) => {
        return oldData ? [newSimCard, ...oldData] : [newSimCard];
      });
      
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries(['simCards']);
    },
    onError: (error) => {
      console.error('❌ Error creating SIM card:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    },
  });
};

// Update an existing SIM card
export const useUpdateSimCard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...simCardData }) => {
      const { data, error } = await supabase
        .from('sim_cards')
        .update(simCardData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedSimCard) => {
      // Update the cache
      queryClient.setQueryData(['simCards'], (oldData) => {
        return oldData ? oldData.map(simCard => 
          simCard.id === updatedSimCard.id ? updatedSimCard : simCard
        ) : [updatedSimCard];
      });
      
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries(['simCards']);
    },
    onError: (error) => {
      console.error('❌ Error updating SIM card:', error);
    },
  });
};

// Delete a SIM card
export const useDeleteSimCard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (simCardId) => {
      const { error } = await supabase
        .from('sim_cards')
        .delete()
        .eq('id', simCardId);

      if (error) throw error;
      return simCardId;
    },
    onSuccess: (deletedId) => {
      // Update the cache
      queryClient.setQueryData(['simCards'], (oldData) => {
        return oldData ? oldData.filter(simCard => simCard.id !== deletedId) : [];
      });
      
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries(['simCards']);
    },
    onError: (error) => {
      console.error('❌ Error deleting SIM card:', error);
    },
  });
};

// Get SIM card statistics
export const useSimCardStats = () => {
  return useQuery({
    queryKey: ['simCardStats'],
    queryFn: async () => {
      try {
        console.log('📊 Fetching SIM card statistics...');
        
        const { data, error } = await supabase
          .from('sim_card_stats')
          .select('*')
          .single();

        if (error) {
          console.error('❌ Error fetching SIM card stats:', error);
          throw error;
        }

        console.log('✅ Loaded SIM card statistics');
        return data;
      } catch (error) {
        console.error('❌ Error in useSimCardStats:', error);
        return {
          total_sim_cards: 0,
          active_sim_cards: 0,
          inactive_sim_cards: 0,
          suspended_sim_cards: 0,
          assigned_sim_cards: 0,
          unassigned_sim_cards: 0,
          total_monthly_cost: 0,
          expired_sim_cards: 0,
          expiring_soon: 0
        };
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

// Get SIM cards by department
export const useSimCardsByDepartment = (department) => {
  return useQuery({
    queryKey: ['simCards', 'department', department],
    queryFn: async () => {
      try {
        console.log(`📱 Fetching SIM cards for department: ${department}`);
        
        const { data, error } = await supabase
          .from('sim_cards')
          .select('*')
          .eq('department', department)
          .order('sim_number', { ascending: true });

        if (error) {
          console.error('❌ Error fetching SIM cards by department:', error);
          throw error;
        }

        console.log(`✅ Loaded ${data?.length || 0} SIM cards for ${department}`);
        return data || [];
      } catch (error) {
        console.error('❌ Error in useSimCardsByDepartment:', error);
        return [];
      }
    },
    enabled: !!department, // Only run query if department is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

// Get SIM cards assigned to an employee (by current_user name match)
export const useSimCardsByEmployeeName = (employeeFullName) => {
  return useQuery({
    queryKey: ['simCards', 'byEmployee', employeeFullName],
    queryFn: async () => {
      if (!employeeFullName || !String(employeeFullName).trim()) return [];
      const name = String(employeeFullName).trim();
      const { data, error } = await supabase
        .from('sim_cards')
        .select('*')
        .ilike('current_user', name)
        .order('sim_number', { ascending: true });

      if (error) {
        console.error('Error fetching SIM cards by employee:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!employeeFullName?.trim(),
    staleTime: 2 * 60 * 1000,
  });
};

// Search SIM cards
export const useSearchSimCards = (searchTerm) => {
  return useQuery({
    queryKey: ['simCards', 'search', searchTerm],
    queryFn: async () => {
      try {
        console.log(`🔍 Searching SIM cards for: ${searchTerm}`);
        
        const { data, error } = await supabase
          .from('sim_cards')
          .select('*')
          .or(`sim_number.ilike.%${searchTerm}%,package_name.ilike.%${searchTerm}%,current_user.ilike.%${searchTerm}%,previous_user.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%,designation.ilike.%${searchTerm}%,package_type.ilike.%${searchTerm}%,status.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error searching SIM cards:', error);
          throw error;
        }

        console.log(`✅ Found ${data?.length || 0} SIM cards matching "${searchTerm}"`);
        return data || [];
      } catch (error) {
        console.error('❌ Error in useSearchSimCards:', error);
        return [];
      }
    },
    enabled: !!searchTerm && searchTerm.length >= 2, // Only search if term is 2+ characters
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};
