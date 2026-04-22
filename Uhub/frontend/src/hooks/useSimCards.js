import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

const ASSIGNMENT_COLUMNS = ['assigned_employee_id', 'assigned_employee_name', 'assigned_employee_email'];

const extractMissingColumnName = (error) => {
  const candidates = [String(error?.message || ''), String(error?.details || '')];
  const patterns = [
    /could not find the '([^']+)' column/i,
    /column ["']?([^"'\s]+)["']? does not exist/i,
  ];

  for (const text of candidates) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) return match[1];
    }
  }
  return null;
};

const runSimCardMutationWithMissingColumnFallback = async ({
  mutate,
  payload,
  retryColumns = [],
}) => {
  let currentPayload = { ...payload };
  const attemptedColumns = new Set();

  while (true) {
    const { data, error } = await mutate(currentPayload);
    if (!error) return data;

    const missingColumn = extractMissingColumnName(error);
    const canRetry =
      missingColumn &&
      retryColumns.includes(missingColumn) &&
      Object.prototype.hasOwnProperty.call(currentPayload, missingColumn) &&
      !attemptedColumns.has(missingColumn);

    if (!canRetry) throw error;

    attemptedColumns.add(missingColumn);
    const nextPayload = { ...currentPayload };
    delete nextPayload[missingColumn];
    currentPayload = nextPayload;
  }
};

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
      let data;
      try {
        data = await runSimCardMutationWithMissingColumnFallback({
          mutate: (payload) =>
            supabase
              .from('sim_cards')
              .insert(payload)
              .select()
              .single(),
          payload: simCardData,
          retryColumns: ASSIGNMENT_COLUMNS,
        });
      } catch (error) {
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
      const data = await runSimCardMutationWithMissingColumnFallback({
        mutate: (payload) =>
          supabase
            .from('sim_cards')
            .update(payload)
            .eq('id', id)
            .select()
            .single(),
        payload: simCardData,
        retryColumns: ASSIGNMENT_COLUMNS,
      });
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

// Get single SIM card by ID for profile/details screen
export const useSimCardById = (id) => {
  return useQuery({
    queryKey: ['simCard', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('sim_cards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
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
      const fullName = String(employeeFullName).trim();
      const normalize = (s) =>
        String(s || '')
          .trim()
          .replace(/\s+/g, ' ')
          .toLowerCase();

      const tokens = normalize(fullName).split(' ').filter(Boolean);
      const safeLike = (s) => String(s).replace(/%/g, '\\%');

      // Build name variants to handle SIM panel using shortened names:
      // - Full name
      // - First + last (common)
      // - First + second (common)
      // - First only (last resort)
      const variants = [];
      const pushVariant = (v) => {
        const nv = normalize(v);
        if (!nv) return;
        if (!variants.includes(nv)) variants.push(nv);
      };
      pushVariant(fullName);
      if (tokens.length >= 2) {
        pushVariant(`${tokens[0]} ${tokens[tokens.length - 1]}`); // first + last
        pushVariant(`${tokens[0]} ${tokens[1]}`); // first + second
      }
      if (tokens.length >= 1) pushVariant(tokens[0]); // first only

      // Query with OR contains matches for each variant, then filter client-side for
      // equality against any normalized variant (prevents false positives).
      const orParts = variants.map((v) => `current_user.ilike.%${safeLike(v)}%`);
      const { data, error } = await supabase
        .from('sim_cards')
        .select('*')
        .or(orParts.join(','))
        .order('sim_number', { ascending: true });

      if (error) {
        console.error('Error fetching SIM cards by employee:', error);
        throw error;
      }
      const rows = data || [];
      const set = new Set(variants);
      const matched = rows.filter((r) => set.has(normalize(r.current_user)));

      // De-duplicate by SIM id (in case multiple variants matched same record)
      const seen = new Set();
      return matched.filter((r) => {
        const key = r?.id ?? `${r?.sim_number ?? ''}-${r?.package_name ?? ''}-${r?.created_at ?? ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    enabled: !!employeeFullName?.trim(),
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Get SIM cards assigned to an employee using multiple identifiers.
 *
 * Why: many records store `current_user` as free text (name, employee_id, email, or "Name (ID)").
 * This hook matches by:
 * - `current_user` contains full name (case-insensitive)
 * - OR equals/contains employee_id
 * - OR equals/contains email
 */
export const useSimCardsByEmployeeIdentifiers = ({ full_name, employee_id, email } = {}) => {
  const normalized = {
    name: (full_name ? String(full_name) : '').trim(),
    empId: (employee_id ? String(employee_id) : '').trim(),
    email: (email ? String(email) : '').trim(),
  };

  const enabled = Boolean(normalized.name || normalized.empId || normalized.email);
  const queryKey = ['simCards', 'byEmployeeIdentifiers', normalized.name, normalized.empId, normalized.email];

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!enabled) return [];

      // Build OR filters. Use "contains" matching to handle "Name (ID)" / extra details.
      const orParts = [];
      if (normalized.name) {
        const safe = normalized.name.replace(/%/g, '\\%');
        orParts.push(`current_user.ilike.%${safe}%`);
      }
      if (normalized.empId) {
        const safe = normalized.empId.replace(/%/g, '\\%');
        orParts.push(`current_user.ilike.%${safe}%`);
      }
      if (normalized.email) {
        const safe = normalized.email.replace(/%/g, '\\%');
        orParts.push(`current_user.ilike.%${safe}%`);
      }

      // Fallback: if we somehow have no parts, don't query.
      if (orParts.length === 0) return [];

      const { data, error } = await supabase
        .from('sim_cards')
        .select('*')
        .or(orParts.join(','))
        .order('sim_number', { ascending: true });

      if (error) {
        console.error('Error fetching SIM cards by employee identifiers:', error);
        throw error;
      }

      return data || [];
    },
    enabled,
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
