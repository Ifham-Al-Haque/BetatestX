import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  Calendar,
  Car,
  CalendarClock,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasFeatureAccess } from '../../components/RoleBasedRoute';
import OperationSubLayout from '../../components/operation/OperationSubLayout';
import FleetioSubNav from '../../components/operation/FleetioSubNav';

const MODULES = [
  {
    title: 'Fleet Dashboard',
    description: 'Live overview: PM due, expiring documents, open tickets, and fleet stats.',
    path: '/operation/fleetio/dashboard',
    icon: LayoutDashboard,
    feature: 'udrive_fleetio',
  },
  {
    title: 'Mulkiya',
    description: 'Registration cards, photos, and which cars expire in which month.',
    path: '/operation/fleetio/mulkiya',
    icon: FileText,
    feature: 'udrive_fleetio',
  },
  {
    title: 'Maintenance',
    description: 'Maintenance records, work tickets, and service history linked to each vehicle.',
    path: '/operation/fleetio/maintenance',
    icon: Wrench,
    feature: 'fleet_maintenance_record',
  },
  {
    title: 'Preventive Maintenance',
    description: 'Recurring PM templates and per-vehicle service schedules with due reminders.',
    path: '/operation/fleetio/preventive-maintenance',
    icon: CalendarClock,
    feature: 'fleet_maintenance_record',
  },
  {
    title: 'Delivery & Inspections',
    description: 'Delivery checklists and vehicle inspection workflows.',
    path: '/operation/fleetio/inspections',
    icon: ClipboardList,
    feature: 'fleet_delivery_checklist',
  },
  {
    title: 'Driver Assignments',
    description: 'Calendar view of driver–vehicle assignments.',
    path: '/operation/fleetio/assignments',
    icon: Calendar,
    feature: 'fleet_management',
  },
  {
    title: 'Fleet Record',
    description: 'Browse all vehicles and open a full fleet profile.',
    path: '/operation/fleet-records',
    icon: Car,
    feature: 'fleet_records',
  },
];

const UDriveFleetio = () => {
  const { userProfile, user } = useAuth();
  const role = userProfile?.role || user?.role;
  const modules = MODULES.filter((m) => hasFeatureAccess(role, m.feature));

  return (
    <OperationSubLayout
      breadcrumbs={[{ label: 'UDrive Fleetio', href: '/operation/fleetio/modules' }, { label: 'Modules' }]}
      title="UDrive Fleetio"
      description="Maintenance-focused fleet management. All activity links to Fleet Record profiles per vehicle."
      icon={LayoutDashboard}
    >
      <div className="mb-6 border-b border-gray-200 pb-3">
        <FleetioSubNav />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <p className="text-center text-gray-500 py-12">No Fleetio modules available for your role.</p>
      )}
    </OperationSubLayout>
  );
};

export default UDriveFleetio;
