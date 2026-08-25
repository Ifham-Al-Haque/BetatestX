import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, History, FileText, Sparkles, ArrowRight } from 'lucide-react';
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

const TAB_HINTS = {
  records: 'Review, process, and export employee payroll',
  run: 'Import a file, apply locked formulas, save a batch',
  history: 'Open a saved batch and publish it to Records',
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
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 dark:border-gray-700/60 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white shadow-xl mb-8">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-10 -bottom-20 w-48 h-48 rounded-full bg-indigo-400/20 blur-2xl" />
        <div className="relative px-6 sm:px-8 py-7">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                HR payroll workspace
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payroll</h1>
              <p className="mt-1.5 text-sm sm:text-base text-blue-100 max-w-xl">
                Calculate salaries with locked formulas, save a batch, then publish and process records — all in one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {[
                { n: '1', label: 'Run payroll' },
                { n: '2', label: 'Review batch' },
                { n: '3', label: 'Process records' },
              ].map((step, i) => (
                <React.Fragment key={step.n}>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm">
                    <span className="w-5 h-5 rounded-full bg-white text-indigo-700 text-xs font-bold flex items-center justify-center">
                      {step.n}
                    </span>
                    {step.label}
                  </div>
                  {i < 2 && <ArrowRight className="w-4 h-4 text-white/50 hidden sm:block" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-gray-800/70 border border-slate-200/70 dark:border-gray-700/60 w-full sm:w-fit">
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
              <span className="flex flex-col items-start leading-tight">
                {tab.label}
                {isActive && (
                  <span className="text-[10px] font-normal text-slate-400 hidden sm:block">
                    {TAB_HINTS[tab.id]}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

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
