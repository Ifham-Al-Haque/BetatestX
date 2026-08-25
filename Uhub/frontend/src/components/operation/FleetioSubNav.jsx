import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wrench, ClipboardList, Calendar, LayoutGrid, CalendarClock, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasFeatureAccess } from '../RoleBasedRoute';

const NAV = [
  { label: 'Dashboard', path: '/operation/fleetio/dashboard', icon: LayoutDashboard, feature: 'udrive_fleetio' },
  { label: 'Mulkiya', path: '/operation/fleetio/mulkiya', icon: FileText, feature: 'udrive_fleetio' },
  { label: 'Maintenance', path: '/operation/fleetio/maintenance', icon: Wrench, feature: 'fleet_maintenance_record' },
  { label: 'Preventive', path: '/operation/fleetio/preventive-maintenance', icon: CalendarClock, feature: 'fleet_maintenance_record' },
  { label: 'Inspections', path: '/operation/fleetio/inspections', icon: ClipboardList, feature: 'fleet_delivery_checklist' },
  { label: 'Assignments', path: '/operation/fleetio/assignments', icon: Calendar, feature: 'fleet_management' },
  { label: 'Modules', path: '/operation/fleetio/modules', icon: LayoutGrid, feature: 'udrive_fleetio' },
];

const FleetioSubNav = () => {
  const { userProfile, user } = useAuth();
  const role = userProfile?.role || user?.role;
  const items = NAV.filter((n) => hasFeatureAccess(role, n.feature));

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin" aria-label="Fleetio modules">
      {items.map(({ label, path, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <Icon className="w-4 h-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
};

export default FleetioSubNav;
