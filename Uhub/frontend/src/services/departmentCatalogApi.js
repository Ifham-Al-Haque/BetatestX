import { supabase } from '../supabaseClient';
import {
  DEPARTMENT_HIERARCHY,
  catalogToHierarchy,
  toOrgCode,
} from '../config/departmentHierarchy';

const isMissingCatalogTable = (error) =>
  error?.code === '42P01' ||
  error?.code === 'PGRST205' ||
  /org_departments|org_department_branches/i.test(error?.message || '');

const fallbackFromHierarchy = () => {
  const departments = DEPARTMENT_HIERARCHY.map((parent, index) => ({
    id: parent.key,
    name: parent.label,
    code: parent.key,
    aliases: parent.aliases || [],
    color: parent.accent || 'gray',
    sort_order: (index + 1) * 10,
    is_active: true,
  }));

  const branches = DEPARTMENT_HIERARCHY.flatMap((parent) =>
    parent.branches.map((branch, index) => ({
      id: `${parent.key}:${branch.key}`,
      department_id: parent.key,
      name: branch.label,
      code: branch.key,
      aliases: branch.aliases || [],
      sort_order: (index + 1) * 10,
      is_active: true,
    }))
  );

  return {
    departments,
    branches,
    hierarchy: DEPARTMENT_HIERARCHY,
    fromDatabase: false,
  };
};

const uniqueLabels = (values = []) =>
  Array.from(
    new Set(
      values
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  );

export const departmentCatalogApi = {
  getCatalog: async (includeInactive = false) => {
    try {
      let departmentQuery = supabase
        .from('org_departments')
        .select('id, name, code, aliases, color, sort_order, is_active')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      let branchQuery = supabase
        .from('org_department_branches')
        .select('id, department_id, name, code, aliases, sort_order, is_active')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (!includeInactive) {
        departmentQuery = departmentQuery.eq('is_active', true);
        branchQuery = branchQuery.eq('is_active', true);
      }

      const [departmentsResult, branchesResult] = await Promise.all([
        departmentQuery,
        branchQuery,
      ]);

      if (departmentsResult.error) throw departmentsResult.error;
      if (branchesResult.error) throw branchesResult.error;

      const departments = departmentsResult.data || [];
      const branches = branchesResult.data || [];

      if (!departments.length) {
        return fallbackFromHierarchy();
      }

      return {
        departments,
        branches,
        hierarchy: catalogToHierarchy(departments, branches),
        fromDatabase: true,
      };
    } catch (error) {
      if (isMissingCatalogTable(error)) {
        return fallbackFromHierarchy();
      }
      throw error;
    }
  },

  createDepartment: async ({ name, color = 'gray' }) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new Error('Department name is required.');
    const { data, error } = await supabase
      .from('org_departments')
      .insert({
        name: trimmed,
        code: toOrgCode(trimmed),
        aliases: [trimmed],
        color,
        sort_order: 200,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateDepartment: async (department, { name, color, is_active, syncEmployees = true }) => {
    const nextName = String(name ?? department.name).trim();
    if (!nextName) throw new Error('Department name is required.');

    const previousLabels = uniqueLabels([
      department.name,
      department.code,
      ...(department.aliases || []),
    ]);
    const aliases = uniqueLabels([...previousLabels, nextName]);

    const { data, error } = await supabase
      .from('org_departments')
      .update({
        name: nextName,
        aliases,
        color: color ?? department.color,
        is_active: is_active ?? department.is_active,
      })
      .eq('id', department.id)
      .select()
      .single();
    if (error) throw error;

    if (syncEmployees && nextName !== department.name && previousLabels.length) {
      const { error: employeeError } = await supabase
        .from('employees')
        .update({ department: nextName })
        .in('department', previousLabels);
      if (employeeError) throw employeeError;
    }

    return data;
  },

  archiveDepartment: async (department) => {
    const { data, error } = await supabase
      .from('org_departments')
      .update({ is_active: false })
      .eq('id', department.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  restoreDepartment: async (department) => {
    const { data, error } = await supabase
      .from('org_departments')
      .update({ is_active: true })
      .eq('id', department.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteDepartment: async (department) => {
    const { count, error: countError } = await supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .in('department', uniqueLabels([department.name, department.code, ...(department.aliases || [])]));
    if (countError) throw countError;
    if (count > 0) {
      throw new Error(
        `${count} employee record(s) still use this department. Archive it instead of deleting.`
      );
    }

    const { error } = await supabase.from('org_departments').delete().eq('id', department.id);
    if (error) throw error;
  },

  createBranch: async (department, { name }) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new Error('Branch name is required.');
    const { data, error } = await supabase
      .from('org_department_branches')
      .insert({
        department_id: department.id,
        name: trimmed,
        code: toOrgCode(trimmed),
        aliases: [trimmed],
        sort_order: 200,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateBranch: async (branch, { name, is_active, syncEmployees = true }) => {
    const nextName = String(name ?? branch.name).trim();
    if (!nextName) throw new Error('Branch name is required.');

    const previousLabels = uniqueLabels([
      branch.name,
      branch.code,
      ...(branch.aliases || []),
    ]);
    const aliases = uniqueLabels([...previousLabels, nextName]);

    const { data, error } = await supabase
      .from('org_department_branches')
      .update({
        name: nextName,
        aliases,
        is_active: is_active ?? branch.is_active,
      })
      .eq('id', branch.id)
      .select()
      .single();
    if (error) throw error;

    if (syncEmployees && nextName !== branch.name && previousLabels.length) {
      const { error: employeeError } = await supabase
        .from('employees')
        .update({ sub_department: nextName })
        .in('sub_department', previousLabels);
      if (employeeError) throw employeeError;
    }

    return data;
  },

  archiveBranch: async (branch) => {
    const { data, error } = await supabase
      .from('org_department_branches')
      .update({ is_active: false })
      .eq('id', branch.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  restoreBranch: async (branch) => {
    const { data, error } = await supabase
      .from('org_department_branches')
      .update({ is_active: true })
      .eq('id', branch.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteBranch: async (branch) => {
    const { count, error: countError } = await supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .in('sub_department', uniqueLabels([branch.name, branch.code, ...(branch.aliases || [])]));
    if (countError) throw countError;
    if (count > 0) {
      throw new Error(
        `${count} employee record(s) still use this branch. Archive it instead of deleting.`
      );
    }

    const { error } = await supabase.from('org_department_branches').delete().eq('id', branch.id);
    if (error) throw error;
  },
};
