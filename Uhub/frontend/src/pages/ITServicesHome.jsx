import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wrench, FileText, Inbox, BarChart3, ChevronRight, Plus,
  AlertCircle, Activity, CheckCircle, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hasFeatureAccess } from '../components/RoleBasedRoute';
import { itServicesApi } from '../services/itServicesApi';
import { fadeUp } from '../utils/motion';
import EnhancedButton from '../components/ui/EnhancedButton';

const MODULES = [
  {
    title: 'IT Requests',
    description: 'Submit, track, and manage your IT service requests.',
    path: '/it-requests',
    icon: FileText,
    feature: 'it_requests',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)',
  },
  {
    title: 'Request Inbox',
    description: 'IT staff queue — assign, update status, and resolve tickets.',
    path: '/request-inbox',
    icon: Inbox,
    feature: 'request_inbox',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  },
  {
    title: 'IT Tools & Analytics',
    description: 'Reports, search, exports, and service performance insights.',
    path: '/it-tools',
    icon: BarChart3,
    feature: 'request_inbox',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
  },
];

const ITServicesHome = () => {
  const { user, userProfile } = useAuth();
  const role = userProfile?.role || user?.role;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await itServicesApi.requests.getStats(user?.id, role);
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, role]);

  const modules = MODULES.filter((m) => hasFeatureAccess(role, m.feature));
  const openActive = stats
    ? (stats.open_requests ?? 0) + (stats.in_progress_requests ?? 0) + (stats.assigned_requests ?? 0)
    : null;

  const statCards = [
    { label: 'Open / Active', value: openActive, icon: AlertCircle, color: 'var(--accent-warning)' },
    { label: 'Unassigned', value: stats?.unassigned_requests, icon: Clock, color: 'var(--accent-info)' },
    { label: 'In Progress', value: stats?.in_progress_requests, icon: Activity, color: 'var(--accent-primary)' },
    { label: 'Resolved', value: stats?.resolved_requests, icon: CheckCircle, color: 'var(--accent-success)' },
  ];

  return (
    <div
      className="min-h-screen p-4 md:p-6"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div {...fadeUp(0)} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="p-3.5 rounded-2xl shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)',
                  boxShadow: '0 4px 14px rgba(20, 184, 166, 0.35)',
                }}
              >
                <Wrench className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">IT Services</h1>
                <p className="text-sm md:text-base mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Support requests, IT inbox, and analytics — all in one place
                </p>
              </div>
            </div>
            {hasFeatureAccess(role, 'it_requests') && (
              <Link to="/it-requests?new=1">
                <EnhancedButton
                  className="flex items-center gap-2 text-white border-0 rounded-xl"
                  style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)' }}
                >
                  <Plus className="w-4 h-4" />
                  New IT Request
                </EnhancedButton>
              </Link>
            )}
          </div>
        </motion.div>

        {!loading && stats && (
          <motion.div {...fadeUp(0.06)} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
            {statCards.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-xl border p-4"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                      <p className="text-2xl font-bold tabular-nums">{s.value ?? '—'}</p>
                    </div>
                    <div className="p-2 rounded-lg" style={{ background: s.color }}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        <motion.div {...fadeUp(0.1)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.path}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  to={mod.path}
                  className="group block rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-lg"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <div className="h-1" style={{ background: mod.gradient }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 rounded-xl text-white shadow-md" style={{ background: mod.gradient }}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <ChevronRight
                        className="w-5 h-5 transition-transform group-hover:translate-x-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      />
                    </div>
                    <h2 className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                      {mod.title}
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {mod.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {modules.length === 0 && (
          <p className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            No IT Services modules available for your role.
          </p>
        )}
      </div>
    </div>
  );
};

export default ITServicesHome;
