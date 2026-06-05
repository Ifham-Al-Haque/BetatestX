import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  CheckSquare,
  Database,
  Users,
  Calendar,
  AlertTriangle,
  Wrench,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';
import OperationSubLayout from '../../components/operation/OperationSubLayout';
import OperationStatCard from '../../components/operation/OperationStatCard';
import operationService from '../../services/operationService';
import { useAuth } from '../../context/AuthContext';
import { hasFeatureAccess } from '../../components/RoleBasedRoute';

const MODULES = [
  {
    title: 'Fleet Record',
    description: 'Vehicle profiles, photos, documents, and unit economics.',
    path: '/operation/fleet-records',
    icon: Car,
    feature: 'fleet_records',
    tone: 'blue',
  },
  {
    title: 'Fleet Offboarding',
    description: 'Retire vehicles from the active fleet.',
    path: '/operation/fleet-lifecycle',
    icon: CheckSquare,
    feature: 'fleet_lifecycle',
    tone: 'indigo',
  },
  {
    title: 'UDrive Fleetio',
    description: 'Maintenance, inspections, assignments, and fleet dashboard.',
    path: '/operation/fleetio/dashboard',
    icon: Database,
    feature: 'udrive_fleetio',
    tone: 'green',
  },
  {
    title: 'Driver & Team Records',
    description: 'Drivers, teams, and operational assignments.',
    path: '/operation/drivers',
    icon: Users,
    feature: 'driver_records',
    tone: 'slate',
  },
  {
    title: 'Schedule & Roster',
    description: 'Shift planning and weekly rosters.',
    path: '/operation/roster',
    icon: Calendar,
    feature: 'operation_roster',
    tone: 'yellow',
  },
  {
    title: 'Breakdowns',
    description: 'Active breakdowns and repair tracking.',
    path: '/operation/breakdowns',
    icon: AlertTriangle,
    feature: 'breakdowns',
    tone: 'red',
  },
];

const OperationHome = () => {
  const { userProfile, user } = useAuth();
  const role = userProfile?.role || user?.role;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    operationService
      .getOverviewStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const modules = MODULES.filter((m) => hasFeatureAccess(role, m.feature));

  return (
    <OperationSubLayout
      breadcrumbs={[{ label: 'Overview' }]}
      title="Operation"
      description="Fleet, drivers, maintenance, and daily operations — all in one place."
      icon={LayoutGrid}
    >
      {!loading && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <OperationStatCard label="Fleet vehicles" value={stats.totalVehicles} tone="blue" icon={Car} />
          <OperationStatCard label="In maintenance" value={stats.maintenanceVehicles} tone="yellow" icon={Wrench} />
          <OperationStatCard label="Active breakdowns" value={stats.activeBreakdowns} tone="red" icon={AlertTriangle} />
          <OperationStatCard label="Onboarding" value={stats.onboardingInProgress} sub="in progress" tone="indigo" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.path}
              to={mod.path}
              className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-900 mt-3">{mod.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{mod.description}</p>
            </Link>
          );
        })}
      </div>

      {modules.length === 0 && (
        <p className="text-center text-gray-500 py-12">No Operation modules available for your role.</p>
      )}
    </OperationSubLayout>
  );
};

export default OperationHome;
