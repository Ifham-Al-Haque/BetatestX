import { supabase } from '../supabaseClient';
import {
  dubaiDateString,
  dubaiYear,
  formatDubaiDate,
  isAttendanceSchemaMissing,
  isOwnEmployeeRecord,
  isUuid,
} from './attendanceService';

export { dubaiDateString, dubaiYear, formatDubaiDate, isAttendanceSchemaMissing, isUuid };

export const LEAVE_TYPES = [
  { code: 'annual', label: 'Annual Leave', unit: 'days', default_quota: 30, deducts_from: null },
  { code: 'sick', label: 'Sick Leave', unit: 'days', default_quota: 15, deducts_from: null },
  { code: 'casual', label: 'Casual Leave', unit: 'days', default_quota: 7, deducts_from: null },
  { code: 'festive', label: 'Festive Leave', unit: 'days', default_quota: 5, deducts_from: null },
  { code: 'wfh', label: 'Work From Home', unit: 'days', default_quota: 24, deducts_from: null },
  { code: 'short', label: 'Short Leave', unit: 'hours', default_quota: 24, deducts_from: null },
  { code: 'half_day', label: 'Half Day', unit: 'days', default_quota: 0, deducts_from: 'annual' },
  { code: 'unpaid', label: 'Unpaid Leave', unit: 'days', default_quota: 0, deducts_from: null, is_unlimited: true },
];

export function leaveTypeMeta(code) {
  return LEAVE_TYPES.find((t) => t.code === code) || { code, label: code, unit: 'days' };
}

export function formatLeaveUnits(units, unit = 'days') {
  const n = Number(units);
  if (Number.isNaN(n)) return '—';
  if (unit === 'hours') return `${n}h`;
  if (n === 0.5) return '½ day';
  if (n === 1) return '1 day';
  return `${n} days`;
}

export function leaveCoverage(request) {
  if (!request) return 'all_day';
  if (request.leave_type === 'short') return 'hours';
  if (request.leave_type === 'wfh') return 'wfh';
  if (request.leave_type === 'half_day' || request.session === 'morning' || request.session === 'afternoon') {
    return 'half';
  }
  return 'all_day';
}

export function remainingOf(balance) {
  if (!balance) return 0;
  return Math.max(0, Number(balance.entitled || 0) - Number(balance.taken || 0) - Number(balance.pending || 0));
}

export function countWorkingDays(from, to) {
  if (!from || !to) return 0;
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || end < start) return 0;
  let n = 0;
  const d = new Date(start);
  while (d <= end) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) n += 1;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return n;
}

export function hoursBetween(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = String(startTime).split(':').map(Number);
  const [eh, em] = String(endTime).split(':').map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  return Math.max(0, Math.round((mins / 60) * 100) / 100);
}

export function previewLeaveUnits({ leaveType, startDate, endDate, session, startTime, endTime }) {
  const meta = leaveTypeMeta(leaveType);
  if (meta.unit === 'hours') return { units: hoursBetween(startTime, endTime), unit: 'hours' };
  if (leaveType === 'half_day' || session === 'morning' || session === 'afternoon') {
    return { units: 0.5, unit: 'days' };
  }
  return { units: countWorkingDays(startDate, endDate || startDate), unit: 'days' };
}

function parseRpcJson(data) {
  if (data == null) return data;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
}

async function getMyUhubUser() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const authUser = authData?.user;
  if (!authUser) throw new Error('Not signed in');
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, employee_id, auth_user_id')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export const leaveService = {
  async getTypes() {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) {
      if (isAttendanceSchemaMissing(error)) return LEAVE_TYPES;
      throw error;
    }
    return data?.length ? data : LEAVE_TYPES;
  },

  async getMyBalances(year = dubaiYear()) {
    const me = await getMyUhubUser();
    if (!me?.id) return { user: null, balances: [], year };
    await supabase.rpc('ensure_leave_balances', { p_user_id: me.id, p_year: year });
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', me.id)
      .eq('year', year)
      .order('leave_type');
    if (error) throw error;
    return { user: me, balances: data || [], year };
  },

  async getMyRequests() {
    const me = await getMyUhubUser();
    if (!me?.id) return [];
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', me.id)
      .order('created_at', { ascending: false })
      .limit(40);
    if (error) throw error;
    return data || [];
  },

  async getForEmployee(employeeId, year = dubaiYear(), employeeHint = null) {
    const rpc = await supabase.rpc('get_leave_for_employee', {
      p_employee_id: employeeId,
      p_year: year,
    });
    if (!rpc.error) {
      const parsed = parseRpcJson(rpc.data);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const balances = Array.isArray(parsed.balances)
          ? parsed.balances
          : typeof parsed.balances === 'string'
            ? (() => { try { return JSON.parse(parsed.balances); } catch { return []; } })()
            : [];
        const requests = Array.isArray(parsed.requests)
          ? parsed.requests
          : typeof parsed.requests === 'string'
            ? (() => { try { return JSON.parse(parsed.requests); } catch { return []; } })()
            : [];
        return { ...parsed, balances, requests, year: parsed.year || year };
      }
    }

    const [bal, req] = await Promise.all([
      supabase.from('leave_balances').select('*').eq('employee_id', employeeId).eq('year', year),
      supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false })
        .limit(50),
    ]);
    if (bal.error && isAttendanceSchemaMissing(bal.error)) {
      return { linked: false, balances: [], requests: [], year };
    }
    if (bal.error) throw bal.error;
    if (req.error) throw req.error;

    let balances = bal.data || [];
    let requests = req.data || [];

    if (!balances.length && !requests.length) {
      let userRow = null;
      const byLink = await supabase.from('users').select('id').eq('employee_id', employeeId).maybeSingle();
      userRow = byLink.data;
      if (!userRow && employeeHint?.auth_user_id) {
        const byAuth = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', employeeHint.auth_user_id)
          .maybeSingle();
        userRow = byAuth.data;
      }
      if (!userRow && employeeHint?.email) {
        const byEmail = await supabase
          .from('users')
          .select('id')
          .ilike('email', employeeHint.email)
          .maybeSingle();
        userRow = byEmail.data;
      }
      if (!userRow && employeeHint?.employee_id) {
        const byCode = await supabase
          .from('users')
          .select('id')
          .eq('employee_id', employeeHint.employee_id)
          .maybeSingle();
        userRow = byCode.data;
      }
      if (userRow?.id) {
        const [b2, r2] = await Promise.all([
          supabase.from('leave_balances').select('*').eq('user_id', userRow.id).eq('year', year),
          supabase.from('leave_requests').select('*').eq('user_id', userRow.id).order('start_date', { ascending: false }).limit(50),
        ]);
        balances = b2.data || [];
        requests = r2.data || [];
      }
    }

    return {
      linked: Boolean(balances.length || requests.length),
      balances,
      requests,
      year,
    };
  },

  async getQueue(status = 'pending') {
    let query = supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(150);
    if (status && status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getOnLeave(date = dubaiDateString()) {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('status', 'approved')
      .lte('start_date', date)
      .gte('end_date', date)
      .order('leave_type');
    if (error) throw error;
    return data || [];
  },

  async submit(payload) {
    const rpc = await supabase.rpc('submit_leave_request', {
      p_leave_type: payload.leaveType,
      p_start_date: payload.startDate,
      p_end_date: payload.endDate || payload.startDate,
      p_reason: payload.reason,
      p_session: payload.session || 'full',
      p_start_time: payload.startTime || null,
      p_end_time: payload.endTime || null,
    });
    if (!rpc.error) return parseRpcJson(rpc.data);
    throw rpc.error;
  },

  async cancel(id) {
    const rpc = await supabase.rpc('cancel_leave_request', { p_id: id });
    if (rpc.error) throw rpc.error;
    return parseRpcJson(rpc.data);
  },

  async review(id, decision, notes = '') {
    const rpc = await supabase.rpc('review_leave_request', {
      p_id: id,
      p_decision: decision,
      p_notes: notes || null,
    });
    if (rpc.error) throw rpc.error;
    return parseRpcJson(rpc.data);
  },

  async isSelfEmployee(employeeId, employeeHint = null) {
    const me = await getMyUhubUser();
    if (!me) return false;
    if (isUuid(me.employee_id) && String(me.employee_id) === String(employeeId)) return true;
    const { data: authData } = await supabase.auth.getUser();
    return isOwnEmployeeRecord(me, employeeHint, employeeId, authData?.user?.id);
  },
};

export default leaveService;
