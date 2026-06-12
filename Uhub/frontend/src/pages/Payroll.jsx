import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, History, FileText } from 'lucide-react';
import { useRoleAccess } from '../components/RoleBasedRoute';
import PayrollRecordsTab from '../components/payroll/PayrollRecordsTab';
import PayrollRunTab from '../components/payroll/PayrollRunTab';
import PayrollBatchHistoryTab from '../components/payroll/PayrollBatchHistoryTab';
import { PAYROLL_TABS } from '../utils/payrollConstants';

const TAB_ICONS = {
  records: FileText,
  run: Calculator,
  history: History,
};

export default function Payroll() {
  const { hasFeatureAccess } = useRoleAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);

  const visibleTabs = useMemo(
    () =>
      PAYROLL_TABS.filter((tab) => {
        if (tab.feature === 'payroll') return hasFeatureAccess('payroll');
        if (tab.feature === 'payroll_calculator') {
          return hasFeatureAccess('payroll_calculator') || hasFeatureAccess('payroll');
        }
        return false;
      }),
    [hasFeatureAccess]
  );

  const requestedTab = searchParams.get('tab') || 'records';
  const activeTab = visibleTabs.some((t) => t.id === requestedTab)
    ? requestedTab
    : visibleTabs[0]?.id || 'records';

  const setTab = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const handleBatchSaved = () => {
    setHistoryRefreshKey((k) => k + 1);
    setTab('history');
  };

  const handlePublished = () => {
    setRecordsRefreshKey((k) => k + 1);
    setTab('records');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payroll
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
            Calculate salaries, manage batches, and track payroll processing in one place.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 rounded-2xl bg-slate-100/80 dark:bg-gray-800/60 border border-slate-200/70 dark:border-gray-700/60 w-fit">
        {visibleTabs.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'records' && (
          <PayrollRecordsTab
            key={recordsRefreshKey}
            onNavigateToRun={() => setTab('run')}
          />
        )}
        {activeTab === 'run' && (
          <PayrollRunTab onBatchSaved={handleBatchSaved} />
        )}
        {activeTab === 'history' && (
          <PayrollBatchHistoryTab
            refreshKey={historyRefreshKey}
            onPublished={handlePublished}
          />
        )}
      </motion.div>
    </div>
  );
}
