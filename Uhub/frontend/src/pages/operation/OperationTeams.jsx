import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, UserPlus, RefreshCw, LayoutGrid } from 'lucide-react';
import OperationSubLayout from '../../components/operation/OperationSubLayout';
import OperationEmptyState from '../../components/operation/OperationEmptyState';
import operationService from '../../services/operationService';
import { useToast } from '../../context/ToastContext';

const OperationTeams = () => {
  const { success, error: showError } = useToast();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', team_type: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [tablesMissing, setTablesMissing] = useState(false);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await operationService.getTeams();
      setTeams(data);
      setTablesMissing(false);
    } catch (err) {
      if (err.code === '42P01') {
        setTablesMissing(true);
        setTeams([]);
      } else {
        showError('Failed to load teams');
      }
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await operationService.createTeam(form);
      success('Team created');
      setForm({ name: '', team_type: '', notes: '' });
      setShowForm(false);
      loadTeams();
    } catch {
      showError('Could not create team. Run operation_revamp PART D SQL if tables are missing.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OperationSubLayout
      breadcrumbs={[
        { label: 'Driver & Team Records', href: '/operation/drivers' },
        { label: 'Teams' },
      ]}
      title="Operation Teams"
      description="Group drivers into operational teams for roster and assignment planning."
      icon={Users}
      actions={
        <div className="flex gap-2">
          <Link
            to="/operation/team-allocation"
            className="px-3 py-2 text-sm border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 flex items-center gap-1"
          >
            <LayoutGrid className="w-4 h-4" />
            Allocation board
          </Link>
          <button
            type="button"
            onClick={loadTeams}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowForm(true)}
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
          Team tables are not set up yet. Run <strong>PART D</strong> of{' '}
          <code className="text-xs bg-amber-100 px-1 rounded">operation_revamp_verify_and_migrate.sql</code> in Supabase.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="font-medium text-gray-900">Create team</h3>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Team name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Team type (PPM, Daily, Limo…)"
            value={form.team_type}
            onChange={(e) => setForm((f) => ({ ...f, team_type: e.target.value }))}
          />
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Notes"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">
              {saving ? 'Saving…' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : teams.length === 0 ? (
        <OperationEmptyState
          icon={Users}
          title="No teams yet"
          description="Create operation teams to organize drivers for roster and shift planning."
          action={
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Create first team
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => {
            const members = (team.operation_team_members || []).filter((m) => m.is_active !== false);
            return (
              <div key={team.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{team.name}</h3>
                    {team.team_type && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                        {team.team_type}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      team.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {team.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-3">{members.length} member(s)</p>
                <ul className="mt-2 space-y-1">
                  {members.slice(0, 5).map((m) => (
                    <li key={m.id} className="text-sm text-gray-700">
                      {m.drivers?.full_name || 'Driver'} · {m.role}
                    </li>
                  ))}
                  {members.length > 5 && (
                    <li className="text-xs text-gray-400">+{members.length - 5} more</li>
                  )}
                </ul>
                <Link
                  to="/operation/drivers"
                  className="inline-block mt-4 text-sm text-blue-600 hover:underline"
                >
                  Manage drivers →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </OperationSubLayout>
  );
};

export default OperationTeams;
