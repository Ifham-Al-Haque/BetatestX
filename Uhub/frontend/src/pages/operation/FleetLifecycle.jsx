import React from 'react';
import { Link } from 'react-router-dom';
import { UserX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasFeatureAccess } from '../../components/RoleBasedRoute';
import OperationSubLayout from '../../components/operation/OperationSubLayout';
import FleetOffboarding from '../FleetOffboarding';

/**
 * Fleet lifecycle now covers Offboarding only. Onboarding is handled directly
 * in Fleet Records (adding a vehicle creates its fleet record), so a separate
 * onboarding flow is no longer needed.
 */
const FleetLifecycle = () => {
  const { userProfile, user } = useAuth();
  const role = userProfile?.role || user?.role;
  const canAccess = hasFeatureAccess(role, 'fleet_offboarding');

  if (!canAccess) {
    return (
      <OperationSubLayout title="Fleet Offboarding" description="You do not have access to fleet offboarding.">
        <p className="text-center text-gray-500 py-12">No access to fleet offboarding.</p>
      </OperationSubLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="text-sm text-gray-500 mb-2">
            <Link to="/operation" className="hover:text-blue-600">Operation</Link>
            <span className="mx-1">/</span>
            <span className="text-gray-900 font-medium">Fleet Offboarding</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <UserX className="w-6 h-6 text-red-600" />
            Fleet Offboarding
          </h1>
          <p className="text-sm text-gray-500">
            Retire vehicles from the active fleet. New vehicles are added from Fleet Records.
          </p>
        </div>
      </div>
      <FleetOffboarding embedded />
    </div>
  );
};

export default FleetLifecycle;
