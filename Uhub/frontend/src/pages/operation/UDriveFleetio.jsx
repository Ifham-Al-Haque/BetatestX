import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  Calendar,
  Car,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasFeatureAccess } from '../../components/RoleBasedRoute';

const MODULES = [
  {
    title: 'Fleet Dashboard',
    description: 'Live overview: PM due, expiring documents, open tickets, and fleet stats.',
    path: '/operation/fleetio/dashboard',
    icon: LayoutDashboard,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="p-2 bg-blue-600 rounded-xl text-white text-lg font-semibold">UF</span>
            UDrive Fleetio
          </h1>
          <p className="text-gray-600 mt-2 max-w-2xl">
            Maintenance-focused fleet management. All activity links to Fleet Record profiles per vehicle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.path}
                to={mod.path}
                className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mt-4">{mod.title}</h2>
                <p className="text-sm text-gray-500 mt-2">{mod.description}</p>
              </Link>
            );
          })}
        </div>

        {modules.length === 0 && (
          <p className="text-center text-gray-500 py-12">No Fleetio modules available for your role.</p>
        )}
      </div>
    </div>
  );
};

export default UDriveFleetio;
