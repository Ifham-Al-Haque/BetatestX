import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Car, AlertTriangle, FileText, Wrench, DollarSign, TrendingUp, Calendar, Shield, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import fleetService from '../services/fleetService';
import fleetPmService from '../services/fleetPmService';
import { useToast } from '../context/ToastContext';
import FleetioLayout from '../components/operation/FleetioLayout';

const FleetDashboard = () => {
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const [stats, setStats] = useState({
    total_vehicles: 0,
    active_vehicles: 0,
    maintenance_vehicles: 0,
    out_of_service_vehicles: 0,
    total_mileage: 0,
    avg_fuel_efficiency: 0,
  });
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [openTickets, setOpenTickets] = useState([]);
  const [costData, setCostData] = useState({ perVehicle: [], fleet: { totalMileage: 0, totalCost: 0, costPerMile: null } });
  const [pmDueSoon, setPmDueSoon] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        upcoming,
        expiring,
        tickets,
        cost,
        pmDue,
      ] = await Promise.allSettled([
        fleetService.getFleetStatistics().catch(() => null),
        fleetService.getUpcomingMaintenance(),
        fleetService.getExpiringDocuments(),
        fleetService.getMaintenanceTickets({ status: 'Open' }).then((t) => t.slice(0, 10)).catch(() => []),
        fleetService.getCostPerMileAndTCO(),
        fleetPmService.getDueSoon(30).catch(() => []),
      ]);

      setStats(statsRes.status === 'fulfilled' && statsRes.value ? statsRes.value : {
        total_vehicles: 0, active_vehicles: 0, maintenance_vehicles: 0, out_of_service_vehicles: 0,
        total_mileage: 0, avg_fuel_efficiency: 0,
      });
      setUpcomingMaintenance(upcoming.status === 'fulfilled' ? (upcoming.value || []) : []);
      setExpiringDocs(expiring.status === 'fulfilled' ? (expiring.value || []) : []);
      setOpenTickets(Array.isArray(tickets.value) ? tickets.value : []);
      setCostData(cost.status === 'fulfilled' && cost.value ? cost.value : { perVehicle: [], fleet: { totalMileage: 0, totalCost: 0, costPerMile: null } });
      setPmDueSoon(Array.isArray(pmDue.value) ? pmDue.value : []);
    } catch (e) {
      showError('Failed to load fleet dashboard');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <FleetioLayout title="Fleet Dashboard" description="Loading fleet overview…" icon={Car}>
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </FleetioLayout>
    );
  }

  return (
    <FleetioLayout
      title="Fleet Dashboard"
      description="Live overview: PM due, expiring documents, open tickets, and fleet statistics."
      icon={Car}
    >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_vehicles ?? 0}</p>
              </div>
              <Car className="w-10 h-10 text-blue-500" />
            </div>
            <button onClick={() => navigate('/operation/fleet-records')} className="mt-2 text-sm text-blue-600 hover:underline flex items-center">
              View fleet <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active_vehicles ?? 0}</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Maintenance</p>
                <p className="text-2xl font-bold text-amber-600">{stats.maintenance_vehicles ?? 0}</p>
              </div>
              <Wrench className="w-10 h-10 text-amber-500" />
            </div>
            <button onClick={() => navigate('/operation/fleetio/maintenance')} className="mt-2 text-sm text-blue-600 hover:underline flex items-center">
              View maintenance <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cost per mile (fleet)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {costData.fleet?.costPerMile != null
                    ? `AED ${costData.fleet.costPerMile.toFixed(2)}`
                    : '—'}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-gray-400" />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Maintenance (30 days)</h2>
            </div>
            <div className="p-6 max-h-64 overflow-y-auto">
              {upcomingMaintenance.length === 0 ? (
                <p className="text-gray-500">No vehicles due for service in the next 30 days.</p>
              ) : (
                <ul className="space-y-2">
                  {upcomingMaintenance.slice(0, 10).map((v) => (
                    <li key={v.id} className="flex justify-between text-sm">
                      <span>{v.vehicle_number} – {v.make} {v.model}</span>
                      <span className="text-gray-600">{v.next_service_date ? new Date(v.next_service_date).toLocaleDateString() : '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
              {upcomingMaintenance.length > 0 && (
                <button onClick={() => navigate('/operation/fleetio/maintenance')} className="mt-2 text-sm text-blue-600 hover:underline">
                  View all
                </button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center">
              <Shield className="w-5 h-5 text-red-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Expiring Documents (30 days)</h2>
            </div>
            <div className="p-6 max-h-64 overflow-y-auto">
              {expiringDocs.length === 0 ? (
                <p className="text-gray-500">No documents expiring in the next 30 days.</p>
              ) : (
                <ul className="space-y-2">
                  {expiringDocs.slice(0, 10).map((v) => (
                    <li key={v.id} className="flex justify-between text-sm">
                      <span>{v.vehicle_number} – {v.make} {v.model}</span>
                      <span className="text-gray-600">
                        Ins: {v.insurance_expiry ? new Date(v.insurance_expiry).toLocaleDateString() : '—'} |
                        Reg: {v.registration_expiry ? new Date(v.registration_expiry).toLocaleDateString() : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center">
              <FileText className="w-5 h-5 text-blue-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Open Maintenance Tickets</h2>
            </div>
            <div className="p-6 max-h-64 overflow-y-auto">
              {openTickets.length === 0 ? (
                <p className="text-gray-500">No open tickets.</p>
              ) : (
                <ul className="space-y-2">
                  {openTickets.map((t) => (
                    <li key={t.id} className="flex justify-between text-sm">
                      <span>{t.title || t.ticket_number}</span>
                      <span className="text-gray-600">{t.fleet_vehicles?.vehicle_number || t.vehicle_id}</span>
                    </li>
                  ))}
                </ul>
              )}
              {openTickets.length > 0 && (
                <button onClick={() => navigate('/operation/fleetio/maintenance')} className="mt-2 text-sm text-blue-600 hover:underline">
                  View all
                </button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center">
              <Calendar className="w-5 h-5 text-purple-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">PM Due Soon (30 days)</h2>
            </div>
            <div className="p-6 max-h-64 overflow-y-auto">
              {pmDueSoon.length === 0 ? (
                <p className="text-gray-500">No PM due in the next 30 days.</p>
              ) : (
                <ul className="space-y-2">
                  {pmDueSoon.slice(0, 10).map((s) => (
                    <li key={s.id} className="flex justify-between text-sm">
                      <span>{s.fleet_vehicles?.vehicle_number} – {s.fleet_pm_templates?.name}</span>
                      <span className="text-gray-600">{s.next_due_date ? new Date(s.next_due_date).toLocaleDateString() : '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-white rounded-lg shadow overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Total Cost of Ownership (summary)</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total fleet mileage</p>
                <p className="text-xl font-bold text-gray-900">{(costData.fleet?.totalMileage ?? 0).toLocaleString()} km</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total cost (purchase + maintenance)</p>
                <p className="text-xl font-bold text-gray-900">AED {(costData.fleet?.totalCost ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fleet cost per km</p>
                <p className="text-xl font-bold text-gray-900">
                  {costData.fleet?.costPerMile != null ? `AED ${costData.fleet.costPerMile.toFixed(2)}` : '—'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
    </FleetioLayout>
  );
};

export default FleetDashboard;
