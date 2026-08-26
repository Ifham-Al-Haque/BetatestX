import { supabase } from '../supabaseClient';

const isMissingExpenseBreakdownsTable = (error) =>
  error?.code === '42P01' ||
  error?.code === 'PGRST205' ||
  error?.code === '22P02' ||
  error?.code === '42703' ||
  /expense_breakdowns.*(?:does not exist|schema cache|could not find)/i.test(error?.message || '') ||
  /invalid input syntax for type uuid/i.test(error?.message || '');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const normalizeExpenseId = (id) => {
  if (id == null || id === '') return null;
  const asString = String(id).trim();
  return UUID_RE.test(asString) ? asString : null;
};

const fetchExpenseBreakdowns = async (expenseIds = []) => {
  const ids = [...new Set(expenseIds.map(normalizeExpenseId).filter(Boolean))];
  if (!ids.length) return new Map();

  const grouped = new Map();
  const batchSize = 100;

  for (let start = 0; start < ids.length; start += batchSize) {
    const batch = ids.slice(start, start + batchSize);
    const { data, error } = await supabase
      .from('expense_breakdowns')
      .select('id, expense_id, label, amount, notes, sort_order, created_at, updated_at')
      .in('expense_id', batch)
      .order('sort_order', { ascending: true });

    if (error) {
      // Keep Expense Tracker usable when optional breakdown schema is missing or mismatched.
      if (isMissingExpenseBreakdownsTable(error)) return new Map();
      throw error;
    }

    (data || []).forEach((item) => {
      const key = normalizeExpenseId(item.expense_id) ?? item.expense_id;
      const list = grouped.get(key) || [];
      list.push(item);
      grouped.set(key, list);
    });
  }

  return grouped;
};

const normalizeExpenseBreakdowns = (expenseId, breakdowns = []) =>
  breakdowns
    .map((item, index) => ({
      ...(item.id ? { id: item.id } : {}),
      expense_id: expenseId,
      label: String(item.label || '').trim(),
      amount: Number(item.amount),
      notes: String(item.notes || '').trim() || null,
      sort_order: index,
      updated_at: new Date().toISOString(),
    }))
    .filter((item) => item.label && Number.isFinite(item.amount) && item.amount !== 0);

const saveExpenseBreakdowns = async (expenseId, breakdowns) => {
  if (!Array.isArray(breakdowns)) return null;

  const normalized = normalizeExpenseBreakdowns(expenseId, breakdowns);
  const retainedIds = normalized.filter((item) => item.id).map((item) => item.id);
  const existingRows = normalized.filter((item) => item.id);
  const newRows = normalized.filter((item) => !item.id);

  const { data: previousRows, error: previousError } = await supabase
    .from('expense_breakdowns')
    .select('id')
    .eq('expense_id', expenseId);
  if (previousError) {
    if (isMissingExpenseBreakdownsTable(previousError)) return [];
    throw previousError;
  }

  if (existingRows.length) {
    const { error } = await supabase
      .from('expense_breakdowns')
      .upsert(existingRows, { onConflict: 'id' });
    if (error) throw error;
  }

  if (newRows.length) {
    const { error } = await supabase.from('expense_breakdowns').insert(newRows);
    if (error) throw error;
  }

  const staleIds = (previousRows || [])
    .map((row) => row.id)
    .filter((id) => !retainedIds.includes(id));

  if (staleIds.length) {
    const { error } = await supabase
      .from('expense_breakdowns')
      .delete()
      .eq('expense_id', expenseId)
      .in('id', staleIds);
    if (error) throw error;
  }

  const grouped = await fetchExpenseBreakdowns([expenseId]);
  const key = normalizeExpenseId(expenseId) ?? expenseId;
  return grouped.get(key) || [];
};

// API Service Layer for centralized data fetching
export const apiService = {
  // Employee APIs
  employees: {
    getAll: async (page = 1, limit = 50, search = '', filters = {}, includeArchived = false) => {
      // Backward compatibility: previous signature used 4th arg as includeArchived boolean.
      const resolvedFilters = typeof filters === 'boolean' ? {} : (filters || {});
      const resolvedIncludeArchived = typeof filters === 'boolean' ? filters : includeArchived;
      const allowedSortKeys = new Set([
        'full_name',
        'department',
        'position',
        'hire_date',
        'performance_rating',
        'created_at',
      ]);
      const sortKey = allowedSortKeys.has(resolvedFilters.sortKey)
        ? resolvedFilters.sortKey
        : 'full_name';
      const sortAscending = resolvedFilters.sortOrder !== 'desc';

      const applyListFilters = (baseQuery) => {
        let filteredQuery = baseQuery;

        if (!resolvedIncludeArchived) {
          filteredQuery = filteredQuery.eq('is_archived', false);
        }

        if (search) {
          const safeSearch = String(search).replace(/[,%()]/g, ' ').trim();
          if (safeSearch) {
            filteredQuery = filteredQuery.or(
              `full_name.ilike.*${safeSearch}*,department.ilike.*${safeSearch}*,position.ilike.*${safeSearch}*,designation.ilike.*${safeSearch}*,employee_id.ilike.*${safeSearch}*,email.ilike.*${safeSearch}*,phone.ilike.*${safeSearch}*,location.ilike.*${safeSearch}*`
            );
          }
        }

        if (resolvedFilters.department) {
          filteredQuery = filteredQuery.eq('department', resolvedFilters.department);
        }

        if (resolvedFilters.location) {
          filteredQuery = filteredQuery.eq('location', resolvedFilters.location);
        }

        if (resolvedFilters.performance === 'excellent') {
          filteredQuery = filteredQuery.gte('performance_rating', 4.5);
        } else if (resolvedFilters.performance === 'good') {
          filteredQuery = filteredQuery.gte('performance_rating', 3.5).lt('performance_rating', 4.5);
        } else if (resolvedFilters.performance === 'average') {
          filteredQuery = filteredQuery.gte('performance_rating', 2.5).lt('performance_rating', 3.5);
        } else if (resolvedFilters.performance === 'needs_improvement') {
          filteredQuery = filteredQuery.or('performance_rating.lt.2.5,performance_rating.is.null');
        }

        if (resolvedFilters.employment === 'active') {
          filteredQuery = filteredQuery
            .is('termination_date', null)
            .or('status.neq.inactive,status.is.null');
        } else if (resolvedFilters.employment === 'inactive') {
          filteredQuery = filteredQuery.or('status.eq.inactive,termination_date.not.is.null');
        } else if (resolvedFilters.employment === 'pending') {
          filteredQuery = filteredQuery.eq('status', 'pending');
        }

        return filteredQuery;
      };

      let query = supabase
        .from('employees')
        .select(`
          id,
          full_name,
          employee_id,
          department,
          position,
          designation,
          email,
          phone,
          location,
          hire_date,
          profile_picture,
          photo_url,
          created_at,
          performance_rating,
          termination_date,
          is_archived,
          archived_at,
          status,
          reporting_manager:reporting_manager_id (
            full_name,
            employee_id
          )
        `)
        .order(sortKey, { ascending: sortAscending, nullsFirst: false });

      query = applyListFilters(query);

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      // First get the total count
      let countQuery = supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      countQuery = applyListFilters(countQuery);

      const { count: totalCount, error: countError } = await countQuery;
      if (countError) throw countError;

      // Then get the paginated data
      const { data, error } = await query.range(from, to);
      
      if (error) throw error;
      
      return { data, count: totalCount };
    },

    getSummaryStats: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('department, performance_rating, status, termination_date')
        .eq('is_archived', false);

      if (error) throw error;

      const rows = data || [];
      const departmentBreakdown = rows.reduce((acc, row) => {
        const dept = row.department?.trim() || 'Unassigned';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});

      return {
        total: rows.length,
        highPerformers: rows.filter((e) => (e.performance_rating || 0) >= 4.5).length,
        active: rows.filter(
          (e) =>
            !e.termination_date &&
            String(e.status || 'active').toLowerCase() !== 'inactive'
        ).length,
        departments: Object.keys(departmentBreakdown).length,
        departmentBreakdown,
      };
    },

    getDistinctFieldValues: async (field, includeArchived = false) => {
      let query = supabase
        .from('employees')
        .select(field)
        .not(field, 'is', null);

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      return [...new Set((data || []).map((row) => row[field]).filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b))
      );
    },

    exportData: async (search = '', filters = {}) => {
      const resolvedFilters = filters || {};
      let query = supabase
        .from('employees')
        .select(`
          full_name,
          employee_id,
          email,
          phone,
          department,
          position,
          designation,
          location,
          hire_date,
          status,
          performance_rating,
          termination_date
        `)
        .eq('is_archived', false)
        .order('full_name', { ascending: true });

      if (search) {
        const safeSearch = String(search).replace(/[,%()]/g, ' ').trim();
        if (safeSearch) {
          query = query.or(
            `full_name.ilike.*${safeSearch}*,department.ilike.*${safeSearch}*,position.ilike.*${safeSearch}*,designation.ilike.*${safeSearch}*,employee_id.ilike.*${safeSearch}*,email.ilike.*${safeSearch}*,phone.ilike.*${safeSearch}*,location.ilike.*${safeSearch}*`
          );
        }
      }

      if (resolvedFilters.department) {
        query = query.eq('department', resolvedFilters.department);
      }

      if (resolvedFilters.location) {
        query = query.eq('location', resolvedFilters.location);
      }

      if (resolvedFilters.performance === 'excellent') {
        query = query.gte('performance_rating', 4.5);
      } else if (resolvedFilters.performance === 'good') {
        query = query.gte('performance_rating', 3.5).lt('performance_rating', 4.5);
      } else if (resolvedFilters.performance === 'average') {
        query = query.gte('performance_rating', 2.5).lt('performance_rating', 3.5);
      } else if (resolvedFilters.performance === 'needs_improvement') {
        query = query.or('performance_rating.lt.2.5,performance_rating.is.null');
      }

      if (resolvedFilters.employment === 'active') {
        query = query
          .is('termination_date', null)
          .or('status.neq.inactive,status.is.null');
      } else if (resolvedFilters.employment === 'inactive') {
        query = query.or('status.eq.inactive,termination_date.not.is.null');
      } else if (resolvedFilters.employment === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    // Get only archived employees
    getArchived: async (page = 1, limit = 50, search = '') => {
      let query = supabase
        .from('employees')
        .select(`
          id,
          full_name,
          employee_id,
          department,
          position,
          email,
          phone,
          location,
          hire_date,
          profile_picture,
          photo_url,
          created_at,
          performance_rating,
          termination_date,
          is_archived,
          archived_at,
          archived_by,
          status,
          reporting_manager:reporting_manager_id (
            full_name,
            employee_id
          )
        `)
        .eq('is_archived', true)
        .order('archived_at', { ascending: false });

      if (search) {
        query = query.or(`full_name.ilike.*${search}*,department.ilike.*${search}*,position.ilike.*${search}*,employee_id.ilike.*${search}*,phone.ilike.*${search}*,location.ilike.*${search}*`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      // Get total count
      let countQuery = supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', true);
      
      if (search) {
        countQuery = countQuery.or(`full_name.ilike.*${search}*,department.ilike.*${search}*,position.ilike.*${search}*,employee_id.ilike.*${search}*,phone.ilike.*${search}*,location.ilike.*${search}*`);
      }
      
      const { count: totalCount } = await countQuery;

      const { data, error } = await query.range(from, to);
      
      if (error) throw error;
      
      return { data, count: totalCount };
    },

    // Archive an employee
    archive: async (id) => {
      const { data: user } = await supabase.auth.getUser();
      const archivedBy = user?.user?.id || null;

      const { data, error } = await supabase
        .from('employees')
        .update({
          is_archived: true,
          archived_at: new Date().toISOString(),
          archived_by: archivedBy,
          status: 'terminated',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Unarchive an employee
    unarchive: async (id) => {
      const { data, error } = await supabase
        .from('employees')
        .update({
          is_archived: false,
          archived_at: null,
          archived_by: null,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          reporting_manager:reporting_manager_id (
            full_name,
            employee_id
          ),
          assets (
            id,
            name,
            type,
            status
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    create: async (employeeData) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(employeeData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id, employeeData) => {
      // Clear any existing profile picture if it's being set to null
      if (employeeData.profile_picture === null || employeeData.photo_url === null) {
        // Force a cache invalidation for this employee
        employeeData.updated_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },

  // Asset APIs
  assets: {
    getAll: async (page = 1, limit = 50, filters = {}) => {
      let query = supabase
        .from('assets')
        .select(`
          id, 
          name, 
          type, 
          status, 
          created_at, 
          assigned_to,
          asset_code,
          lpo_number,
          purchase_price,
          purchase_date,
          supplier,
          asset_picture_url,
          assigned_employee:assigned_to (
            id,
            full_name,
            employee_id
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
      if (filters.search) {
        const search = String(filters.search).trim();
        const isNumeric = /^\d+(\.\d+)?$/.test(search);

        // Build OR conditions across base columns
        let orConditions =
          `name.ilike.*${search}*` +
          `,type.ilike.*${search}*` +
          `,asset_code.ilike.*${search}*` +
          `,lpo_number.ilike.*${search}*` +
          `,supplier.ilike.*${search}*`;

        // Numeric search: match purchase_price exactly (cannot ilike numeric)
        if (isNumeric) {
          orConditions += `,purchase_price.eq.${search}`;
        }

        // Date-like search: allow exact match on purchase_date when ISO-like
        if (/^\d{4}-\d{2}-\d{2}$/.test(search)) {
          orConditions += `,purchase_date.eq.${search}`;
        }

        // Also match by assignee name or employee_id: find employees then OR with assigned_to IN (ids)
        const { data: matchingEmployees, error: empErr } = await supabase
          .from('employees')
          .select('id')
          .or(`full_name.ilike.%${search}%,employee_id.ilike.%${search}%`);

        if (!empErr && Array.isArray(matchingEmployees) && matchingEmployees.length > 0) {
          const idList = matchingEmployees
            .map((e) => (e && e.id !== undefined && e.id !== null ? `"${e.id}"` : null))
            .filter((v) => v !== null)
            .join(',');
          if (idList) {
            orConditions += `,assigned_to.in.(${idList})`;
          }
        }

        query = query.or(orConditions);
      }

      const allowedSortColumns = ['created_at', 'name', 'purchase_price', 'status', 'type'];
      const sortBy = allowedSortColumns.includes(filters.sortBy) ? filters.sortBy : 'created_at';
      const ascending = filters.sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query.range(from, to);
      
      if (error) throw error;

      return { data, count };
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          id,
          name,
          type,
          status,
          created_at,
          assigned_to,
          asset_code,
          lpo_number,
          purchase_price,
          purchase_date,
          supplier,
          asset_picture_url,
          assigned_employee:assigned_to (
            id,
            full_name,
            employee_id
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    create: async (assetData) => {
      const { data, error } = await supabase
        .from('assets')
        .insert(assetData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id, assetData) => {
      const { data, error } = await supabase
        .from('assets')
        .update(assetData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },

    getStats: async () => {
      const { data: allAssets, error } = await supabase
        .from('assets')
        .select('status, type, purchase_price, purchase_date');

      if (error) throw error;

      const rows = allAssets || [];
      const typeBreakdown = rows.reduce((acc, asset) => {
        const type = asset.type?.trim() || 'Other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const warrantyExpiringSoon = rows.filter((asset) => {
        if (!asset.purchase_date) return false;
        const purchaseDate = new Date(asset.purchase_date);
        const warrantyEnd = new Date(purchaseDate);
        warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 3);
        const msLeft = warrantyEnd.getTime() - now;
        return msLeft > 0 && msLeft <= thirtyDaysMs;
      }).length;

      return {
        total: rows.length,
        inStock: rows.filter((asset) => asset.status === 'In Stock').length,
        assigned: rows.filter((asset) => asset.status === 'Assigned').length,
        maintenance: rows.filter((asset) => asset.status === 'Maintenance').length,
        retired: rows.filter((asset) => asset.status === 'Retired').length,
        totalValue: rows.reduce((sum, asset) => sum + (parseFloat(asset.purchase_price) || 0), 0),
        typeBreakdown,
        warrantyExpiringSoon,
      };
    },

    exportData: async (filters = {}) => {
      let query = supabase
        .from('assets')
        .select(`
          id,
          name,
          type,
          status,
          created_at,
          assigned_to,
          asset_code,
          lpo_number,
          purchase_price,
          purchase_date,
          supplier,
          asset_picture_url,
          assigned_employee:assigned_to (
            full_name,
            employee_id
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);

      if (filters.search) {
        const search = String(filters.search).trim();
        const isNumeric = /^\d+(\.\d+)?$/.test(search);
        let orConditions =
          `name.ilike.*${search}*` +
          `,type.ilike.*${search}*` +
          `,asset_code.ilike.*${search}*` +
          `,lpo_number.ilike.*${search}*` +
          `,supplier.ilike.*${search}*`;
        if (isNumeric) orConditions += `,purchase_price.eq.${search}`;
        if (/^\d{4}-\d{2}-\d{2}$/.test(search)) orConditions += `,purchase_date.eq.${search}`;

        const { data: matchingEmployees, error: empErr } = await supabase
          .from('employees')
          .select('id')
          .or(`full_name.ilike.%${search}%,employee_id.ilike.%${search}%`);

        if (!empErr && Array.isArray(matchingEmployees) && matchingEmployees.length > 0) {
          const idList = matchingEmployees
            .map((e) => (e?.id != null ? `"${e.id}"` : null))
            .filter(Boolean)
            .join(',');
          if (idList) orConditions += `,assigned_to.in.(${idList})`;
        }

        query = query.or(orConditions);
      }

      const { data, error } = await query.limit(10000);
      if (error) throw error;

      return (data || []).map((asset) => ({
        name: asset.name || '',
        type: asset.type || '',
        status: asset.status || '',
        asset_code: asset.asset_code || '',
        assigned_employee: asset.assigned_employee?.full_name || '',
        employee_id: asset.assigned_employee?.employee_id || '',
        purchase_price: asset.purchase_price ?? '',
        purchase_date: asset.purchase_date || '',
        supplier: asset.supplier || '',
        lpo_number: asset.lpo_number || '',
        created_at: asset.created_at || '',
      }));
    },
  },

  // Expense APIs
  expenses: {
    getAll: async (page = 1, limit = 100, filters = {}) => {
      let query = supabase
        .from('expenses')
        .select('*', { count: 'exact' })
        .order('date_paid', { ascending: false });

      // Apply filters
      if (filters.department) query = query.eq('department', filters.department);
      if (filters.year) {
        const startDate = `${filters.year}-01-01`;
        const endDate = `${filters.year}-12-31`;
        query = query.gte('date_paid', startDate).lte('date_paid', endDate);
      }
      if (filters.startDate) query = query.gte('date_paid', filters.startDate);
      if (filters.endDate) query = query.lte('date_paid', filters.endDate);
      if (filters.userId) query = query.eq('user_id', filters.userId);

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      const breakdownsByExpense = await fetchExpenseBreakdowns(
        (data || []).map((expense) => expense.id)
      );
      const expensesWithBreakdowns = (data || []).map((expense) => ({
        ...expense,
        breakdowns: breakdownsByExpense.get(normalizeExpenseId(expense.id) ?? expense.id) || [],
      }));

      return { data: expensesWithBreakdowns, count };
    },

    fetchAll: async function fetchAllExpenses(filters = {}) {
      const limit = 1000;
      let page = 1;
      const all = [];

      while (true) {
        const { data, count } = await this.getAll(page, limit, filters);
        if (data?.length) all.push(...data);
        if (!data?.length || data.length < limit) break;
        if (count != null && all.length >= count) break;
        page += 1;
      }

      return all;
    },

    getStats: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('amount_aed, date_paid, department, service_name');

      if (error) throw error;
      return data;
    },

    create: async (expenseData) => {
      const { breakdowns, ...parentExpense } = expenseData;
      const { data, error } = await supabase
        .from('expenses')
        .insert(parentExpense)
        .select()
        .single();

      if (error) throw error;

      let savedBreakdowns = [];
      if (Array.isArray(breakdowns) && breakdowns.length) {
        try {
          savedBreakdowns = await saveExpenseBreakdowns(data.id, breakdowns);
        } catch (breakdownError) {
          // Avoid leaving a parent record behind when its requested breakdown fails.
          await supabase.from('expenses').delete().eq('id', data.id);
          throw breakdownError;
        }
      }

      return { ...data, breakdowns: savedBreakdowns };
    },

    update: async (id, expenseData) => {
      const { breakdowns, ...parentExpense } = expenseData;
      const { data, error } = await supabase
        .from('expenses')
        .update(parentExpense)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const savedBreakdowns = Array.isArray(breakdowns)
        ? await saveExpenseBreakdowns(id, breakdowns)
        : null;

      return {
        ...data,
        breakdowns: savedBreakdowns ?? expenseData.breakdowns ?? [],
      };
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },

  // User Profile APIs
  userProfile: {
    get: async (userId) => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    },

    update: async (userId, profileData) => {
      const { data, error } = await supabase
        .from('employees')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // For UserProfile page that uses 'users' table
    getUserProfile: async (userId) => {
      try {
        // Get current user's email from Supabase Auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser || !authUser.email) {
          throw new Error("No auth user or email found");
        }
        
        // Try to get user profile from the users table by email
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          return data;
        }
        
        // If no user found, create a default user profile
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: authUser.email,
            auth_user_id: userId,
            role: 'employee', // Default role
            status: 'active',
            full_name: authUser.email.split('@')[0],
            department: 'Unassigned',
            position: 'Employee'
          })
          .select()
          .single();
        
        if (createError) throw createError;
        return newUser;
        
      } catch (error) {
        console.error("Error in getUserProfile:", error);
        throw error;
      }
    },

    updateUserProfile: async (userId, profileData) => {
      try {
        // Get current user's email from Supabase Auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser || !authUser.email) {
          throw new Error("No auth user or email found");
        }
        
        // Check if user exists
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', authUser.email)
          .maybeSingle();
        
        if (checkError) throw checkError;
        
        let result;
        
        if (existingUser) {
          // Update existing user
          const { data, error } = await supabase
            .from('users')
            .update({
              ...profileData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id)
            .select()
            .single();
          
          if (error) throw error;
          result = data;
        } else {
          // Create new user if doesn't exist
          const { data, error } = await supabase
            .from('users')
            .insert({
              email: authUser.email,
              auth_user_id: userId,
              ...profileData,
              role: profileData.role || 'employee',
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (error) throw error;
          result = data;
        }
        
        return result;
        
      } catch (error) {
        console.error("Error in updateUserProfile:", error);
        throw error;
      }
    }
  },

  // User Management APIs
  userManagement: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Backfill last_login from activity logs when the column was never updated
      const lastLoginByEmail = {};
      try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 180);

        const { data: loginActivity } = await supabase
          .from('activity_logs')
          .select('user_email, created_at')
          .in('action', ['login', 'session_start'])
          .not('user_email', 'is', null)
          .gte('created_at', cutoff.toISOString())
          .order('created_at', { ascending: false });

        (loginActivity || []).forEach((log) => {
          const email = log.user_email?.trim().toLowerCase();
          if (email && !lastLoginByEmail[email]) {
            lastLoginByEmail[email] = log.created_at;
          }
        });
      } catch (activityError) {
        console.warn('Could not load last login from activity logs:', activityError);
      }
      
      // Ensure ALL users have the same structure with default values
      return data.map(user => ({
        // Required fields with fallbacks
        id: user.id || null,
        email: user.email || '',
        role: user.role || 'employee',
        status: user.status || 'active',
        
        // Optional fields with consistent defaults
        full_name: user.full_name || user.email || 'N/A',
        department: user.department || 'N/A',
        position: user.position || 'N/A',
        phone: user.phone || 'N/A',
        location: user.location || 'N/A',
        
        // Timestamps
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || new Date().toISOString(),
        
        // Auth-related fields
        auth_user_id: user.auth_user_id || null,
        employee_id: user.employee_id || null,
        
        // Additional fields that might be expected
        is_active: user.status === 'active',
        // Prefer the most recent timestamp from users.last_login or activity logs
        last_login: (() => {
          const fromDb = user.last_login;
          const fromLogs = lastLoginByEmail[user.email?.trim().toLowerCase()];
          if (!fromDb) return fromLogs || null;
          if (!fromLogs) return fromDb;
          return new Date(fromDb) >= new Date(fromLogs) ? fromDb : fromLogs;
        })(),
        permissions: user.permissions || []
      }));
    },

          create: async (userData) => {
        console.log('🚀 Starting user creation process...');
        
        try {
          let authUserId = null;

                // If password is provided, create the auth user first
        if (userData.password) {
          try {
            console.log('🔐 Creating auth user for:', userData.email);
            
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
              email: userData.email,
              password: userData.password,
              options: {
                data: {
                  full_name: userData.email.split('@')[0]
                }
              }
            });

            if (signUpError) {
              console.error('❌ Auth signup failed:', signUpError);
              console.error('❌ Error details:', {
                message: signUpError.message,
                status: signUpError.status,
                name: signUpError.name,
                details: signUpError.details,
                hint: signUpError.hint
              });
            } else         if (authData.user) {
          console.log('✅ Auth user created successfully:', authData.user.id);
          authUserId = authData.user.id;
        } else {
          console.warn('⚠️ No auth user data returned');
        }
          } catch (authException) {
            console.error('💥 Exception during auth signup:', authException);
          }
        }

        // Create user account in the database
        console.log('💾 Creating database user for:', userData.email);
        console.log('💾 Auth user ID:', authUserId);
        
        const { data, error } = await supabase
          .from('users')
          .insert({
            email: userData.email,
            role: userData.role,
            status: userData.status,
            auth_user_id: authUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        
        // Transform the response to match the expected format
        return {
          id: data.id,
          email: data.email,
          role: data.role,
          status: data.status,
          full_name: data.email,
          department: 'N/A',
          position: 'N/A',
          phone: 'N/A',
          location: 'N/A',
          created_at: data.created_at,
          updated_at: data.updated_at,
          auth_user_id: data.auth_user_id,
          employee_id: null,
          is_active: data.status === 'active',
          last_login: null,
          permissions: []
        };
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
    },

    update: async (id, userData) => {
      // Update user account only
      const { data, error } = await supabase
        .from('users')
        .update({
          role: userData.role,
          status: userData.status
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Transform the response to match the expected format
      return {
        id: data.id,
        email: data.email,
        role: data.role,
        status: data.status,
        full_name: data.full_name || data.email,
        department: data.department || 'N/A',
        position: data.position || 'N/A',
        phone: data.phone || 'N/A',
        location: data.location || 'N/A',
        created_at: data.created_at,
        updated_at: data.updated_at,
        auth_user_id: data.auth_user_id || null,
        employee_id: data.employee_id || null,
        is_active: data.status === 'active',
        last_login: data.last_login || null,
        permissions: data.permissions || []
      };
    },

    delete: async (id) => {
      // Delete user account only (NOT employee record)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },

    toggleStatus: async (id, status) => {
      // Toggle user account status only
      const { data, error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Transform the response to match the expected format
      return {
        id: data.id,
        email: data.email,
        role: data.role,
        status: data.status,
        full_name: data.full_name || data.email,
        department: data.department || 'N/A',
        position: data.position || 'N/A',
        phone: data.phone || 'N/A',
        location: data.location || 'N/A',
        created_at: data.created_at,
        updated_at: data.updated_at,
        auth_user_id: data.auth_user_id || null,
        employee_id: data.employee_id || null,
        is_active: data.status === 'active',
        last_login: data.last_login || null,
        permissions: data.permissions || []
      };
    }
  },

  // Access Management APIs
  accessManagement: {
    getRequests: async () => {
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    updateRequest: async (id, requestData) => {
      const { data, error } = await supabase
        .from('access_requests')
        .update(requestData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Attendance APIs
  attendance: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },

    create: async (attendanceData) => {
      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getStats: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*');

      if (error) throw error;
      return data;
    }
  },

  // Payment Events APIs
  paymentEvents: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('payment_events')
        .select('id, user_id, amount, currency, status, description, due_date, is_recurring, recurrence_frequency, recurrence_end_date, reminder_days_before, created_at, updated_at')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data;
    },

    create: async (eventData) => {
      const { data, error } = await supabase
        .from('payment_events')
        .insert({
          user_id: eventData.user_id,
          amount: eventData.amount,
          currency: eventData.currency || 'AED',
          status: eventData.status || 'pending',
          description: eventData.description,
          due_date: eventData.due_date,
          is_recurring: eventData.is_recurring || false,
          recurrence_frequency: eventData.is_recurring ? eventData.recurrence_frequency : null,
          recurrence_end_date: eventData.is_recurring ? eventData.recurrence_end_date || null : null,
          reminder_days_before: Number(eventData.reminder_days_before) || 3,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id, eventData) => {
      const { data, error } = await supabase
        .from('payment_events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('payment_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  },

  // Driver APIs
  drivers: {
    getAll: async (page = 1, limit = 50, search = '') => {
      console.log('🔍 API: drivers.getAll called with:', { page, limit, search });
      
      let query = supabase
        .from('drivers')
        .select(`
          id,
          full_name,
          employee_id,
          designation,
          nationality,
          company_mobile,
          personal_mobile,
          emirates_id_no,
          driving_license_no,
          udrive_customer_account_id,
          service_car_plate,
          team_type,
          team_name,
          team_members,
          shift_type,
          profile_picture,
          status,
          created_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`full_name.ilike.*${search}*,designation.ilike.*${search}*,employee_id.ilike.*${search}*,team_type.ilike.*${search}*`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query.range(from, to);
      
      console.log('🔍 API: drivers.getAll result:', { data, error, count, dataLength: data?.length });
      
      if (error) {
        console.error('🔍 API: drivers.getAll error:', error);
        throw error;
      }
      
      return { data: data || [], count: count || 0 };
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    create: async (driverData) => {
      const { data, error } = await supabase
        .from('drivers')
        .insert(driverData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    update: async (id, driverData) => {
      const { data, error } = await supabase
        .from('drivers')
        .update(driverData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }
  }
};

// Error handler
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.code === 'PGRST116') {
    return 'No data found';
  }
  
  if (error.code === '42501') {
    return 'Access denied. Please check your permissions.';
  }
  
  if (error.code === '23505') {
    return 'This record already exists.';
  }
  
  return error.message || 'An unexpected error occurred';
}; 