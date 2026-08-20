import { supabase } from '../supabaseClient';

export const ATTENDANCE_TZ = 'Asia/Dubai';

export function dubaiDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ATTENDANCE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatDubaiTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-GB', {
    timeZone: ATTENDANCE_TZ,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDubaiDate(value) {
  if (!value) return '—';
  const raw = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)
    ? value.slice(0, 10)
    : dubaiDateString(new Date(value));
  const [y, m, day] = raw.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, day));
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatHours(hours) {
  if (hours == null || hours === '') return '—';
  const n = Number(hours);
  if (Number.isNaN(n)) return '—';
  const h = Math.floor(n);
  const mins = Math.round((n - h) * 60);
  if (h === 0) return `${mins}m`;
  if (mins === 0) return `${h}h`;
  return `${h}h ${mins}m`;
}

export function elapsedHoursSince(clockIn) {
  if (!clockIn) return 0;
  const start = new Date(clockIn).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(0, (Date.now() - start) / 36e5);
}

export function isAttendanceSchemaMissing(error) {
  if (!error) return false;
  const msg = `${error.message || ''} ${error.details || ''}`;
  return (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    error.code === '42P01' ||
    /does not exist/i.test(msg) ||
    /could not find the function/i.test(msg)
  );
}

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '')
  );
}

function monthRange(anchor = new Date()) {
  const ymd = dubaiDateString(anchor);
  const [y, m] = ymd.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to, year: y, month: m };
}

export const attendanceService = {
  async clock(punchType) {
    const { data, error } = await supabase.rpc('clock_user_attendance', {
      p_punch_type: punchType,
    });
    if (error) throw error;
    return data;
  },

  async getMyToday() {
    const { data, error } = await supabase.rpc('get_my_attendance_today');
    if (error) throw error;
    return data;
  },

  async getOverview(from, to) {
    const { data, error } = await supabase.rpc('get_attendance_overview', {
      p_from: from,
      p_to: to,
    });
    if (error) throw error;
    return data || [];
  },

  async getUserDays(userId, from, to) {
    const { data, error } = await supabase.rpc('get_user_attendance_days', {
      p_user_id: userId,
      p_from: from,
      p_to: to,
    });
    if (error) throw error;
    return data || [];
  },

  async getForEmployee(employeeId, from, to) {
    const { data, error } = await supabase.rpc('get_attendance_for_employee', {
      p_employee_id: employeeId,
      p_from: from,
      p_to: to,
    });
    if (error) throw error;
    return data || { linked: false, days: [] };
  },

  monthRange,
};

export default attendanceService;
