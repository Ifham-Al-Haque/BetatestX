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
} from 'lucide-react';
import OperationSubLayout from '../../components/operation/OperationSubLayout';
import OperationEmptyState from '../../components/operation/OperationEmptyState';
import ConfirmDialog from '../../components/operation/ConfirmDialog';
import operationService from '../../services/operationService';
import { useToast } from '../../context/ToastContext';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const COLORS = [
  { key: 'blue', header: 'bg-blue-600', soft: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  { key: 'green', header: 'bg-green-600', soft: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
  { key: 'amber', header: 'bg-amber-500', soft: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  { key: 'orange', header: 'bg-orange-600', soft: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  { key: 'indigo', header: 'bg-indigo-600', soft: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500' },
  { key: 'purple', header: 'bg-purple-600', soft: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  { key: 'teal', header: 'bg-teal-600', soft: 'bg-teal-50 border-teal-200', dot: 'bg-teal-500' },
  { key: 'red', header: 'bg-red-600', soft: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
  { key: 'gray', header: 'bg-gray-600', soft: 'bg-gray-50 border-gray-200', dot: 'bg-gray-500' },
];

const colorOf = (key) => COLORS.find((c) => c.key === key) || COLORS[0];

const STATUS_LABEL = {
  active: null,
  annual_leave: 'Annual Leave',
  sick_leave: 'Sick Leave',
  off: 'Off',
};

const emptyTeamForm = { name: '', team_type: '', shift_label: '', week_off: '', area: '', color: 'blue' };

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

  // ---- Drag & drop -----------------------------------------------------------
  const handleDragStart = (e, payload) => {
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
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
  const DriverChip = ({ name, draggablePayload, badges, menu, subtitle }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, draggablePayload)}
      className="group flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm shadow-sm hover:shadow cursor-grab active:cursor-grabbing"
    >
      <GripVertical className="w-3.5 h-3.5 text-gray-300 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-gray-900 font-medium leading-tight">{name}</p>
        {subtitle && <p className="truncate text-[11px] text-gray-400 leading-tight">{subtitle}</p>}
      </div>
      {badges}
      {menu}
    </div>
  );

  return (
    <OperationSubLayout
      breadcrumbs={[
        { label: 'Schedule & Roster', href: '/operation/roster' },
        { label: 'Team Allocation' },
      ]}
      title="Team Allocation"
      description="Drag drivers into teams to build the weekly allocation. Set team leads, mark leave, and export to Excel."
      icon={Users}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1 bg-white"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={triggerImport}
            disabled={importing}
            className="px-3 py-2 text-sm border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-1 bg-white disabled:opacity-50"
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
            className="px-3 py-2 text-sm border border-green-200 text-green-700 rounded-lg hover:bg-green-50 flex items-center gap-1 bg-white disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={openCreateTeam}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            New team
          </button>
        </div>
      }
    >
      {tablesMissing && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Team allocation tables are not set up yet. Run{' '}
          <code className="text-xs bg-amber-100 px-1 rounded">operation_team_allocation_schema.sql</code> in Supabase.
        </div>
      )}

      {showTeamForm && (
        <form onSubmit={submitTeam} className="mb-6 bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3">{editingTeamId ? 'Edit team' : 'Create team'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Team name (e.g. DXB Morning Team 1)"
              value={teamForm.name}
              onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Schedule (e.g. 7 AM - 5 PM)"
              value={teamForm.shift_label}
              onChange={(e) => setTeamForm((f) => ({ ...f, shift_label: e.target.value }))}
            />
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={teamForm.week_off}
              onChange={(e) => setTeamForm((f) => ({ ...f, week_off: e.target.value }))}
            >
              <option value="">Week off…</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Area (e.g. Marina To Business Bay)"
              value={teamForm.area}
              onChange={(e) => setTeamForm((f) => ({ ...f, area: e.target.value }))}
            />
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Team type (optional)"
              value={teamForm.team_type}
              onChange={(e) => setTeamForm((f) => ({ ...f, team_type: e.target.value }))}
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setTeamForm((f) => ({ ...f, color: c.key }))}
                  className={`w-6 h-6 rounded-full ${c.dot} ${
                    teamForm.color === c.key ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  aria-label={c.key}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button type="submit" disabled={busy} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              {busy ? 'Saving…' : editingTeamId ? 'Save changes' : 'Create team'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTeamForm(false);
                setEditingTeamId(null);
              }}
              className="px-4 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Unassigned pool */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverPool(true);
            }}
            onDragLeave={() => setDragOverPool(false)}
            onDrop={dropOnPool}
            className={`lg:col-span-1 bg-white border rounded-xl p-3 self-start sticky top-4 transition-colors ${
              dragOverPool ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-500" />
                Unassigned ({pool.length})
              </h3>
            </div>
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search drivers…"
                className="w-full border border-gray-200 rounded-lg pl-8 pr-2 py-1.5 text-sm"
              />
            </div>
            <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
              {pool.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  {drivers.length === 0 ? 'No drivers found.' : 'All drivers allocated.'}
                </p>
              ) : (
                pool.map((d) => (
                  <DriverChip
                    key={d.id}
                    name={d.full_name}
                    subtitle={d.designation || d.team_type || ''}
                    draggablePayload={{ driverId: d.id, fromMemberId: null, fromTeamId: null }}
                  />
                ))
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Drag a name onto a team to allocate. Drop here to unassign.</p>
          </div>

          {/* Team columns */}
          <div className="lg:col-span-3">
            {teams.length === 0 ? (
              <OperationEmptyState
                icon={Users}
                title="No teams yet"
                description="Create your first team, then drag drivers from the pool to build the allocation."
                action={
                  <button
                    type="button"
                    onClick={openCreateTeam}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create team
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((team) => {
                  const c = colorOf(team.color);
                  const members = [...(team.operation_team_members || [])]
                    .filter((m) => m.is_active !== false)
                    .sort((a, b) => (a.role === 'team_lead' ? -1 : 1) - (b.role === 'team_lead' ? -1 : 1));
                  return (
                    <div
                      key={team.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverTeamId(team.id);
                      }}
                      onDragLeave={() => setDragOverTeamId((id) => (id === team.id ? null : id))}
                      onDrop={(e) => dropOnTeam(e, team.id)}
                      className={`bg-white border rounded-xl overflow-hidden transition-colors ${
                        dragOverTeamId === team.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'
                      }`}
                    >
                      <div className={`${c.header} text-white px-4 py-2.5 flex items-start justify-between gap-2`}>
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{team.name}</h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-white/85 mt-0.5">
                            {team.shift_label && <span>🕗 {team.shift_label}</span>}
                            {team.week_off && <span>Off: {team.week_off}</span>}
                            {team.area && <span className="truncate">{team.area}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditTeam(team)}
                            className="p-1 rounded hover:bg-white/20"
                            title="Edit team"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTeam(team)}
                            className="p-1 rounded hover:bg-white/20"
                            title="Delete team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className={`p-3 space-y-1.5 min-h-[90px] ${c.soft} border-t`}>
                        {members.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4">Drop drivers here</p>
                        ) : (
                          members.map((m, idx) => {
                            const isLead = m.role === 'team_lead';
                            const statusLabel = STATUS_LABEL[m.member_status];
                            return (
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
                                draggablePayload={{ driverId: m.driver_id, fromMemberId: m.id, fromTeamId: team.id }}
                                badges={
                                  <div className="flex items-center gap-1 shrink-0">
                                    {isLead && (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                                        <Crown className="w-3 h-3" />
                                        Lead
                                      </span>
                                    )}
                                    {statusLabel && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-medium whitespace-nowrap">
                                        {statusLabel}
                                      </span>
                                    )}
                                  </div>
                                }
                                menu={
                                  <div className="relative shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setOpenMenuMemberId(openMenuMemberId === m.id ? null : m.id)}
                                      className="p-1 rounded hover:bg-gray-100 text-gray-400"
                                      title="Member actions"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    {openMenuMemberId === m.id && (
                                      <>
                                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuMemberId(null)} />
                                        <div className="absolute right-0 top-7 z-20 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm">
                                          <button
                                            type="button"
                                            onClick={() => setLead(team.id, m.id)}
                                            className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2"
                                          >
                                            <Crown className="w-3.5 h-3.5 text-yellow-600" />
                                            {isLead ? 'Is team lead' : 'Make team lead'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => toggleStatus(m, 'annual_leave')}
                                            className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2"
                                          >
                                            <Plane className="w-3.5 h-3.5 text-amber-600" />
                                            {m.member_status === 'annual_leave' ? 'Clear leave' : 'Annual leave'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => removeMember(m.id)}
                                            className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2"
                                          >
                                            <UserMinus className="w-3.5 h-3.5" />
                                            Remove from team
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                }
                              />
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="px-3 py-1.5 bg-white border-t border-gray-100 text-[11px] text-gray-400">
                        {members.length} member{members.length === 1 ? '' : 's'}
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
        <Link to="/operation/roster" className="text-blue-600 hover:underline inline-flex items-center gap-1">
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
