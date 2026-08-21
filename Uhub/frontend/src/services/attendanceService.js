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
    second: '2-digit',
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

export function formatElapsedClock(clockIn, now = Date.now()) {
  if (!clockIn) return '00:00:00';
  const start = new Date(clockIn).getTime();
  if (Number.isNaN(start)) return '00:00:00';
  const total = Math.max(0, Math.floor((now - start) / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function elapsedHoursSince(clockIn) {
  if (!clockIn) return 0;
  const start = new Date(clockIn).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(0, (Date.now() - start) / 36e5);
}

export function mapsUrl(lat, lng) {
  if (lat == null || lng == null) return null;
  return `https://maps.google.com/?q=${lat},${lng}`;
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

function monthRange(anchor = new Date()) {
  const ymd = dubaiDateString(anchor);
  const [y, m] = ymd.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to, year: y, month: m };
}

function stripUnknownColumnPayload(row) {
  const {
    user_email,
    user_full_name,
    clock_in_lat,
    clock_in_lng,
    clock_in_accuracy,
    clock_in_label,
    clock_out_lat,
    clock_out_lng,
    clock_out_accuracy,
    clock_out_label,
    lat,
    lng,
    accuracy,
    location_label,
    ...rest
  } = row;
  return rest;
}

async function insertWithOptionalColumns(table, row) {
  const first = await supabase.from(table).insert(row).select('*').single();
  if (!first.error) return first;
  if (!/column|schema cache/i.test(`${first.error.message} ${first.error.details || ''}`)) {
    return first;
  }
  return supabase.from(table).insert(stripUnknownColumnPayload(row)).select('*').single();
}

async function updateWithOptionalColumns(table, id, row) {
  const first = await supabase.from(table).update(row).eq('id', id).select('*').single();
  if (!first.error) return first;
  if (!/column|schema cache/i.test(`${first.error.message} ${first.error.details || ''}`)) {
    return first;
  }
  return supabase.from(table).update(stripUnknownColumnPayload(row)).eq('id', id).select('*').single();
}

export async function requestPunchLocation() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return { lat: null, lng: null, accuracy: null, label: 'Location unavailable', status: 'unsupported' };
  }

  const position = await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ ok: true, pos }),
      (err) => resolve({ ok: false, err }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });

  if (!position.ok) {
    return { lat: null, lng: null, accuracy: null, label: 'Location permission denied', status: 'denied' };
  }

  const lat = position.pos.coords.latitude;
  const lng = position.pos.coords.longitude;
  const accuracy = position.pos.coords.accuracy;
  let label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (res.ok) {
      const geo = await res.json();
      const pretty = [geo.locality || geo.city, geo.principalSubdivision, geo.countryName]
        .filter(Boolean)
        .join(', ');
      if (pretty) label = pretty;
    }
  } catch {
    // Keep coordinates as the label if reverse-geocode is blocked.
  }

  return { lat, lng, accuracy, label, status: 'ok' };
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

function mapDayRow(row) {
  if (!row) return row;
  return {
    ...row,
    user_email: row.user_email || row.users?.email || null,
    user_full_name: row.user_full_name || row.users?.full_name || row.users?.email || null,
    employee_record_id: row.employee_record_id || row.users?.employee_id || null,
  };
}

async function clockViaTable(punchType, location) {
  const me = await getMyUhubUser();
  if (!me?.id) throw new Error('No UHub user account is linked to this login');

  const workDate = dubaiDateString();
  const nowIso = new Date().toISOString();
  const displayName = me.full_name || (me.email ? me.email.split('@')[0] : 'User');

  const { data: existing, error: existingError } = await supabase
    .from('user_attendance_days')
    .select('*')
    .eq('user_id', me.id)
    .eq('work_date', workDate)
    .maybeSingle();
  if (existingError) throw existingError;

  let day = existing;

  if (punchType === 'in') {
    if (day?.clock_in && !day?.clock_out) throw new Error('Already clocked in');
    if (day?.clock_out) throw new Error('Attendance for today is already complete');
    const inserted = await insertWithOptionalColumns('user_attendance_days', {
      user_id: me.id,
      work_date: workDate,
      clock_in: nowIso,
      status: 'open',
      source: 'app',
      user_email: me.email,
      user_full_name: displayName,
      clock_in_lat: location.lat,
      clock_in_lng: location.lng,
      clock_in_accuracy: location.accuracy,
      clock_in_label: location.label,
    });
    if (inserted.error) throw inserted.error;
    day = inserted.data;
  } else {
    if (!day?.clock_in) throw new Error('Clock in first');
    if (day.clock_out) throw new Error('Already clocked out');
    const hours = elapsedHoursSince(day.clock_in);
    const updated = await updateWithOptionalColumns('user_attendance_days', day.id, {
      clock_out: nowIso,
      total_hours: Number(hours.toFixed(2)),
      status: 'complete',
      user_email: day.user_email || me.email,
      user_full_name: day.user_full_name || displayName,
      clock_out_lat: location.lat,
      clock_out_lng: location.lng,
      clock_out_accuracy: location.accuracy,
      clock_out_label: location.label,
    });
    if (updated.error) throw updated.error;
    day = updated.data;
  }

  await insertWithOptionalColumns('user_attendance_punches', {
    user_id: me.id,
    day_id: day.id,
    punched_at: nowIso,
    punch_type: punchType,
    source: 'app',
    lat: location.lat,
    lng: location.lng,
    accuracy: location.accuracy,
    location_label: location.label,
  });

  return { day, punch: { punch_type: punchType } };
}

async function loadDaysFromTable(from, to) {
  const { data, error } = await supabase
    .from('user_attendance_days')
    .select('*')
    .gte('work_date', from)
    .lte('work_date', to)
    .order('clock_in', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDayRow);
}

export const attendanceService = {
  async clock(punchType, location = {}) {
    const loc = {
      lat: location.lat ?? null,
      lng: location.lng ?? null,
      accuracy: location.accuracy ?? null,
      label: location.label ?? null,
    };

    const rpc = await supabase.rpc('clock_user_attendance', {
      p_punch_type: punchType,
      p_lat: loc.lat,
      p_lng: loc.lng,
      p_accuracy: loc.accuracy,
      p_label: loc.label,
    });

    if (!rpc.error) return parseRpcJson(rpc.data);

    if (rpc.error.message?.includes('clock_user_attendance') || isAttendanceSchemaMissing(rpc.error)) {
      const simple = await supabase.rpc('clock_user_attendance', { p_punch_type: punchType });
      if (!simple.error) return parseRpcJson(simple.data);
    }

    return clockViaTable(punchType, loc);
  },

  async getMyToday() {
    const rpc = await supabase.rpc('get_my_attendance_today');
    if (!rpc.error) {
      const parsed = parseRpcJson(rpc.data);
      if (parsed?.day || parsed?.user_id) return parsed;
    }

    const me = await getMyUhubUser();
    const workDate = dubaiDateString();
    if (!me?.id) return { user_id: null, work_date: workDate, day: null };

    const { data, error } = await supabase
      .from('user_attendance_days')
      .select('*')
      .eq('user_id', me.id)
      .eq('work_date', workDate)
      .maybeSingle();
    if (error && !isAttendanceSchemaMissing(error)) throw error;
    return { user_id: me.id, work_date: workDate, day: data || null };
  },

  async getOverview(from, to) {
    const rpc = await supabase.rpc('get_attendance_overview', { p_from: from, p_to: to });
    if (!rpc.error) return rpc.data || [];
    return loadDaysFromTable(from, to);
  },

  async getUserDays(userId, from, to) {
    const rpc = await supabase.rpc('get_user_attendance_days', {
      p_user_id: userId,
      p_from: from,
      p_to: to,
    });
    if (!rpc.error) return rpc.data || [];

    const { data, error } = await supabase
      .from('user_attendance_days')
      .select('*')
      .eq('user_id', userId)
      .gte('work_date', from)
      .lte('work_date', to)
      .order('work_date');
    if (error) throw error;
    return data || [];
  },

  async getForEmployee(employeeId, from, to) {
    const rpc = await supabase.rpc('get_attendance_for_employee', {
      p_employee_id: employeeId,
      p_from: from,
      p_to: to,
    });
    if (!rpc.error) {
      const parsed = parseRpcJson(rpc.data);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    }

    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, email, full_name, employee_id, auth_user_id')
      .eq('id', employeeId)
      .maybeSingle();
    if (empError) throw empError;
    if (!employee) return { linked: false, days: [] };

    let userRow = null;
    const byLink = await supabase
      .from('users')
      .select('id, email, full_name, employee_id, auth_user_id')
      .eq('employee_id', employeeId)
      .maybeSingle();
    if (byLink.data) userRow = byLink.data;
    if (!userRow && employee.email) {
      const byEmail = await supabase
        .from('users')
        .select('id, email, full_name, employee_id, auth_user_id')
        .ilike('email', employee.email)
        .maybeSingle();
      if (byEmail.data) userRow = byEmail.data;
    }

    let daysQuery = supabase
      .from('user_attendance_days')
      .select('*')
      .gte('work_date', from)
      .lte('work_date', to)
      .order('work_date', { ascending: false });

    if (userRow?.id) daysQuery = daysQuery.eq('user_id', userRow.id);
    else if (employee.email) daysQuery = daysQuery.ilike('user_email', employee.email);
    else return { linked: false, days: [] };

    const { data: days, error: daysError } = await daysQuery;
    if (daysError) throw daysError;

    const linked = Boolean(userRow?.id || (days && days.length));
    return {
      linked,
      linked_how: userRow?.id ? 'user lookup' : 'email on attendance',
      user_id: userRow?.id || days?.[0]?.user_id || null,
      user_email: userRow?.email || employee.email,
      user_full_name: userRow?.full_name || employee.full_name,
      days: days || [],
    };
  },

  monthRange,
};

export default attendanceService;
