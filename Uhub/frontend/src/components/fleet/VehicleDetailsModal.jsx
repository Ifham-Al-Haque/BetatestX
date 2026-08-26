import React, { useState, useEffect } from 'react';
import { X, Car, Wrench, Fuel, AlertTriangle, Calendar, DollarSign, FileText, LayoutGrid, PieChart, UserX, CheckCircle, Clock } from 'lucide-react';
import fleetService from '../../services/fleetService';
import fleetOffboardingService, { OFFBOARDING_REASONS } from '../../services/fleetOffboardingService';
import FleetVehicleMediaSection from './FleetVehicleMediaSection';
import FleetRecordOverview from './FleetRecordOverview';
import FleetRecordEconomicsTab from './FleetRecordEconomicsTab';
import StartFleetOffboardingModal from './StartFleetOffboardingModal';
import UaePlate from './UaePlate';
import { getCarDisplayName, formatFleetCurrency, statusBadgeClass } from '../../utils/fleetRecordUtils';
import OperationBreadcrumb from '../operation/OperationBreadcrumb';

const VehicleDetailsModal = ({
  isOpen,
  onClose,
  vehicleId,
  variant = 'modal',
  listPath = '/operation/fleet-records',
}) => {
  const isPage = variant === 'page';
  const [vehicle, setVehicle] = useState(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [offboardingRecord, setOffboardingRecord] = useState(null);
  const [showOffboardModal, setShowOffboardModal] = useState(false);

  useEffect(() => {
    if (vehicleId && (isPage || isOpen)) {
      loadVehicleDetails();
    }
  }, [isOpen, vehicleId, isPage]);

  const loadVehicleDetails = async () => {
    try {
      setLoading(true);
      const [vehicleData, maintenanceData, fuelData, incidentsData, offboarding] = await Promise.all([
        fleetService.getVehicle(vehicleId),
        fleetService.getMaintenanceRecords(vehicleId),
        fleetService.getFuelLogs(vehicleId),
        fleetService.getIncidents(vehicleId),
        fleetOffboardingService.getRecordByVehicleId(vehicleId)
      ]);

      setVehicle(vehicleData);
      setMaintenanceRecords(maintenanceData);
      setFuelLogs(fuelData);
      setIncidents(incidentsData);
      setOffboardingRecord(offboarding);
    } catch (error) {
      console.error('Error loading vehicle details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (amount == null || amount === '') return 'Not set';
    return formatFleetCurrency(amount);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Minor':
        return 'bg-blue-100 text-blue-800';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Major':
        return 'bg-orange-100 text-orange-800';
      case 'Critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isPage && (!isOpen || !vehicleId)) return null;
  if (isPage && !vehicleId) return null;

  if (loading) {
    if (isPage) {
      return (
        <div className="min-h-screen bg-gray-50 flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      );
    }
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading vehicle details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    if (isPage) {
      return (
        <div className="min-h-screen bg-gray-50 px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <OperationBreadcrumb items={[{ label: 'Fleet Record', href: listPath }, { label: 'Not found' }]} />
            <p className="text-gray-600">Vehicle not found.</p>
            <button type="button" onClick={onClose} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Back to Fleet Record
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <p className="text-gray-600">Vehicle not found</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isPage ? 'min-h-screen bg-gray-50 py-6 px-4' : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'}>
      <div className={isPage ? 'w-full max-w-6xl mx-auto' : 'bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto'}>
        {isPage && (
          <OperationBreadcrumb
            items={[
              { label: 'Fleet Record', href: listPath },
              { label: vehicle.license_plate || vehicle.vehicle_number || 'Vehicle' },
            ]}
          />
        )}
        <div className={isPage ? 'bg-white rounded-2xl border border-gray-200 overflow-hidden' : ''}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-gray-200 flex items-center justify-center shrink-0">
              {vehicle.fleet_image_url ? (
                <img src={vehicle.fleet_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Car className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <UaePlate plate={vehicle.license_plate} />
              <h2 className="text-xl font-semibold text-gray-900 mt-1.5 truncate">
                {getCarDisplayName(vehicle)}
              </h2>
              <p className="text-sm text-gray-500 truncate">
                {vehicle.vehicle_number}
                {vehicle.year ? ` · ${vehicle.year}` : ''}
                {vehicle.employees?.full_name ? ` · ${vehicle.employees.full_name}` : ''}
              </p>
            </div>
            <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(vehicle.status)}`}>
              {vehicle.status}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {(() => {
              const offComplete = vehicle.status === 'Retired' || offboardingRecord?.status === 'completed';
              const offActive = offboardingRecord && offboardingRecord.status !== 'completed';
              if (offComplete) {
                return (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                    <UserX className="w-3.5 h-3.5" /> Offboarded
                  </span>
                );
              }
              if (offActive) {
                return (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <Clock className="w-3.5 h-3.5" /> Offboarding in progress
                  </span>
                );
              }
              return (
                <button
                  onClick={() => setShowOffboardModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                >
                  <UserX className="w-4 h-4" /> Offboard
                </button>
              );
            })()}
            {!isPage && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap gap-x-6 gap-y-1 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutGrid },
              { id: 'fleet', label: 'Fleet & Documents', icon: FileText },
              { id: 'economics', label: 'Unit economics', icon: PieChart },
              { id: 'maintenance', label: 'Maintenance', icon: Wrench },
              { id: 'fuel', label: 'Fuel Logs', icon: Fuel },
              { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <FleetRecordOverview
              vehicle={vehicle}
              maintenanceRecords={maintenanceRecords}
              fuelLogs={fuelLogs}
              incidents={incidents}
              onTabChange={setActiveTab}
            />
          )}

          {activeTab === 'economics' && (
            <FleetRecordEconomicsTab
              vehicle={vehicle}
              maintenanceRecords={maintenanceRecords}
              fuelLogs={fuelLogs}
              incidents={incidents}
            />
          )}

          {/* Details Tab */}
          {activeTab === 'overview' && (
            <div className="mt-10 pt-8 border-t border-gray-200 space-y-6">
              <h3 className="text-sm font-semibold text-gray-900">Record details</h3>
              {/* Vehicle Lifecycle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                    Onboarding
                  </h3>
                  {vehicle.onboarding_status ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium">{vehicle.onboarding_status}</span>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{vehicle.onboarding_progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${vehicle.onboarding_progress || 0}%` }} />
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Started:</span>
                        <span className="font-medium">{formatDate(vehicle.onboarding_started_at || vehicle.created_at)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Added directly to Fleet Records (not onboarded through the onboarding workflow).</p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <UserX className="w-5 h-5 mr-2 text-red-600" />
                    Offboarding
                  </h3>
                  {offboardingRecord ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium capitalize">{(offboardingRecord.status || '').replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reason:</span>
                        <span className="font-medium">{OFFBOARDING_REASONS.find((r) => r.value === offboardingRecord.reason)?.label || offboardingRecord.reason || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{formatDate(offboardingRecord.offboarding_date)}</span>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{offboardingRecord.progress_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-red-600 h-2 rounded-full" style={{ width: `${offboardingRecord.progress_percentage || 0}%` }} />
                        </div>
                      </div>
                    </div>
                  ) : vehicle.status === 'Retired' ? (
                    <p className="text-sm text-gray-500">This vehicle is retired.</p>
                  ) : (
                    <p className="text-sm text-gray-500">Active in fleet. Use the Offboard button above to start offboarding.</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service specs</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Transmission</div>
                    <div className="font-medium">{vehicle.transmission || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Engine size</div>
                    <div className="font-medium">{vehicle.engine_size || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Mileage</div>
                    <div className="font-medium">{vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} km` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Fuel efficiency</div>
                    <div className="font-medium">{vehicle.fuel_efficiency ? `${vehicle.fuel_efficiency} km/l` : '—'}</div>
                  </div>
                </div>
              </div>

              {/* Ownership & Contract */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Ownership & Contract
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Car owned by</div>
                    <div className="font-medium">{vehicle.owned_by || 'Not specified'}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Contract number</div>
                    <div className="font-medium">{vehicle.contract_number || 'Not specified'}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Contract expiry</div>
                    <div className="font-medium">{formatDate(vehicle.contract_expiry)}</div>
                  </div>
                </div>
              </div>

              {/* Important Dates */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Important Dates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Purchase Date</div>
                    <div className="font-medium">{formatDate(vehicle.purchase_date)}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Insurance Expiry</div>
                    <div className="font-medium">{formatDate(vehicle.insurance_expiry)}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Registration / Mulkiya Expiry</div>
                    <div className="font-medium">{formatDate(vehicle.registration_expiry)}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Mulkiya Number</div>
                    <div className="font-medium">{vehicle.mulkiya_number || 'Not specified'}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Mulkiya Document</div>
                    <div className="font-medium">
                      {vehicle.mulkiya_document_url ? (
                        <a
                          href={vehicle.mulkiya_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <FileText className="w-4 h-4" /> View
                        </a>
                      ) : (
                        'Not attached'
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Last Service</div>
                    <div className="font-medium">{formatDate(vehicle.last_service_date)}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Next Service</div>
                    <div className="font-medium">{formatDate(vehicle.next_service_date)}</div>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Financial Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Purchase Price</div>
                    <div className="font-medium">{formatCurrency(vehicle.purchase_price)}</div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {vehicle.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                  <p className="text-gray-700">{vehicle.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'fleet' && (
            <FleetVehicleMediaSection
              vehicleId={vehicleId}
              fleetImageUrl={vehicle.fleet_image_url}
              onFleetImageUpdated={(url) => setVehicle((v) => (v ? { ...v, fleet_image_url: url } : v))}
            />
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Maintenance Records</h3>
                <span className="text-sm text-gray-500">
                  {maintenanceRecords.length} record(s)
                </span>
              </div>
              
              {maintenanceRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No maintenance records found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {maintenanceRecords.map((record) => (
                    <div key={record.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            record.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {record.maintenance_type}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(record.service_date)}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-2">{record.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Service Provider:</span>
                          <p className="font-medium">{record.service_provider || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Cost:</span>
                          <p className="font-medium">{formatCurrency(record.cost)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Mileage:</span>
                          <p className="font-medium">{record.mileage_at_service?.toLocaleString()} km</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Next Service:</span>
                          <p className="font-medium">{formatDate(record.next_service_date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fuel Tab */}
          {activeTab === 'fuel' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Fuel Logs</h3>
                <span className="text-sm text-gray-500">
                  {fuelLogs.length} record(s)
                </span>
              </div>
              
              {fuelLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Fuel className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No fuel logs found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fuelLogs.map((log) => (
                    <div key={log.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">
                            {log.fuel_type}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(log.fuel_date)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Quantity:</span>
                          <p className="font-medium">{log.quantity_liters}L</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Cost per Liter:</span>
                          <p className="font-medium">{formatCurrency(log.cost_per_liter)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Cost:</span>
                          <p className="font-medium">{formatCurrency(log.total_cost)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Mileage:</span>
                          <p className="font-medium">{log.mileage_at_fuel?.toLocaleString()} km</p>
                        </div>
                      </div>
                      {log.fuel_station && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Station: </span>
                          <span className="font-medium">{log.fuel_station}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Incidents Tab */}
          {activeTab === 'incidents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Incidents</h3>
                <span className="text-sm text-gray-500">
                  {incidents.length} incident(s)
                </span>
              </div>
              
              {incidents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No incidents reported</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                            {incident.severity}
                          </span>
                          <span className="text-sm text-gray-500">
                            {incident.incident_type}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(incident.incident_date)}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-2">{incident.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Location:</span>
                          <p className="font-medium">{incident.location || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <p className="font-medium">{incident.status}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Estimated Cost:</span>
                          <p className="font-medium">{formatCurrency(incident.estimated_cost)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Actual Cost:</span>
                          <p className="font-medium">{formatCurrency(incident.actual_cost)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      <StartFleetOffboardingModal
        isOpen={showOffboardModal}
        onClose={() => setShowOffboardModal(false)}
        vehicle={vehicle}
        onSuccess={loadVehicleDetails}
      />
    </div>
  );
};

export default VehicleDetailsModal;
