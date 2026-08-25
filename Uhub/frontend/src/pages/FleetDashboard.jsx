import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Car, AlertTriangle, FileText, Wrench, DollarSign, TrendingUp, Calendar, Shield, ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import fleetService from '../services/fleetService';
import fleetPmService from '../services/fleetPmService';
import { useToast } from '../context/ToastContext';
import FleetioLayout from '../components/operation/FleetioLayout';
import OperationStatCard from '../components/operation/OperationStatCard';
import { summarizeMulkiya, expiryStatus, EXPIRY_STYLES } from '../utils/mulkiyaExpiryUtils';

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
  const [openTickets, setOpenTickets] = useState([]);
  const [costData, setCostData] = useState({ perVehicle: [], fleet: { totalMileage: 0, totalCost: 0, costPerMile: null } });
  const [pmDueSoon, setPmDueSoon] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        upcoming,
        tickets,
        cost,
        pmDue,
        vehicleList,
      ] = await Promise.allSettled([
        fleetService.getFleetStatistics().catch(() => null),
        fleetService.getUpcomingMaintenance(),
        fleetService.getMaintenanceTickets({ status: 'Open' }).then((t) => t.slice(0, 10)).catch(() => []),
        fleetService.getCostPerMileAndTCO(),
        fleetPmService.getDueSoon(30).catch(() => []),
        fleetService.getVehicles({ excludeSampleData: true }).catch(() => []),
      ]);

      setStats(statsRes.status === 'fulfilled' && statsRes.value ? statsRes.value : {
        total_vehicles: 0, active_vehicles: 0, maintenance_vehicles: 0, out_of_service_vehicles: 0,
        total_mileage: 0, avg_fuel_efficiency: 0,
      });
      setUpcomingMaintenance(upcoming.status === 'fulfilled' ? (upcoming.value || []) : []);
      setOpenTickets(Array.isArray(tickets.value) ? tickets.value : []);
      setCostData(cost.status === 'fulfilled' && cost.value ? cost.value : { perVehicle: [], fleet: { totalMileage: 0, totalCost: 0, costPerMile: null } });
      setPmDueSoon(Array.isArray(pmDue.value) ? pmDue.value : []);
      setVehicles(vehicleList.status === 'fulfilled' ? (vehicleList.value || []) : []);
    } catch (e) {
      showError('Failed to load fleet dashboard');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  const mulkiya = useMemo(() => summarizeMulkiya(vehicles), [vehicles]);

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/operation/fleet-records">
            <OperationStatCard label="Total vehicles" value={stats.total_vehicles ?? 0} tone="blue" icon={Car} sub="View fleet" />
          </Link>
          <OperationStatCard label="Active" value={stats.active_vehicles ?? 0} tone="green" icon={Car} />
          <Link to="/operation/fleetio/maintenance">
            <OperationStatCard label="In maintenance" value={stats.maintenance_vehicles ?? 0} tone="yellow" icon={Wrench} sub="View tickets" />
          </Link>
          <Link to="/operation/fleetio/mulkiya">
            <OperationStatCard label="Mulkiya this month" value={mulkiya.thisMonth} tone="indigo" icon={FileText} sub={mulkiya.expired ? `${mulkiya.expired} already expired` : 'Registration expiry'} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center">
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
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-indigo-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Mulkiya expiry</h2>
              </div>
              <button onClick={() => navigate('/operation/fleetio/mulkiya')} className="text-sm text-indigo-600 hover:underline flex items-center">
                Open graph <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className={`rounded-lg border px-3 py-2 text-center ${EXPIRY_STYLES.expired.badge}`}>
                  <p className="text-lg font-bold">{mulkiya.expired}</p>
                  <p className="text-[11px]">Expired</p>
                </div>
                <div className={`rounded-lg border px-3 py-2 text-center ${EXPIRY_STYLES.this_month.badge}`}>
                  <p className="text-lg font-bold">{mulkiya.thisMonth}</p>
                  <p className="text-[11px]">This month</p>
                </div>
                <div className={`rounded-lg border px-3 py-2 text-center ${EXPIRY_STYLES.next_30.badge}`}>
                  <p className="text-lg font-bold">{mulkiya.next30}</p>
                  <p className="text-[11px]">Next 30 days</p>
                </div>
              </div>
              {vehicles.filter((v) => ['expired', 'this_month', 'next_30'].includes(expiryStatus(v.registration_expiry))).slice(0, 6).length === 0 ? (
                <p className="text-sm text-gray-500">No Mulkiya expiring soon. Add registration expiry on the Fleet Record.</p>
              ) : (
                <ul className="space-y-2">
                  {vehicles
                    .filter((v) => ['expired', 'this_month', 'next_30'].includes(expiryStatus(v.registration_expiry)))
                    .sort((a, b) => String(a.registration_expiry).localeCompare(String(b.registration_expiry)))
                    .slice(0, 6)
                    .map((v) => {
                      const st = expiryStatus(v.registration_expiry);
                      return (
                        <li key={v.id} className="flex justify-between text-sm gap-2">
                          <span className="truncate">{v.vehicle_number} – {v.make} {v.model}</span>
                          <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border ${EXPIRY_STYLES[st].badge}`}>
                            {v.registration_expiry ? new Date(v.registration_expiry).toLocaleDateString() : '—'}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
        </div>
    </FleetioLayout>
  );
};

export default FleetDashboard;
