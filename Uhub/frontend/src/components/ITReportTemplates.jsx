import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Calendar, Mail, Download, X, Play, Clock, CheckCircle,
  BarChart3, TrendingUp, Users, Package, AlertTriangle, Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { itServicesApi } from '../services/itServicesApi';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import { emailService } from '../services/emailService';

const ITReportTemplates = ({ onClose }) => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();

  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    frequency: 'weekly',
    day: 'monday',
    time: '09:00',
    recipients: [],
    format: 'pdf'
  });

  // Pre-built report templates
  const reportTemplates = [
    {
      id: 'open-requests-priority',
      name: 'Open Requests by Priority',
      description: 'Shows all open requests grouped by priority level',
      icon: AlertTriangle,
      category: 'requests',
      params: {
        status: 'open',
        groupBy: 'priority'
      }
    },
    {
      id: 'asset-utilization',
      name: 'Asset Utilization Report',
      description: 'Overview of asset status and utilization rates',
      icon: Package,
      category: 'assets',
      params: {
        groupBy: 'status'
      }
    },
    {
      id: 'sla-compliance',
      name: 'SLA Compliance Report',
      description: 'Track SLA compliance and resolution times',
      icon: Target,
      category: 'requests',
      params: {
        includeSLA: true
      }
    },
    {
      id: 'request-trends',
      name: 'Request Trends (Monthly)',
      description: 'Monthly trends of requests created and resolved',
      icon: TrendingUp,
      category: 'requests',
      params: {
        groupBy: 'month',
        period: '6months'
      }
    },
    {
      id: 'top-requesters',
      name: 'Top Requesters',
      description: 'Users with the most IT requests',
      icon: Users,
      category: 'requests',
      params: {
        groupBy: 'requester',
        limit: 10
      }
    },
    {
      id: 'category-breakdown',
      name: 'Requests by Category',
      description: 'Distribution of requests across categories',
      icon: BarChart3,
      category: 'requests',
      params: {
        groupBy: 'category'
      }
    },
    {
      id: 'unassigned-requests',
      name: 'Unassigned Requests',
      description: 'All requests that need assignment',
      icon: AlertTriangle,
      category: 'requests',
      params: {
        status: 'open',
        assigned: false
      }
    },
    {
      id: 'asset-maintenance',
      name: 'Assets Requiring Maintenance',
      description: 'Assets that need attention or maintenance',
      icon: Package,
      category: 'assets',
      params: {
        status: 'maintenance'
      }
    }
  ];

  useEffect(() => {
    loadScheduledReports();
  }, []);

  const loadScheduledReports = async () => {
    try {
      const saved = localStorage.getItem('it_scheduled_reports');
      if (saved) {
        setScheduledReports(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading scheduled reports:', e);
    }
  };

  const generateReport = async (template) => {
    setLoading(true);
    setSelectedReport(template);
    
    try {
      let data = null;
      
      if (template.category === 'requests') {
        const result = await itServicesApi.requests.getAll(
          template.params,
          user?.id,
          userProfile?.role
        );
        data = result.data || [];
        
        // Apply grouping if specified
        if (template.params.groupBy === 'priority') {
          data = groupByPriority(data);
        } else if (template.params.groupBy === 'category') {
          data = groupByCategory(data);
        } else if (template.params.groupBy === 'requester') {
          data = groupByRequester(data, template.params.limit);
        } else if (template.params.groupBy === 'month') {
          data = groupByMonth(data, template.params.period);
        }
      } else if (template.category === 'assets') {
        const result = await itServicesApi.assets.getAll(template.params);
        data = result.data || [];
        
        if (template.params.groupBy === 'status') {
          data = groupAssetsByStatus(data);
        }
      }

      setReportData({
        template,
        data,
        generatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error generating report:', err);
      showError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const groupByPriority = (requests) => {
    const grouped = {};
    requests.forEach(req => {
      const priority = req.priority?.name || 'Unknown';
      if (!grouped[priority]) grouped[priority] = [];
      grouped[priority].push(req);
    });
    return grouped;
  };

  const groupByCategory = (requests) => {
    const grouped = {};
    requests.forEach(req => {
      const category = req.category?.name || 'Unknown';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(req);
    });
    return grouped;
  };

  const groupByRequester = (requests, limit = 10) => {
    const requesterMap = {};
    requests.forEach(req => {
      const requesterId = req.requester_id;
      if (!requesterMap[requesterId]) {
        requesterMap[requesterId] = {
          requester: req.requester || { full_name: 'Unknown' },
          count: 0,
          requests: []
        };
      }
      requesterMap[requesterId].count++;
      requesterMap[requesterId].requests.push(req);
    });
    
    return Object.values(requesterMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  };

  const groupByMonth = (requests, period = '6months') => {
    const months = {};
    const now = new Date();
    const monthsBack = period === '6months' ? 6 : 12;
    
    for (let i = monthsBack - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months[key] = { created: 0, resolved: 0 };
    }
    
    requests.forEach(req => {
      const createdDate = new Date(req.created_at);
      const monthKey = createdDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (months[monthKey]) {
        months[monthKey].created++;
      }
      
      if (req.status === 'resolved' || req.status === 'closed') {
        const resolvedDate = new Date(req.resolved_at || req.updated_at);
        const resolvedKey = resolvedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (months[resolvedKey]) {
          months[resolvedKey].resolved++;
        }
      }
    });
    
    return Object.entries(months).map(([month, data]) => ({
      month,
      ...data
    }));
  };

  const groupAssetsByStatus = (assets) => {
    const grouped = {};
    assets.forEach(asset => {
      const status = asset.status || 'unknown';
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(asset);
    });
    return grouped;
  };

  const exportReport = (format = 'csv') => {
    if (!reportData) return;

    let content = '';
    let filename = `${reportData.template.id}-${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      // Convert data to CSV
      if (Array.isArray(reportData.data)) {
        if (reportData.data.length === 0) {
          showError('No data to export');
          return;
        }
        const headers = Object.keys(reportData.data[0]);
        content = [
          headers.join(','),
          ...reportData.data.map(row => 
            headers.map(header => {
              const value = row[header];
              if (typeof value === 'object') return JSON.stringify(value);
              return `"${String(value || '').replace(/"/g, '""')}"`;
            }).join(',')
          )
        ].join('\n');
      } else {
        // Grouped data
        content = JSON.stringify(reportData.data, null, 2);
        filename += '.json';
      }
    } else if (format === 'json') {
      content = JSON.stringify(reportData, null, 2);
      filename += '.json';
    }

    const blob = new Blob([content], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    success(`Report exported as ${format.toUpperCase()}`);
  };

  const scheduleReport = () => {
    if (!selectedReport) return;

    const schedule = {
      id: Date.now(),
      reportId: selectedReport.id,
      reportName: selectedReport.name,
      ...scheduleData,
      createdAt: new Date().toISOString(),
      lastRun: null,
      nextRun: calculateNextRun(scheduleData)
    };

    const updated = [...scheduledReports, schedule];
    setScheduledReports(updated);
    localStorage.setItem('it_scheduled_reports', JSON.stringify(updated));
    setShowScheduleModal(false);
    success('Report scheduled successfully');
  };

  const calculateNextRun = (schedule) => {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':');
    
    if (schedule.frequency === 'daily') {
      const next = new Date(now);
      next.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next.toISOString();
    } else if (schedule.frequency === 'weekly') {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = days.indexOf(schedule.day.toLowerCase());
      const next = new Date(now);
      next.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const currentDay = next.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;
      
      next.setDate(next.getDate() + daysToAdd);
      return next.toISOString();
    }
    
    return now.toISOString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Report Templates</h2>
              <p className="text-sm text-gray-600 mt-1">Pre-built reports for IT services</p>
            </div>
            <Button variant="ghost" onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : reportData ? (
            <div className="space-y-4">
              {/* Report Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{reportData.template.name}</h3>
                  <p className="text-sm text-gray-600">
                    Generated: {new Date(reportData.generatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => exportReport('csv')} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button onClick={() => exportReport('json')} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button onClick={() => setShowScheduleModal(true)} variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                  <Button onClick={() => setReportData(null)} variant="outline">
                    Back
                  </Button>
                </div>
              </div>

              {/* Report Content */}
              <Card>
                <CardContent className="p-6">
                  {Array.isArray(reportData.data) ? (
                    <div className="space-y-2">
                      {reportData.data.map((item, index) => (
                        <div key={index} className="p-3 border border-gray-200 rounded-lg">
                          <pre className="text-sm">{JSON.stringify(item, null, 2)}</pre>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(reportData.data).map(([key, value]) => (
                        <div key={key}>
                          <h4 className="font-semibold text-gray-900 mb-2 capitalize">{key}</h4>
                          {Array.isArray(value) ? (
                            <div className="space-y-2">
                              {value.map((item, index) => (
                                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                                  {item.title || item.name || JSON.stringify(item)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <pre className="text-sm bg-gray-50 p-3 rounded">{JSON.stringify(value, null, 2)}</pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTemplates.map(template => {
                const Icon = template.icon;
                return (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    className="cursor-pointer"
                  >
                    <Card
                      onClick={() => generateReport(template)}
                      className="h-full hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Icon className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                            <p className="text-sm text-gray-600">{template.description}</p>
                            <Button
                              size="sm"
                              className="mt-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                generateReport(template);
                              }}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Generate
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Scheduled Reports */}
        {scheduledReports.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Scheduled Reports</h3>
            <div className="space-y-2">
              {scheduledReports.map(schedule => (
                <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{schedule.reportName}</p>
                    <p className="text-sm text-gray-600">
                      {schedule.frequency} • Next: {new Date(schedule.nextRun).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updated = scheduledReports.filter(s => s.id !== schedule.id);
                        setScheduledReports(updated);
                        localStorage.setItem('it_scheduled_reports', JSON.stringify(updated));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        <AnimatePresence>
          {showScheduleModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-lg p-6 max-w-md w-full"
              >
                <h3 className="text-lg font-bold mb-4">Schedule Report</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Frequency</Label>
                    <select
                      value={scheduleData.frequency}
                      onChange={(e) => setScheduleData({ ...scheduleData, frequency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  {scheduleData.frequency === 'weekly' && (
                    <div>
                      <Label>Day</Label>
                      <select
                        value={scheduleData.day}
                        onChange={(e) => setScheduleData({ ...scheduleData, day: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={scheduleData.time}
                      onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Format</Label>
                    <select
                      value={scheduleData.format}
                      onChange={(e) => setScheduleData({ ...scheduleData, format: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="pdf">PDF</option>
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={scheduleReport}>Schedule</Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ITReportTemplates;
