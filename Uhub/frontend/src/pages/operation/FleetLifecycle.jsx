import React, { useMemo } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { CheckSquare, UserX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasFeatureAccess } from '../../components/RoleBasedRoute';
import FleetOnboarding from '../FleetOnboarding';
import FleetOffboarding from '../FleetOffboarding';

const TABS = [
  { id: 'onboarding', label: 'Onboarding', icon: CheckSquare, feature: 'fleet_onboarding' },
  { id: 'offboarding', label: 'Offboarding', icon: UserX, feature: 'fleet_offboarding' },
];

const FleetLifecycle = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { userProfile, user } = useAuth();
  const role = userProfile?.role || user?.role;

  const allowedTabs = useMemo(
    () => TABS.filter((t) => hasFeatureAccess(role, t.feature)),
    [role]
  );

  const activeTab = searchParams.get('tab') || allowedTabs[0]?.id;

  if (allowedTabs.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600">
        You do not have access to fleet onboarding or offboarding.
      </div>
    );
  }

  if (!allowedTabs.some((t) => t.id === activeTab)) {
    return <Navigate to={`/operation/fleet-lifecycle?tab=${allowedTabs[0].id}`} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Fleet Onboarding & Offboarding</h1>
          <p className="text-sm text-gray-500 mb-4">
            Manage vehicle lifecycle; completed records link to Fleet Record profiles.
          </p>
          <nav className="flex gap-2" aria-label="Fleet lifecycle tabs">
            {allowedTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSearchParams({ tab: tab.id })}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      <div>
        {activeTab === 'onboarding' && <FleetOnboarding />}
        {activeTab === 'offboarding' && <FleetOffboarding />}
      </div>
    </div>
  );
};

export default FleetLifecycle;
