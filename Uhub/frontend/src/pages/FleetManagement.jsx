import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Plus, Search, Download, Eye, Pencil, Trash2, RefreshCw, LayoutGrid, List,
} from 'lucide-react';

import VehicleModal from '../components/fleet/VehicleModal';
import VehicleDetailsModal from '../components/fleet/VehicleDetailsModal';
import UaePlate from '../components/fleet/UaePlate';
import fleetService from '../services/fleetService';
import { useToast } from '../context/ToastContext';
import { getCarDisplayName, businessTypeBadgeClass, statusBadgeClass } from '../utils/fleetRecordUtils';
import {
  expiryStatus,
  EXPIRY_STYLES,
  formatShortDate,
} from '../utils/mulkiyaExpiryUtils';
import OperationBreadcrumb from '../components/operation/OperationBreadcrumb';
import OperationPageHeader from '../components/operation/OperationPageHeader';
import OperationStatCard from '../components/operation/OperationStatCard';
import OperationEmptyState from '../components/operation/OperationEmptyState';
import ConfirmDialog from '../components/operation/ConfirmDialog';
import FilterChip from '../components/operation/FilterChip';

function isMulkiyaDue(vehicle) {
  const status = expiryStatus(vehicle.registration_expiry);
  return status === 'expired' || status === 'this_month' || status === 'next_30';
}

function ExpiryChip({ label, date }) {
  const status = expiryStatus(date);
  const style = EXPIRY_STYLES[status] || EXPIRY_STYLES.none;
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
      <span className={`inline-flex mt-0.5 px-1.5 py-0.5 rounded-full border text-[11px] font-medium ${style.badge}`}>
        {date ? formatShortDate(date) : 'No date'}
      </span>
    </div>
  );
}

const FleetVehicleCard = ({ vehicle, onOpen, onEdit, onDelete }) => {
  const year = vehicle.year || '';
  const driver = vehicle.employees?.full_name;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-indigo-300 transition-colors">
      <button type="button" onClick={() => onOpen(vehicle.id)} className="w-full text-left flex">
        <div className="w-28 shrink-0 bg-slate-100">
          {vehicle.fleet_image_url ? (
            <img src={vehicle.fleet_image_url} alt="" className="w-full h-full object-cover min-h-[9rem]" />
          ) : (
            <div className="h-full min-h-[9rem] flex items-center justify-center text-slate-400">
              <Car className="w-8 h-8" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <UaePlate plate={vehicle.license_plate} />
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadgeClass(vehicle.status)}`}>
              {vehicle.status || '—'}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">
            {vehicle.make || '—'} {vehicle.model || ''}
            {year ? <span className="text-gray-500 font-medium"> · {year}</span> : null}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {vehicle.vehicle_number || '—'}
            {vehicle.business_type ? ` · ${vehicle.business_type}` : ''}
          </p>
          <p className="text-xs text-gray-600 mt-1 truncate">
            {driver || 'Unassigned'}
            {vehicle.mileage != null ? ` · ${Number(vehicle.mileage).toLocaleString()} km` : ''}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <ExpiryChip label="Mulkiya" date={vehicle.registration_expiry} />
            <ExpiryChip label="Insurance" date={vehicle.insurance_expiry} />
          </div>
        </div>
      </button>
      <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => onOpen(vehicle.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
          title="Open profile"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(vehicle)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(vehicle.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const FleetManagement = ({
  pageTitle = 'Fleet Management',
  profileBasePath = null,
  excludeSampleData = false,
  embedded = false,
}) => {
  const embeddedMode = embedded || !!profileBasePath;
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [fleetData, setFleetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: '', make: '' });
  const [statistics, setStatistics] = useState({
    total_vehicles: 0,
    active_vehicles: 0,
    maintenance_vehicles: 0,
    out_of_service_vehicles: 0,
    total_mileage: 0,
    avg_fuel_efficiency: 0,
  });
  const [viewMode, setViewMode] = useState('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [quickFilter, setQuickFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadFleetData = useCallback(async ({ quiet } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      const data = await fleetService.getVehicles({ excludeSampleData });
      setFleetData(data || []);
    } catch (error) {
      console.error('Error loading fleet data:', error);
      showError('Failed to load fleet data');
      setFleetData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [excludeSampleData, showError]);

  const loadStatistics = useCallback(async () => {
    try {
      const data = await fleetService.getFleetStatistics();
      setStatistics(data || {
        total_vehicles: 0,
        active_vehicles: 0,
        maintenance_vehicles: 0,
        out_of_service_vehicles: 0,
        total_mileage: 0,
        avg_fuel_efficiency: 0,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, []);

  useEffect(() => {
    loadFleetData();
    loadStatistics();
  }, [loadFleetData, loadStatistics]);

  const handleRefresh = () => {
    loadFleetData({ quiet: true });
    loadStatistics();
  };

  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setShowAddModal(true);
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowEditModal(true);
  };

  const handleViewVehicle = (vehicleId) => {
    if (profileBasePath) {
      navigate(`${profileBasePath}/${vehicleId}`);
      return;
    }
    setSelectedVehicleId(vehicleId);
    setShowDetailsModal(true);
  };

  const opsCounts = useMemo(() => {
    const unassigned = fleetData.filter((v) => !v.employees?.full_name).length;
    const mulkiyaDue = fleetData.filter(isMulkiyaDue).length;
    const noPhoto = fleetData.filter((v) => !v.fleet_image_url).length;
    return { unassigned, mulkiyaDue, noPhoto };
  }, [fleetData]);

  const displayedFleet = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return fleetData.filter((v) => {
      if (filters.status && v.status !== filters.status) return false;
      if (filters.make && v.make !== filters.make) return false;
      if (quickFilter === 'Active' && v.status !== 'Active') return false;
      if (quickFilter === 'Maintenance' && v.status !== 'Maintenance') return false;
      if (quickFilter === 'PPM' && v.business_type !== 'PPM') return false;
      if (quickFilter === 'Daily' && v.business_type !== 'Daily') return false;
      if (quickFilter === 'EV' && v.powertrain_type !== 'EV') return false;
      if (quickFilter === 'unassigned' && v.employees?.full_name) return false;
      if (quickFilter === 'mulkiya' && !isMulkiyaDue(v)) return false;
      if (quickFilter === 'nophoto' && v.fleet_image_url) return false;
      if (!q) return true;
      const blob = [
        v.vehicle_number, v.license_plate, v.make, v.model, v.car_name, v.owned_by,
        v.employees?.full_name, v.vin,
      ].join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [fleetData, searchTerm, filters, quickFilter]);

  const makes = useMemo(
    () => Array.from(new Set(fleetData.map((v) => v.make).filter(Boolean))).sort(),
    [fleetData]
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fleetService.deleteVehicle(deleteTarget);
      setDeleteTarget(null);
      loadFleetData({ quiet: true });
      loadStatistics();
      success('Vehicle deleted');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showError(error.message || 'Failed to delete vehicle');
    } finally {
      setDeleting(false);
    }
  };

  const handleModalSuccess = () => {
    loadFleetData({ quiet: true });
    loadStatistics();
    success('Vehicle saved');
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDetailsModal(false);
    setSelectedVehicle(null);
    setSelectedVehicleId(null);
  };

  const exportCsv = () => {
    const rows = [
      ['Vehicle number', 'Plate', 'Make', 'Model', 'Year', 'Status', 'Business', 'Driver', 'Mulkiya expiry', 'Insurance expiry', 'Mileage'],
      ...displayedFleet.map((v) => [
        v.vehicle_number, v.license_plate, v.make, v.model, v.year, v.status,
        v.business_type, v.employees?.full_name, v.registration_expiry, v.insurance_expiry, v.mileage,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fleet-records.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const chips = [
    { id: 'all', label: 'All', count: fleetData.length },
    { id: 'Active', label: 'Active', count: statistics.active_vehicles },
    { id: 'Maintenance', label: 'Maintenance', count: statistics.maintenance_vehicles },
    { id: 'PPM', label: 'PPM' },
    { id: 'Daily', label: 'Daily' },
    { id: 'EV', label: 'EV' },
    { id: 'unassigned', label: 'Unassigned', count: opsCounts.unassigned },
    { id: 'mulkiya', label: 'Mulkiya due', count: opsCounts.mulkiyaDue },
    { id: 'nophoto', label: 'No photo', count: opsCounts.noPhoto },
  ];

  if (loading && fleetData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <OperationBreadcrumb items={[{ label: embeddedMode ? 'Fleet Record' : pageTitle }]} />
        <OperationPageHeader
          icon={Car}
          title={pageTitle}
          description="Browse vehicles, open profiles, and manage fleet photos and documents."
          actions={
            <>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-white flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-white flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                type="button"
                onClick={handleAddVehicle}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add vehicle
              </button>
            </>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <OperationStatCard label="Total" value={statistics.total_vehicles} tone="blue" icon={Car} />
          <OperationStatCard label="Active" value={statistics.active_vehicles} tone="green" />
          <OperationStatCard label="Maintenance" value={statistics.maintenance_vehicles} tone="yellow" />
          <OperationStatCard label="Out of service" value={statistics.out_of_service_vehicles} tone="red" />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button type="button" onClick={() => setQuickFilter('unassigned')} className="text-left">
            <OperationStatCard label="Unassigned" value={opsCounts.unassigned} tone="slate" sub="No driver on record" />
          </button>
          <button type="button" onClick={() => setQuickFilter('mulkiya')} className="text-left">
            <OperationStatCard label="Mulkiya due" value={opsCounts.mulkiyaDue} tone="yellow" sub="Expired or next 30 days" />
          </button>
          <button type="button" onClick={() => setQuickFilter('nophoto')} className="text-left">
            <OperationStatCard label="No photo" value={opsCounts.noPhoto} tone="indigo" sub="Missing fleet image" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 mb-6 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="search"
                placeholder="Search plate, make, model, driver…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">All status</option>
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Out of Service">Out of Service</option>
              <option value="Retired">Retired</option>
            </select>
            <select
              value={filters.make}
              onChange={(e) => setFilters((prev) => ({ ...prev, make: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">All makes</option>
              {makes.map((make) => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white text-blue-600' : 'text-gray-500'}`}
                title="Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white text-blue-600' : 'text-gray-500'}`}
                title="List"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            {chips.map((chip) => (
              <FilterChip
                key={chip.id}
                label={chip.label}
                count={chip.count}
                active={quickFilter === chip.id}
                onClick={() => setQuickFilter(chip.id)}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{displayedFleet.length} vehicles</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {statistics.total_mileage?.toLocaleString() || 0} km fleet · avg {statistics.avg_fuel_efficiency?.toFixed(1) || '0'} km/l
              </p>
            </div>
          </div>

          {displayedFleet.length === 0 ? (
            <OperationEmptyState
              icon={Car}
              title="No vehicles found"
              description={searchTerm || filters.status || filters.make || quickFilter !== 'all'
                ? 'Try another search or clear the chips above.'
                : 'Add the first vehicle to start the fleet record.'}
              action={
                !searchTerm && !filters.status && !filters.make && quickFilter === 'all' ? (
                  <button
                    type="button"
                    onClick={handleAddVehicle}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add vehicle
                  </button>
                ) : null
              }
            />
          ) : viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Vehicle', 'Plate', 'Status', 'Driver', 'Mulkiya', 'Insurance', ''].map((h) => (
                      <th key={h || 'actions'} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedFleet.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => handleViewVehicle(vehicle.id)} className="flex items-center gap-3 text-left">
                          {vehicle.fleet_image_url ? (
                            <img src={vehicle.fleet_image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Car className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <span>
                            <span className="block font-medium text-gray-900">{getCarDisplayName(vehicle)}</span>
                            <span className="block text-xs text-gray-500">{vehicle.vehicle_number}</span>
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3"><UaePlate plate={vehicle.license_plate} size="sm" /></td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadgeClass(vehicle.status)}`}>{vehicle.status}</span>
                        {vehicle.business_type ? (
                          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${businessTypeBadgeClass(vehicle.business_type)}`}>{vehicle.business_type}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{vehicle.employees?.full_name || '—'}</td>
                      <td className="px-4 py-3 text-xs">{formatShortDate(vehicle.registration_expiry)}</td>
                      <td className="px-4 py-3 text-xs">{formatShortDate(vehicle.insurance_expiry)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button type="button" onClick={() => handleViewVehicle(vehicle.id)} className="text-blue-600 hover:underline text-xs mr-2">Open</button>
                        <button type="button" onClick={() => handleEditVehicle(vehicle)} className="text-emerald-600 hover:underline text-xs mr-2">Edit</button>
                        <button type="button" onClick={() => setDeleteTarget(vehicle.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayedFleet.map((vehicle) => (
                <FleetVehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onOpen={handleViewVehicle}
                  onEdit={handleEditVehicle}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete vehicle?"
        message="This action cannot be undone. All linked documents will be removed."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <VehicleModal
        isOpen={showAddModal}
        onClose={handleCloseModals}
        onSuccess={handleModalSuccess}
      />
      <VehicleModal
        isOpen={showEditModal}
        onClose={handleCloseModals}
        vehicle={selectedVehicle}
        onSuccess={handleModalSuccess}
      />
      <VehicleDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseModals}
        vehicleId={selectedVehicleId}
      />
    </div>
  );
};

export default FleetManagement;
