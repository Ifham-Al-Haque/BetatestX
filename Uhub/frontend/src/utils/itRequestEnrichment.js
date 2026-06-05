/**
 * Normalize it_requests_with_details flat columns + enrich assignee from users table.
 * assigned_to references public.users(id), not employees.
 */

export function normalizeItRequestRow(row, categories = [], priorities = []) {
  if (!row) return row;

  const normalized = { ...row };

  if (!normalized.category?.name && (normalized.category_name || normalized.category_id)) {
    const fromList = categories.find((c) => String(c.id) === String(normalized.category_id));
    normalized.category = {
      id: normalized.category_id,
      name: normalized.category_name || fromList?.name,
      color: normalized.category_color || fromList?.color,
      icon: normalized.category_icon || fromList?.icon,
    };
  }

  if (!normalized.priority?.name && (normalized.priority_name || normalized.priority_id)) {
    const fromList = priorities.find((p) => String(p.id) === String(normalized.priority_id));
    normalized.priority = {
      id: normalized.priority_id,
      name: normalized.priority_name || fromList?.name,
      level: normalized.priority_level ?? fromList?.level,
      color: normalized.priority_color || fromList?.color,
      sla_hours: normalized.sla_hours ?? fromList?.sla_hours,
    };
  }

  if ((!normalized.requester?.full_name) && (normalized.requester_name || normalized.requester_email)) {
    normalized.requester = {
      full_name: normalized.requester_name,
      email: normalized.requester_email,
      role: normalized.requester_role,
      department: normalized.requester_department,
    };
  }

  if (normalized.assigned_to && !normalized.assignee?.full_name && normalized.assigned_to_name) {
    normalized.assignee = { full_name: normalized.assigned_to_name };
  }

  return normalized;
}

export function normalizeItRequestList(rows, categories = [], priorities = []) {
  return (rows || []).map((row) => normalizeItRequestRow(row, categories, priorities));
}

/** @param {import('@supabase/supabase-js').SupabaseClient} supabase */
export async function enrichItRequestsWithAssignees(supabase, requests) {
  if (!requests?.length) return requests || [];

  const assigneeIds = [...new Set(requests.map((r) => r.assigned_to).filter(Boolean))];
  if (assigneeIds.length === 0) return requests;

  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, department')
    .in('id', assigneeIds);

  if (error) {
    console.warn('enrichItRequestsWithAssignees:', error.message);
    return requests;
  }

  const byId = {};
  (users || []).forEach((u) => {
    byId[u.id] = u;
  });

  return requests.map((request) => {
    if (!request.assigned_to) {
      return { ...request, assignee: null };
    }
    const user = byId[request.assigned_to];
    return {
      ...request,
      assignee: user || request.assignee || { full_name: request.assigned_to_name || null },
    };
  });
}

export function getAssigneeDisplayName(request) {
  return (
    request?.assignee?.full_name
    || request?.assigned_to_name
    || null
  );
}

export function getCategoryDisplayName(request, categories = []) {
  return (
    request?.category?.name
    || request?.category_name
    || categories.find((c) => String(c.id) === String(request?.category_id))?.name
    || null
  );
}

export function getPriorityDisplayName(request, priorities = []) {
  return (
    request?.priority?.name
    || request?.priority_name
    || priorities.find((p) => String(p.id) === String(request?.priority_id))?.name
    || null
  );
}
