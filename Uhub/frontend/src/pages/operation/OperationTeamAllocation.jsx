import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Users,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Pencil,
  Trash2,
  Crown,
  UserMinus,
  Plane,
  GripVertical,
  Search,
  Calendar,
  Clock,
  MapPin,
  MoreVertical,
  LayoutGrid,
  UserCheck,
  HeartPulse,
  CalendarOff,
} from 'lucide-react';
import OperationSubLayout from '../../components/operation/OperationSubLayout';
import OperationEmptyState from '../../components/operation/OperationEmptyState';
import ConfirmDialog from '../../components/operation/ConfirmDialog';
import OperationStatCard from '../../components/operation/OperationStatCard';
import operationService from '../../services/operationService';
import { useToast } from '../../context/ToastContext';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const COLORS = [
  { key: 'blue', header: 'from-blue-600 to-sky-500', soft: 'bg-sky-50/70', border: 'border-blue-200', ring: 'ring-blue-300', dot: 'bg-blue-500', avatar: 'bg-blue-100 text-blue-700' },
  { key: 'green', header: 'from-emerald-600 to-teal-500', soft: 'bg-emerald-50/70', border: 'border-emerald-200', ring: 'ring-emerald-300', dot: 'bg-emerald-500', avatar: 'bg-emerald-100 text-emerald-700' },
  { key: 'amber', header: 'from-amber-500 to-orange-400', soft: 'bg-amber-50/70', border: 'border-amber-200', ring: 'ring-amber-300', dot: 'bg-amber-500', avatar: 'bg-amber-100 text-amber-800' },
  { key: 'orange', header: 'from-orange-600 to-red-400', soft: 'bg-orange-50/70', border: 'border-orange-200', ring: 'ring-orange-300', dot: 'bg-orange-500', avatar: 'bg-orange-100 text-orange-700' },
  { key: 'indigo', header: 'from-indigo-600 to-violet-500', soft: 'bg-indigo-50/70', border: 'border-indigo-200', ring: 'ring-indigo-300', dot: 'bg-indigo-500', avatar: 'bg-indigo-100 text-indigo-700' },
  { key: 'purple', header: 'from-purple-600 to-fuchsia-500', soft: 'bg-purple-50/70', border: 'border-purple-200', ring: 'ring-purple-300', dot: 'bg-purple-500', avatar: 'bg-purple-100 text-purple-700' },
  { key: 'teal', header: 'from-teal-600 to-cyan-500', soft: 'bg-teal-50/70', border: 'border-teal-200', ring: 'ring-teal-300', dot: 'bg-teal-500', avatar: 'bg-teal-100 text-teal-700' },
  { key: 'red', header: 'from-rose-600 to-pink-500', soft: 'bg-rose-50/70', border: 'border-rose-200', ring: 'ring-rose-300', dot: 'bg-rose-500', avatar: 'bg-rose-100 text-rose-700' },
  { key: 'gray', header: 'from-slate-600 to-slate-500', soft: 'bg-slate-50', border: 'border-slate-200', ring: 'ring-slate-300', dot: 'bg-slate-500', avatar: 'bg-slate-100 text-slate-700' },
];

const colorOf = (key) => COLORS.find((c) => c.key === key) || COLORS[0];

const STATUS_LABEL = {
  active: null,
  annual_leave: 'Annual Leave',
  sick_leave: 'Sick Leave',
  off: 'Off',
};

const STATUS_STYLE = {
  annual_leave: { chip: 'bg-amber-100 text-amber-900', bar: 'border-l-[3px] border-l-amber-400' },
  sick_leave: { chip: 'bg-rose-100 text-rose-800', bar: 'border-l-[3px] border-l-rose-400' },
  off: { chip: 'bg-slate-100 text-slate-600', bar: 'border-l-[3px] border-l-slate-400' },
};

const emptyTeamForm = { name: '', team_type: '', shift_label: '', week_off: '', area: '', color: 'blue' };

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function DriverChip({
  name,
  subtitle,
  avatarClass,
  status,
  isLead,
  isDragging,
  badges,
  menu,
  onDragStart,
  onDragEnd,
}) {
  const statusStyle = STATUS_STYLE[status];
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm bg-white border border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300 cursor-grab active:cursor-grabbing transition-all ${
        statusStyle?.bar || ''
      } ${isDragging ? 'opacity-40' : ''} ${isLead ? 'ring-1 ring-amber-200' : ''}`}
    >
      <GripVertical className="w-3.5 h-3.5 text-gray-300 shrink-0 group-hover:text-gray-500" />
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${avatarClass}`}>
        {initials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-gray-900 font-medium leading-tight">{name}</p>
        {subtitle && <p className="truncate text-[11px] text-gray-400 leading-tight mt-0.5">{subtitle}</p>}
      </div>
      {badges}
      {menu}
    </div>
  );
}

const normalizeName = (s) => (s || '').toString().trim().toLowerCase();

const roleFromLabel = (label) => (normalizeName(label) === 'team lead' || normalizeName(label) === 'lead' ? 'team_lead' : 'member');

const statusFromLabel = (label) => {
  const n = normalizeName(label);
  if (n === 'annual leave' || n === 'annual_leave') return 'annual_leave';
  if (n === 'sick leave' || n === 'sick_leave') return 'sick_leave';
  if (n === 'off') return 'off';
  return 'active';
};

// Detect role/status keywords from any free text (handles common typos like "Annul Leave")
const detectRole = (text) => (/\b(team\s*lead|lead)\b/i.test(text) ? 'team_lead' : null);
const detectStatus = (text) => {
  if (/\bann?u[ae]l\s*leave\b/i.test(text)) return 'annual_leave';
  if (/\bsick\s*leave\b/i.test(text)) return 'sick_leave';
  if (/\boff\b/i.test(text)) return 'off';
  return null;
};

// Parse a member cell like "Fazal Amin (Team Lead)" or
// "Ihsan Ullah (Team Lead) Annul Leave" → { name, role, status }
const parseMemberCell = (raw) => {
  const full = (raw || '').toString().trim();
  if (!full) return { name: '', role: null, status: null };
  const role = detectRole(full);
  const status = detectStatus(full);
  // Strip ALL parenthetical groups, then strip any trailing role/status phrases
  let name = full.replace(/\([^)]*\)/g, ' ');
  name = name
    .replace(/\bteam\s*lead\b/gi, ' ')
    .replace(/\blead\b/gi, ' ')
    .replace(/\bann?u[ae]l\s*leave\b/gi, ' ')
    .replace(/\bsick\s*leave\b/gi, ' ')
    .replace(/\boff\b/gi, ' ')
    .replace(/[-–—|,]+\s*$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { name, role, status };
};

const OperationTeamAllocation = () => {
  const { success, error: showError } = useToast();
  const [teams, setTeams] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tablesMissing, setTablesMissing] = useState(false);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamForm, setTeamForm] = useState(emptyTeamForm);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [dragOverTeamId, setDragOverTeamId] = useState(null);
  const [dragOverPool, setDragOverPool] = useState(false);
  const [openMenuMemberId, setOpenMenuMemberId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [draggingKey, setDraggingKey] = useState(null);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teamData, driverData] = await Promise.all([
        operationService.getTeams(),
        operationService.getAllocatableDrivers(),
      ]);
      setTeams(teamData);
      setDrivers(driverData);
      setTablesMissing(false);
    } catch (err) {
      if (err.code === '42P01' || err.message?.includes('does not exist')) {
        setTablesMissing(true);
        setTeams([]);
      } else {
        showError('Failed to load team allocation');
      }
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const assignedDriverIds = useMemo(() => {
    const ids = new Set();
    teams.forEach((t) =>
      (t.operation_team_members || []).forEach((m) => {
        if (m.is_active !== false) ids.add(m.driver_id);
      })
    );
    return ids;
  }, [teams]);

  const pool = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drivers
      .filter((d) => !assignedDriverIds.has(d.id))
      .filter((d) => !q || (d.full_name || '').toLowerCase().includes(q));
  }, [drivers, assignedDriverIds, search]);

  const totalAllocated = assignedDriverIds.size;
  const onLeaveCount = useMemo(() => {
    let n = 0;
    teams.forEach((t) =>
      (t.operation_team_members || []).forEach((m) => {
        if (m.is_active !== false && m.member_status && m.member_status !== 'active') n += 1;
      })
    );
    return n;
  }, [teams]);

  // ---- Drag & drop -----------------------------------------------------------
  const handleDragStart = (e, payload) => {
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingKey(payload.fromMemberId || payload.driverId);
  };

  const handleDragEnd = () => {
    setDraggingKey(null);
    setDragOverTeamId(null);
    setDragOverPool(false);
  };

  const readPayload = (e) => {
    try {
      return JSON.parse(e.dataTransfer.getData('application/json'));
    } catch {
      return null;
    }
  };

  // Drop on a team, optionally at a specific insertion index (for reordering).
  const dropOnTeam = async (e, teamId, dropIndex = null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTeamId(null);
    const payload = readPayload(e);
    if (!payload) return;

    const team = teams.find((t) => t.id === teamId);
    const currentIds = [...(team?.operation_team_members || [])]
      .filter((m) => m.is_active !== false)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((m) => m.id);

    setBusy(true);
    try {
      let memberId = payload.fromMemberId;
      const sameTeam = payload.fromTeamId === teamId;

      if (!sameTeam) {
        const row = await operationService.moveDriverToTeam(payload.driverId, teamId, 0);
        memberId = row.id;
      }

      // Build the desired ordered id list for this team
      let ids = currentIds.filter((id) => id !== memberId);
      const index = dropIndex == null || dropIndex < 0 || dropIndex > ids.length ? ids.length : dropIndex;
      ids.splice(index, 0, memberId);
      await operationService.reorderTeamMembers(ids);

      if (!sameTeam) success('Driver allocated');
      await load();
    } catch (err) {
      showError(err?.message || 'Could not move driver');
    } finally {
      setBusy(false);
      setDraggingKey(null);
    }
  };

  const dropOnPool = async (e) => {
    e.preventDefault();
    setDragOverPool(false);
    const payload = readPayload(e);
    if (!payload || !payload.fromMemberId) return; // already unassigned
    setBusy(true);
    try {
      await operationService.removeTeamMember(payload.fromMemberId);
      success('Driver returned to pool');
      await load();
    } catch (err) {
      showError(err?.message || 'Could not unassign driver');
    } finally {
      setBusy(false);
      setDraggingKey(null);
    }
  };

  // ---- Team CRUD -------------------------------------------------------------
  const openCreateTeam = () => {
    setEditingTeamId(null);
    setTeamForm(emptyTeamForm);
    setShowTeamForm(true);
  };

  const openEditTeam = (team) => {
    setEditingTeamId(team.id);
    setTeamForm({
      name: team.name || '',
      team_type: team.team_type || '',
      shift_label: team.shift_label || '',
      week_off: team.week_off || '',
      area: team.area || '',
      color: team.color || 'blue',
    });
    setShowTeamForm(true);
  };

  const submitTeam = async (e) => {
    e.preventDefault();
    if (!teamForm.name.trim()) return;
    setBusy(true);
    try {
      if (editingTeamId) {
        await operationService.updateTeam(editingTeamId, {
          name: teamForm.name.trim(),
          team_type: teamForm.team_type.trim() || null,
          shift_label: teamForm.shift_label.trim() || null,
          week_off: teamForm.week_off || null,
          area: teamForm.area.trim() || null,
          color: teamForm.color,
        });
        success('Team updated');
      } else {
        await operationService.createTeam({
          ...teamForm,
          name: teamForm.name.trim(),
          display_order: teams.length,
        });
        success('Team created');
      }
      setShowTeamForm(false);
      setTeamForm(emptyTeamForm);
      setEditingTeamId(null);
      await load();
    } catch (err) {
      if (err.code === '42P01') {
        setTablesMissing(true);
        showError('Team tables are missing. Run operation_team_allocation_schema.sql.');
      } else {
        showError('Could not save team');
      }
    } finally {
      setBusy(false);
    }
  };

  const deleteTeam = (team) => {
    setConfirm({
      title: 'Delete team',
      message: `Delete "${team.name}"? Members will return to the unassigned pool.`,
      onConfirm: async () => {
        setBusy(true);
        try {
          await operationService.deleteTeam(team.id);
          success('Team deleted');
          await load();
        } catch {
          showError('Could not delete team');
        } finally {
          setBusy(false);
          setConfirm(null);
        }
      },
    });
  };

  // ---- Member actions --------------------------------------------------------
  const setLead = async (teamId, memberId) => {
    setOpenMenuMemberId(null);
    setBusy(true);
    try {
      await operationService.setTeamLead(teamId, memberId);
      success('Team lead updated');
      await load();
    } catch {
      showError('Could not set team lead');
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (member, status) => {
    setOpenMenuMemberId(null);
    setBusy(true);
    try {
      const next = member.member_status === status ? 'active' : status;
      await operationService.updateTeamMember(member.id, { member_status: next });
      await load();
    } catch {
      showError('Could not update status');
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (memberId) => {
    setOpenMenuMemberId(null);
    setBusy(true);
    try {
      await operationService.removeTeamMember(memberId);
      await load();
    } catch {
      showError('Could not remove member');
    } finally {
      setBusy(false);
    }
  };

  // ---- Excel export ----------------------------------------------------------
  const exportExcel = () => {
    const rows = [];
    teams.forEach((team) => {
      const members = (team.operation_team_members || []).filter((m) => m.is_active !== false);
      if (members.length === 0) {
        rows.push({
          Team: team.name,
          Schedule: team.shift_label || '',
          'Week Off': team.week_off || '',
          Area: team.area || '',
          Member: '(no members)',
          Role: '',
          Status: '',
        });
      }
      members.forEach((m) => {
        rows.push({
          Team: team.name,
          Schedule: team.shift_label || '',
          'Week Off': team.week_off || '',
          Area: team.area || '',
          Member: m.drivers?.full_name || 'Driver',
          Role: m.role === 'team_lead' ? 'Team Lead' : 'Member',
          Status: STATUS_LABEL[m.member_status] || 'Active',
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Team: '', Schedule: '', 'Week Off': '', Area: '', Member: '', Role: '', Status: '' }]);
    ws['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 14 }, { wch: 28 }, { wch: 26 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Team Allocation');

    if (pool.length) {
      const poolWs = XLSX.utils.json_to_sheet(pool.map((d) => ({ Driver: d.full_name, Designation: d.designation || '', Status: d.status || '' })));
      poolWs['!cols'] = [{ wch: 26 }, { wch: 20 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, poolWs, 'Unassigned');
    }

    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `team-allocation-${stamp}.xlsx`);
    success('Schedule exported to Excel');
  };

  // ---- Excel import ----------------------------------------------------------
  const triggerImport = () => fileInputRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheetName = wb.SheetNames.find((n) => normalizeName(n) === 'team allocation') || wb.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
      if (!rows.length) {
        showError('No rows found in the spreadsheet');
        return;
      }

      // Group rows by team, preserving row order for member ordering
      const teamMap = new Map();
      rows.forEach((r) => {
        const teamName = (r.Team || r.team || '').toString().trim();
        if (!teamName) return;
        if (!teamMap.has(teamName)) {
          teamMap.set(teamName, {
            name: teamName,
            shift_label: (r.Schedule || r.schedule || '').toString().trim(),
            week_off: (r['Week Off'] || r.week_off || '').toString().trim(),
            area: (r.Area || r.area || '').toString().trim(),
            members: [],
          });
        }
        const rawMember = (r.Member || r.member || r.Name || '').toString().trim();
        const parsed = parseMemberCell(rawMember);
        if (parsed.name && normalizeName(parsed.name) !== 'no members') {
          // Explicit Role/Status columns take precedence; fall back to inline suffixes
          const colRole = (r.Role || r.role) ? roleFromLabel(r.Role || r.role) : null;
          const colStatus = (r.Status || r.status) ? statusFromLabel(r.Status || r.status) : null;
          teamMap.get(teamName).members.push({
            name: parsed.name,
            role: (colRole && colRole !== 'member' ? colRole : null) || parsed.role || 'member',
            status: (colStatus && colStatus !== 'active' ? colStatus : null) || parsed.status || 'active',
          });
        }
      });

      // Map of existing teams by normalized name
      const existingByName = new Map(teams.map((t) => [normalizeName(t.name), t]));

      let createdTeams = 0;
      let allocated = 0;
      const unmatched = [];

      for (const def of teamMap.values()) {
        let team = existingByName.get(normalizeName(def.name));
        if (!team) {
          team = await operationService.createTeam({
            name: def.name,
            shift_label: def.shift_label || null,
            week_off: def.week_off || null,
            area: def.area || null,
            color: COLORS[createdTeams % COLORS.length].key,
            display_order: teams.length + createdTeams,
          });
          createdTeams += 1;
        } else if (def.shift_label || def.week_off || def.area) {
          await operationService.updateTeam(team.id, {
            shift_label: def.shift_label || team.shift_label || null,
            week_off: def.week_off || team.week_off || null,
            area: def.area || team.area || null,
          });
        }

        let order = 0;
        for (const mem of def.members) {
          const driver = await operationService.findDriverByName(mem.name);
          if (!driver) {
            unmatched.push(mem.name);
            continue;
          }
          const row = await operationService.moveDriverToTeam(driver.id, team.id, order);
          if (mem.role === 'team_lead' || mem.status !== 'active') {
            await operationService.updateTeamMember(row.id, {
              role: mem.role,
              member_status: mem.status,
            });
          }
          order += 1;
          allocated += 1;
        }
      }

      await load();
      const parts = [`${allocated} allocated`, `${createdTeams} team(s) created`];
      if (unmatched.length) parts.push(`${unmatched.length} name(s) not matched`);
      success(`Import complete: ${parts.join(', ')}`);
      if (unmatched.length) {
        showError(`Unmatched drivers (add them in Driver Records first): ${unmatched.slice(0, 8).join(', ')}${unmatched.length > 8 ? '…' : ''}`);
      }
    } catch (err) {
      if (err.code === '42P01') {
        setTablesMissing(true);
        showError('Team tables are missing. Run operation_team_allocation_schema.sql.');
      } else {
        showError(err?.message || 'Could not import spreadsheet');
      }
    } finally {
      setImporting(false);
    }
  };

  // ---- Render ----------------------------------------------------------------
  const renderMemberBadges = (m) => {
    const isLead = m.role === 'team_lead';
    const statusLabel = STATUS_LABEL[m.member_status];
    if (!isLead && !statusLabel) return null;
    return (
      <div className="flex items-center gap-1 shrink-0">
        {isLead && (
          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
            <Crown className="w-3 h-3" />
            Lead
          </span>
        )}
        {statusLabel && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_STYLE[m.member_status]?.chip || 'bg-amber-100 text-amber-900'}`}>
            {statusLabel}
          </span>
        )}
      </div>
    );
  };

  const renderMemberMenu = (team, m) => {
    const isLead = m.role === 'team_lead';
    return (
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpenMenuMemberId(openMenuMemberId === m.id ? null : m.id)}
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
          title="Member actions"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {openMenuMemberId === m.id && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuMemberId(null)} />
            <div className="absolute right-0 top-8 z-20 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 text-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setLead(team.id, m.id)}
                className="w-full text-left px-3 py-2 hover:bg-amber-50 flex items-center gap-2"
              >
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                {isLead ? 'Is team lead' : 'Make team lead'}
              </button>
              <button
                type="button"
                onClick={() => toggleStatus(m, 'annual_leave')}
                className="w-full text-left px-3 py-2 hover:bg-amber-50 flex items-center gap-2"
              >
                <Plane className="w-3.5 h-3.5 text-amber-600" />
                {m.member_status === 'annual_leave' ? 'Clear annual leave' : 'Annual leave'}
              </button>
              <button
                type="button"
                onClick={() => toggleStatus(m, 'sick_leave')}
                className="w-full text-left px-3 py-2 hover:bg-rose-50 flex items-center gap-2"
              >
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                {m.member_status === 'sick_leave' ? 'Clear sick leave' : 'Sick leave'}
              </button>
              <button
                type="button"
                onClick={() => toggleStatus(m, 'off')}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
              >
                <CalendarOff className="w-3.5 h-3.5 text-slate-500" />
                {m.member_status === 'off' ? 'Clear off' : 'Mark off'}
              </button>
              <button
                type="button"
                onClick={() => removeMember(m.id)}
                className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-gray-100 mt-1"
              >
                <UserMinus className="w-3.5 h-3.5" />
                Remove from team
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <OperationSubLayout
      maxWidth="max-w-[96rem]"
      breadcrumbs={[
        { label: 'Schedule & Roster', href: '/operation/roster' },
        { label: 'Team Allocation' },
      ]}
      title="Team Allocation"
      description="Build the weekly board: drag drivers into teams, set leads, mark leave, then export."
      icon={LayoutGrid}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-1.5 bg-white"
          >
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={triggerImport}
            disabled={importing}
            className="px-3 py-2 text-sm border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-1.5 bg-white disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importing…' : 'Import Excel'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={exportExcel}
            disabled={teams.length === 0}
            className="px-3 py-2 text-sm border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-50 flex items-center gap-1.5 bg-white disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            type="button"
            onClick={openCreateTeam}
            className="px-4 py-2 text-sm bg-teal-600 text-white rounded-xl hover:bg-teal-700 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New team
          </button>
        </div>
      }
    >
      {tablesMissing && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          Team allocation tables are not set up yet. Run{' '}
          <code className="text-xs bg-amber-100 px-1 rounded">operation_team_allocation_schema.sql</code> in Supabase.
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <OperationStatCard label="Teams" value={teams.length} tone="indigo" icon={LayoutGrid} />
          <OperationStatCard label="Allocated" value={totalAllocated} tone="green" icon={UserCheck} sub={`${drivers.length} drivers in pool`} />
          <OperationStatCard label="Unassigned" value={pool.length} tone="blue" icon={Users} />
          <OperationStatCard label="On leave / off" value={onLeaveCount} tone="yellow" icon={Plane} />
        </div>
      )}

      {showTeamForm && (
        <form onSubmit={submitTeam} className="mb-6 bg-white border border-teal-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{editingTeamId ? 'Edit team' : 'Create team'}</h3>
            <span className="text-xs text-gray-400">Colour appears on the board header</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="text-xs font-medium text-gray-500">
              Team name
              <input
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                placeholder="e.g. DXB Morning Team 1"
                value={teamForm.name}
                onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label className="text-xs font-medium text-gray-500">
              Schedule
              <input
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                placeholder="e.g. 7 AM – 5 PM"
                value={teamForm.shift_label}
                onChange={(e) => setTeamForm((f) => ({ ...f, shift_label: e.target.value }))}
              />
            </label>
            <label className="text-xs font-medium text-gray-500">
              Week off
              <select
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                value={teamForm.week_off}
                onChange={(e) => setTeamForm((f) => ({ ...f, week_off: e.target.value }))}
              >
                <option value="">Select day…</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-gray-500">
              Area
              <input
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                placeholder="e.g. Marina to Business Bay"
                value={teamForm.area}
                onChange={(e) => setTeamForm((f) => ({ ...f, area: e.target.value }))}
              />
            </label>
            <label className="text-xs font-medium text-gray-500">
              Team type
              <input
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900"
                placeholder="PPM, Daily, Limo…"
                value={teamForm.team_type}
                onChange={(e) => setTeamForm((f) => ({ ...f, team_type: e.target.value }))}
              />
            </label>
            <div className="text-xs font-medium text-gray-500">
              Colour
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setTeamForm((f) => ({ ...f, color: c.key }))}
                    className={`w-7 h-7 rounded-full ${c.dot} transition ${
                      teamForm.color === c.key ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'
                    }`}
                    aria-label={c.key}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={busy} className="px-4 py-2 bg-teal-600 text-white text-sm rounded-xl hover:bg-teal-700 disabled:opacity-50">
              {busy ? 'Saving…' : editingTeamId ? 'Save changes' : 'Create team'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTeamForm(false);
                setEditingTeamId(null);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-600 border-t-transparent" />
        </div>
      ) : (
        <div className={`grid grid-cols-1 lg:grid-cols-4 gap-5 ${busy ? 'opacity-80 pointer-events-none' : ''}`}>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverPool(true);
            }}
            onDragLeave={() => setDragOverPool(false)}
            onDrop={dropOnPool}
            className={`lg:col-span-1 bg-white border rounded-2xl self-start sticky top-4 overflow-hidden shadow-sm transition-all ${
              dragOverPool ? 'border-teal-400 ring-2 ring-teal-100 scale-[1.01]' : 'border-gray-200'
            }`}
          >
            <div className="bg-gradient-to-r from-slate-800 to-slate-600 text-white px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-white/80" />
                  Unassigned
                </h3>
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">{pool.length}</span>
              </div>
              <p className="text-[11px] text-white/70 mt-1">Drop here to return a driver to the pool</p>
            </div>
            <div className="p-3">
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search drivers…"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2 max-h-[68vh] overflow-y-auto pr-0.5">
                {pool.length === 0 ? (
                  <div className="text-center py-10 px-3">
                    <UserCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {drivers.length === 0 ? 'No drivers found.' : 'All drivers allocated.'}
                    </p>
                  </div>
                ) : (
                  pool.map((d) => (
                    <DriverChip
                      key={d.id}
                      name={d.full_name}
                      subtitle={d.designation || d.team_type || ''}
                      avatarClass="bg-slate-100 text-slate-600"
                      isDragging={draggingKey === d.id}
                      onDragStart={(e) => {
                        handleDragStart(e, { driverId: d.id, fromMemberId: null, fromTeamId: null });
                      }}
                      onDragEnd={handleDragEnd}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {teams.length === 0 ? (
              <OperationEmptyState
                icon={LayoutGrid}
                title="No teams yet"
                description="Create your first team, then drag drivers from the pool to build the allocation."
                action={
                  <button
                    type="button"
                    onClick={openCreateTeam}
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create team
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {teams.map((team) => {
                  const c = colorOf(team.color);
                  const members = [...(team.operation_team_members || [])]
                    .filter((m) => m.is_active !== false)
                    .sort((a, b) => {
                      const lead = (a.role === 'team_lead' ? 0 : 1) - (b.role === 'team_lead' ? 0 : 1);
                      if (lead !== 0) return lead;
                      return (a.display_order ?? 0) - (b.display_order ?? 0);
                    });
                  const leaveOnTeam = members.filter((m) => m.member_status && m.member_status !== 'active').length;
                  const isOver = dragOverTeamId === team.id;
                  return (
                    <div
                      key={team.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverTeamId(team.id);
                      }}
                      onDragLeave={() => setDragOverTeamId((id) => (id === team.id ? null : id))}
                      onDrop={(e) => dropOnTeam(e, team.id)}
                      className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all ${
                        isOver ? `${c.border} ring-2 ${c.ring} scale-[1.01]` : 'border-gray-200'
                      }`}
                    >
                      <div className={`bg-gradient-to-r ${c.header} text-white px-4 py-3`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{team.name}</h3>
                              <span className="shrink-0 text-[11px] font-semibold bg-white/20 px-1.5 py-0.5 rounded-full">
                                {members.length}
                              </span>
                            </div>
                            {team.team_type && (
                              <p className="text-[11px] text-white/80 mt-0.5 truncate">{team.team_type}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditTeam(team)}
                              className="p-1.5 rounded-lg hover:bg-white/20"
                              title="Edit team"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTeam(team)}
                              className="p-1.5 rounded-lg hover:bg-white/20"
                              title="Delete team"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/90 mt-2">
                          {team.shift_label && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {team.shift_label}
                            </span>
                          )}
                          {team.week_off && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarOff className="w-3 h-3" />
                              Off {team.week_off}
                            </span>
                          )}
                          {team.area && (
                            <span className="inline-flex items-center gap-1 min-w-0">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{team.area}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={`p-3 space-y-2 min-h-[120px] ${c.soft} ${isOver ? 'bg-white' : ''}`}>
                        {members.length === 0 ? (
                          <div className={`border-2 border-dashed rounded-xl py-8 text-center ${isOver ? 'border-teal-400 bg-white' : 'border-white/80'}`}>
                            <Users className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                            <p className="text-xs text-gray-400">{isOver ? 'Release to add' : 'Drop drivers here'}</p>
                          </div>
                        ) : (
                          members.map((m, idx) => (
                            <div
                              key={m.id}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onDrop={(e) => dropOnTeam(e, team.id, idx)}
                            >
                              <DriverChip
                                name={m.drivers?.full_name || 'Driver'}
                                subtitle={m.drivers?.designation || ''}
                                avatarClass={c.avatar}
                                status={m.member_status}
                                isLead={m.role === 'team_lead'}
                                isDragging={draggingKey === m.id}
                                onDragStart={(e) =>
                                  handleDragStart(e, { driverId: m.driver_id, fromMemberId: m.id, fromTeamId: team.id })
                                }
                                onDragEnd={handleDragEnd}
                                badges={renderMemberBadges(m)}
                                menu={renderMemberMenu(team, m)}
                              />
                            </div>
                          ))
                        )}
                      </div>
                      <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                        <span>{members.length} member{members.length === 1 ? '' : 's'}</span>
                        {leaveOnTeam > 0 && (
                          <span className="text-amber-700 font-medium">{leaveOnTeam} on leave / off</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-gray-500">
        <span>{totalAllocated} allocated</span>
        <span>·</span>
        <span>{pool.length} unassigned</span>
        <span>·</span>
        <Link to="/operation/roster" className="text-teal-700 hover:underline inline-flex items-center gap-1 font-medium">
          <Calendar className="w-4 h-4" />
          Weekly roster
        </Link>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel="Delete"
        variant="danger"
        loading={busy}
        onConfirm={confirm?.onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </OperationSubLayout>
  );
};

export default OperationTeamAllocation;
