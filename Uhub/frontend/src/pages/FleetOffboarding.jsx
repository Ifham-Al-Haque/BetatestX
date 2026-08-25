import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Car, UserX, Plus, Search, Filter, Eye, AlertTriangle, Clock, CheckSquare, TrendingUp, ChevronRight
} from 'lucide-react';
import fleetService from '../services/fleetService';
import fleetOffboardingService, { OFFBOARDING_REASONS } from '../services/fleetOffboardingService';
import { useToast } from '../context/ToastContext';
import OperationStatCard from '../components/operation/OperationStatCard';

const FleetOffboarding = ({ embedded = false }) => {
  const { userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [offboardingRecords, setOffboardingRecords] = useState([]);
  const [statistics, setStatistics] = useState({ total: 0, completed: 0, in_progress: 0, not_started: 0, on_hold: 0 });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [startForm, setStartForm] = useState({
    vehicle_id: '',
    reason: '',
    offboarding_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadVehicles = useCallback(async () => {
    try {
      const data = await fleetService.getVehicles({ status: 'Active' });
      setVehicles(data || []);
    } catch (e) {
      console.warn('Load vehicles for offboarding:', e);
      setVehicles([]);
    }
  }, []);

  const loadFleetOffboardingData = useCallback(async () => {
    try {
      setLoading(true);
      const [records, stats] = await Promise.all([
        fleetOffboardingService.getRecords({
          status: statusFilter || undefined,
          date_from: dateFilter || undefined,
          date_to: dateFilter || undefined,
          search: searchTerm.trim() || undefined,
        }),
        fleetOffboardingService.getStatistics(),
      ]);
      setOffboardingRecords(records);
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading fleet offboarding data:', err);
      showError('Failed to load offboarding records');
      setOffboardingRecords([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter, searchTerm, showError]);

  useEffect(() => {
    loadFleetOffboardingData();
  }, [loadFleetOffboardingData]);

  useEffect(() => {
    if (showStartModal) loadVehicles();
  }, [showStartModal, loadVehicles]);

  const handleStartOffboarding = () => {
    setStartForm({
      vehicle_id: '',
      reason: '',
      offboarding_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowStartModal(true);
  };

  const handleSubmitStart = async () => {
    if (!startForm.vehicle_id) {
      showError('Please select a vehicle');
      return;
    }
    setSubmitting(true);
    try {
      await fleetOffboardingService.startOffboarding({
        vehicle_id: startForm.vehicle_id,
        reason: startForm.reason,
        offboarding_date: startForm.offboarding_date,
        notes: startForm.notes,
        started_by: userProfile?.id || null,
      });
      success('Offboarding started');
      setShowStartModal(false);
      loadFleetOffboardingData();
    } catch (err) {
      showError(err?.message || 'Failed to start offboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (record) => {
    try {
      const full = await fleetOffboardingService.getRecordById(record.id);
      setSelectedRecord(full);
    } catch (e) {
      showError('Failed to load details');
    }
  };

  const handleToggleChecklistItem = async (item, recordId) => {
    try {
      await fleetOffboardingService.updateChecklistItem(item.id, {
        completed: !item.completed,
        completed_by: userProfile?.id,
      });
      const updated = await fleetOffboardingService.getRecordById(recordId);
      setOffboardingRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, ...updated, checklist_items: updated.checklist_items } : r)));
      if (selectedRecord?.id === recordId) setSelectedRecord(updated);
      success('Checklist updated');
    } catch (e) {
      showError('Failed to update item');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckSquare;
      case 'in_progress': return TrendingUp;
      case 'on_hold': return AlertTriangle;
      case 'not_started': return Clock;
      default: return Clock;
    }
  };

  if (loading && offboardingRecords.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-50'}>
      <div className={embedded ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {!embedded && (
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserX className="w-7 h-7 mr-3 text-red-600" />
              Fleet Offboarding
            </h1>
            <p className="text-gray-600 mt-1 text-sm">Retire vehicles from the active fleet</p>
          </div>
          <button
            onClick={handleStartOffboarding}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Offboarding
          </button>
        </div>
        )}
        {embedded && (
          <div className="flex justify-end mb-6">
            <button
              onClick={handleStartOffboarding}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Start Offboarding
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <OperationStatCard label="Total offboarding" value={statistics.total} tone="red" icon={Car} />
          <OperationStatCard label="Completed" value={statistics.completed} tone="green" icon={CheckSquare} />
          <OperationStatCard label="In progress" value={statistics.in_progress} tone="blue" icon={TrendingUp} />
          <OperationStatCard label="Not started / on hold" value={statistics.not_started + statistics.on_hold} tone="yellow" icon={AlertTriangle} />
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Filters</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Fleet Offboarding Records</h2>
            {offboardingRecords.length === 0 ? (
              <div className="text-center py-12">
                <UserX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Fleet Offboarding Records</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first fleet offboarding process.</p>
                <button
                  onClick={handleStartOffboarding}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center mx-auto transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Start Fleet Offboarding
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {offboardingRecords.map((record) => {
                  const StatusIcon = getStatusIcon(record.status);
                  return (
                    <div
                      key={record.id}
                      className="border border-gray-200 rounded-xl p-5 hover:border-red-200 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-red-100 rounded-lg">
                            <Car className="w-6 h-6 text-red-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {record.vehicle_number || 'Vehicle'} – {record.make} {record.model}
                            </h3>
                            {record.vehicle_id && (
                              <Link
                                to={`/operation/fleet-records/${record.vehicle_id}`}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View Fleet Record →
                              </Link>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                            <StatusIcon className="w-4 h-4 inline mr-1" />
                            {record.status.replace('_', ' ')}
                          </span>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Progress</p>
                            <p className="text-lg font-semibold text-gray-900">{record.progress_percentage}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Offboarding Date</p>
                          <p className="font-medium text-gray-900">{record.offboarding_date}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Last Service Date</p>
                          <p className="font-medium text-gray-900">{record.last_service_date || '—'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Reason</p>
                          <p className="font-medium text-gray-900">{OFFBOARDING_REASONS.find((r) => r.value === record.reason)?.label || record.reason || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleViewDetails(record)}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </button>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {showStartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Start Fleet Offboarding</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Start the offboarding process for a fleet vehicle. A checklist will be created to track completion.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Vehicle</label>
                    <select
                      value={startForm.vehicle_id}
                      onChange={(e) => setStartForm((f) => ({ ...f, vehicle_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Vehicle to Offboard</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.vehicle_number} – {v.make} {v.model}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Offboarding</label>
                    <select
                      value={startForm.reason}
                      onChange={(e) => setStartForm((f) => ({ ...f, reason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Reason</option>
                      {OFFBOARDING_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Offboarding Date</label>
                    <input
                      type="date"
                      value={startForm.offboarding_date}
                      onChange={(e) => setStartForm((f) => ({ ...f, offboarding_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Additional notes..."
                      value={startForm.notes}
                      onChange={(e) => setStartForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowStartModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitStart}
                  disabled={submitting}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Starting…' : 'Start Offboarding'}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedRecord(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedRecord.vehicle_number} – {selectedRecord.make} {selectedRecord.model}
                </h2>
                <button onClick={() => setSelectedRecord(null)} className="text-gray-500 hover:text-gray-700">×</button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">Checklist – tick items when done.</p>
                <ul className="space-y-2">
                  {(selectedRecord.checklist_items || []).map((item) => (
                    <li key={item.id} className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleChecklistItem(item, selectedRecord.id)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}
                      >
                        {item.completed ? <CheckSquare className="w-4 h-4" /> : null}
                      </button>
                      <span className={item.completed ? 'text-gray-500 line-through' : ''}>{item.title}</span>
                      {item.completed_at && (
                        <span className="text-xs text-gray-400">
                          {new Date(item.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetOffboarding;
