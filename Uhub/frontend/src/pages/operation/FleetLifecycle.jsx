import React from 'react';
import { UserX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasFeatureAccess } from '../../components/RoleBasedRoute';
import OperationSubLayout from '../../components/operation/OperationSubLayout';
import FleetOffboarding from '../FleetOffboarding';

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
    <OperationSubLayout
      breadcrumbs={[{ label: 'Fleet Offboarding' }]}
      title="Fleet Offboarding"
      description="Retire vehicles from the active fleet. New vehicles are added from Fleet Records."
      icon={UserX}
    >
      <FleetOffboarding embedded />
    </OperationSubLayout>
  );
};

export default FleetLifecycle;
