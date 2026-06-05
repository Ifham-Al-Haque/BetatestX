import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Search, FileText, Download,
  TrendingUp, Package, Ticket, Wrench
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ITAnalytics from '../components/ITAnalytics';
import ITAdvancedSearch from '../components/ITAdvancedSearch';
import ITReportTemplates from '../components/ITReportTemplates';
import ITDataExport from '../components/ITDataExport';
import { Card, CardContent } from '../components/ui/card';
import Button from '../components/ui/button';
import { itServicesApi } from '../services/itServicesApi';
import { fadeUp } from '../utils/motion';

const ITTools = () => {
  const { user, userProfile } = useAuth();
  const [activeTool, setActiveTool] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatsLoading(true);
        const data = await itServicesApi.requests.getStats(user?.id, userProfile?.role);
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, userProfile?.role]);

  const tools = [
    {
      id: 'analytics',
      name: 'Analytics Dashboard',
      description: 'Insights into IT requests with trends, SLA compliance, and performance metrics',
      icon: BarChart3,
      color: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)',
      component: ITAnalytics
    },
    {
      id: 'search',
      name: 'Advanced Search',
      description: 'Search across IT requests with saved filter presets',
      icon: Search,
      color: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      component: ITAdvancedSearch
    },
    {
      id: 'reports',
      name: 'Report Templates',
      description: 'Pre-built reports with scheduling and export options',
      icon: FileText,
      color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      component: ITReportTemplates
    },
    {
      id: 'export',
      name: 'Data Export',
      description: 'Export filtered data in CSV, Excel, or JSON formats',
      icon: Download,
      color: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
      component: ITDataExport
    }
  ];

  const openRequests = stats
    ? (stats.open_requests ?? 0) + (stats.in_progress_requests ?? 0) + (stats.assigned_requests ?? 0)
    : null;

  const quickStats = [
    { label: 'Total Requests', value: stats?.total_requests, icon: Ticket, color: 'var(--accent-primary)' },
    { label: 'Open / Active', value: openRequests, icon: FileText, color: 'var(--accent-warning)' },
    { label: 'Unassigned', value: stats?.unassigned_requests, icon: Wrench, color: 'var(--accent-info)' },
    { label: 'Resolved', value: stats?.resolved_requests, icon: TrendingUp, color: 'var(--accent-success)' },
  ];

  const ToolComponent = activeTool?.component;

  return (
    <div
      className="min-h-screen p-4 md:p-6 transition-colors duration-300"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div {...fadeUp(0)} className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div
              className="p-3.5 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)',
                boxShadow: '0 4px 14px rgba(20, 184, 166, 0.35)'
              }}
            >
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                IT Tools & Analytics
              </h1>
              <p className="text-sm md:text-base mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Analyze, search, report, and export IT service data
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
                whileHover={{ y: -3 }}
                className="cursor-pointer"
                onClick={() => setActiveTool(tool)}
              >
                <Card
                  className="h-full overflow-hidden rounded-xl border transition-shadow duration-200 hover:shadow-lg"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <div className="h-1" style={{ background: tool.color }} />
                  <CardContent className="p-5 md:p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl shadow-md" style={{ background: tool.color }}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                          {tool.name}
                        </h3>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                          {tool.description}
                        </p>
                        <Button
                          size="sm"
                          className="text-white border-0"
                          style={{ background: tool.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTool(tool);
                          }}
                        >
                          Open Tool
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          {...fadeUp(0.2)}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
        >
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="rounded-xl border"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate mb-1" style={{ color: 'var(--text-muted)' }}>
                        {stat.label}
                      </p>
                      <p className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                        {statsLoading ? '…' : (stat.value ?? '—')}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg flex-shrink-0" style={{ background: stat.color }}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      </div>

      {activeTool && ToolComponent && (
        <ToolComponent
          onClose={() => setActiveTool(null)}
          onResultSelect={(type, item) => {
            console.log('Selected:', type, item);
          }}
        />
      )}
    </div>
  );
};

export default ITTools;
