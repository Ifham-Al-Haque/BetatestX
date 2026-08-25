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
  FileText,
} from 'lucide-react';
import OperationSubLayout from '../../components/operation/OperationSubLayout';
import OperationStatCard from '../../components/operation/OperationStatCard';
import operationService from '../../services/operationService';
import { useAuth } from '../../context/AuthContext';
import { hasFeatureAccess } from '../../components/RoleBasedRoute';

const ICON_TONE = {
  blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
  indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
  green: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
  slate: 'bg-slate-100 text-slate-600 group-hover:bg-slate-200',
  yellow: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
  red: 'bg-red-50 text-red-600 group-hover:bg-red-100',
  teal: 'bg-teal-50 text-teal-600 group-hover:bg-teal-100',
};

const BORDER_TONE = {
  blue: 'hover:border-blue-300',
  indigo: 'hover:border-indigo-300',
  green: 'hover:border-emerald-300',
  slate: 'hover:border-slate-300',
  yellow: 'hover:border-amber-300',
  red: 'hover:border-red-300',
  teal: 'hover:border-teal-300',
};

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
    title: 'UDrive Fleetio',
    description: 'Maintenance, Mulkiya expiry, inspections, and assignments.',
    path: '/operation/fleetio/dashboard',
    icon: Database,
    feature: 'udrive_fleetio',
    tone: 'green',
  },
  {
    title: 'Mulkiya',
    description: 'Registration cards, photos, and expiry by month.',
    path: '/operation/fleetio/mulkiya',
    icon: FileText,
    feature: 'udrive_fleetio',
    tone: 'indigo',
  },
  {
    title: 'Fleet Offboarding',
    description: 'Retire vehicles from the active fleet.',
    path: '/operation/fleet-lifecycle',
    icon: CheckSquare,
    feature: 'fleet_lifecycle',
    tone: 'red',
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
    title: 'Team Allocation',
    description: 'Drag-and-drop teams, shifts, and Excel import.',
    path: '/operation/team-allocation',
    icon: LayoutGrid,
    feature: 'operation_roster',
    tone: 'teal',
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
          <Link to="/operation/fleet-records">
            <OperationStatCard label="Fleet vehicles" value={stats.totalVehicles} tone="blue" icon={Car} />
          </Link>
          <Link to="/operation/fleetio/maintenance">
            <OperationStatCard label="In maintenance" value={stats.maintenanceVehicles} tone="yellow" icon={Wrench} />
          </Link>
          <Link to="/operation/breakdowns">
            <OperationStatCard label="Active breakdowns" value={stats.activeBreakdowns} tone="red" icon={AlertTriangle} />
          </Link>
          <Link to="/operation/fleetio/mulkiya">
            <OperationStatCard
              label="Mulkiya this month"
              value={stats.mulkiyaExpiringThisMonth}
              sub="registration expiring"
              tone="indigo"
              icon={FileText}
            />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const iconClass = ICON_TONE[mod.tone] || ICON_TONE.blue;
          const borderClass = BORDER_TONE[mod.tone] || BORDER_TONE.blue;
          return (
            <Link
              key={mod.path}
              to={mod.path}
              className={`group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all ${borderClass}`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-lg transition-colors ${iconClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-600" />
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
