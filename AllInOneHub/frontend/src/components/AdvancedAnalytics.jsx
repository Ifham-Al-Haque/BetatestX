import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, TrendingDown, Clock, Users, 
  AlertTriangle, CheckCircle, XCircle, Calendar, Target,
  Download, RefreshCw, Filter, ChevronDown, ChevronUp,
  Activity, Award, Timer, Globe, Zap, Flag, PieChart,
  LineChart, BarChart, FileText, Database, Settings,
  Eye, EyeOff, Maximize2, Minimize2, RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { itServicesApi } from '../services/itServicesApi';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Label from '../components/ui/label';
import LoadingSpinner from '../components/LoadingSpinner';

const AdvancedAnalytics = ({ onClose }) => {
  const { user, userProfile } = useAuth();
  const { isDark } = useTheme();
  
  const [analytics, setAnalytics] = useState({
    // Basic metrics
    totalRequests: 0,
    openRequests: 0,
    inProgressRequests: 0,
    resolvedRequests: 0,
    closedRequests: 0,
    cancelledRequests: 0,
    averageResolutionTime: 0,
    
    // Advanced metrics
    firstCallResolution: 0,
    customerSatisfaction: 0,
    slaCompliance: 0,
    escalationRate: 0,
    backlogTrend: [],
    
    // Breakdowns
    categoryBreakdown: [],
    priorityBreakdown: [],
    departmentBreakdown: [],
    assigneeBreakdown: [],
    
    // Trends
    monthlyTrends: [],
    weeklyTrends: [],
    dailyTrends: [],
    
    // Performance metrics
    responseTimeMetrics: {},
    resolutionTimeMetrics: {},
    workloadDistribution: {},
    
    // Predictive analytics
    forecastData: [],
    riskIndicators: [],
    capacityPlanning: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [viewMode, setViewMode] = useState('overview'); // overview, detailed, predictive
  const [selectedMetrics, setSelectedMetrics] = useState(['all']);
  const [showFilters, setShowFilters] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');

  useEffect(() => {
    fetchAdvancedAnalytics();
  }, [dateRange, selectedMetrics]);

  const fetchAdvancedAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch basic stats
      const stats = await itServicesApi.requests.getStats(user?.id, userProfile?.role);
      
      // Fetch advanced analytics
      const [
        categoryData,
        priorityData,
        departmentData,
        assigneeData,
        trendData,
        performanceData,
        forecastData
      ] = await Promise.all([
        fetchCategoryAnalytics(),
        fetchPriorityAnalytics(),
        fetchDepartmentAnalytics(),
        fetchAssigneeAnalytics(),
        fetchTrendAnalytics(),
        fetchPerformanceAnalytics(),
        fetchForecastData()
      ]);

      setAnalytics({
        // Basic metrics
        totalRequests: stats.total_requests,
        openRequests: stats.open_requests,
        inProgressRequests: stats.in_progress_requests,
        resolvedRequests: stats.resolved_requests,
        closedRequests: stats.closed_requests,
        cancelledRequests: stats.cancelled_requests,
        averageResolutionTime: calculateAverageResolutionTime(stats),
        
        // Advanced metrics
        firstCallResolution: calculateFirstCallResolution(stats),
        customerSatisfaction: 85, // Mock data - would come from surveys
        slaCompliance: calculateSLACompliance(stats),
        escalationRate: calculateEscalationRate(stats),
        backlogTrend: calculateBacklogTrend(stats),
        
        // Breakdowns
        categoryBreakdown: categoryData,
        priorityBreakdown: priorityData,
        departmentBreakdown: departmentData,
        assigneeBreakdown: assigneeData,
        
        // Trends
        monthlyTrends: trendData.monthly,
        weeklyTrends: trendData.weekly,
        dailyTrends: trendData.daily,
        
        // Performance metrics
        responseTimeMetrics: performanceData.responseTime,
        resolutionTimeMetrics: performanceData.resolutionTime,
        workloadDistribution: performanceData.workload,
        
        // Predictive analytics
        forecastData: forecastData,
        riskIndicators: calculateRiskIndicators(stats),
        capacityPlanning: calculateCapacityPlanning(stats)
      });
    } catch (err) {
      console.error('Error fetching advanced analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock data functions - in real implementation, these would call actual APIs
  const fetchCategoryAnalytics = async () => {
    return [
      { name: 'Hardware', count: 45, percentage: 30, avgResolutionTime: 48, trend: 'up' },
      { name: 'Software', count: 38, percentage: 25, avgResolutionTime: 24, trend: 'down' },
      { name: 'Access', count: 32, percentage: 21, avgResolutionTime: 12, trend: 'stable' },
      { name: 'Network', count: 25, percentage: 17, avgResolutionTime: 72, trend: 'up' },
      { name: 'Other', count: 10, percentage: 7, avgResolutionTime: 36, trend: 'stable' }
    ];
  };

  const fetchPriorityAnalytics = async () => {
    return [
      { name: 'Critical', count: 8, percentage: 5, avgResolutionTime: 4, slaCompliance: 75 },
      { name: 'High', count: 35, percentage: 23, avgResolutionTime: 12, slaCompliance: 85 },
      { name: 'Medium', count: 75, percentage: 50, avgResolutionTime: 48, slaCompliance: 92 },
      { name: 'Low', count: 32, percentage: 22, avgResolutionTime: 120, slaCompliance: 95 }
    ];
  };

  const fetchDepartmentAnalytics = async () => {
    return [
      { name: 'Sales', count: 45, avgResolutionTime: 36, satisfaction: 88 },
      { name: 'Marketing', count: 32, avgResolutionTime: 42, satisfaction: 85 },
      { name: 'IT', count: 28, avgResolutionTime: 24, satisfaction: 92 },
      { name: 'HR', count: 25, avgResolutionTime: 48, satisfaction: 80 },
      { name: 'Finance', count: 20, avgResolutionTime: 54, satisfaction: 87 }
    ];
  };

  const fetchAssigneeAnalytics = async () => {
    return [
      { name: 'John Smith', count: 45, avgResolutionTime: 24, workload: 85, satisfaction: 90 },
      { name: 'Sarah Johnson', count: 38, avgResolutionTime: 30, workload: 78, satisfaction: 88 },
      { name: 'Mike Davis', count: 32, avgResolutionTime: 36, workload: 65, satisfaction: 85 },
      { name: 'Lisa Wilson', count: 25, avgResolutionTime: 42, workload: 70, satisfaction: 87 }
    ];
  };

  const fetchTrendAnalytics = async () => {
    return {
      monthly: [
        { month: 'Jan', requests: 45, resolved: 42, avgTime: 36 },
        { month: 'Feb', requests: 52, resolved: 48, avgTime: 32 },
        { month: 'Mar', requests: 38, resolved: 35, avgTime: 28 },
        { month: 'Apr', requests: 61, resolved: 58, avgTime: 42 },
        { month: 'May', requests: 47, resolved: 44, avgTime: 38 },
        { month: 'Jun', requests: 55, resolved: 52, avgTime: 35 }
      ],
      weekly: [
        { week: 'Week 1', requests: 12, resolved: 11 },
        { week: 'Week 2', requests: 15, resolved: 14 },
        { week: 'Week 3', requests: 18, resolved: 17 },
        { week: 'Week 4', requests: 10, resolved: 10 }
      ],
      daily: [
        { day: 'Mon', requests: 8, resolved: 7 },
        { day: 'Tue', requests: 12, resolved: 11 },
        { day: 'Wed', requests: 10, resolved: 9 },
        { day: 'Thu', requests: 14, resolved: 13 },
        { day: 'Fri', requests: 6, resolved: 6 }
      ]
    };
  };

  const fetchPerformanceAnalytics = async () => {
    return {
      responseTime: {
        average: 2.5,
        median: 2.0,
        p95: 8.0,
        p99: 15.0,
        trend: 'improving'
      },
      resolutionTime: {
        average: 36,
        median: 24,
        p95: 120,
        p99: 240,
        trend: 'stable'
      },
      workload: {
        totalCapacity: 100,
        currentLoad: 75,
        utilization: 75,
        availableCapacity: 25
      }
    };
  };

  const fetchForecastData = async () => {
    return [
      { period: 'Next Week', predicted: 45, confidence: 85 },
      { period: 'Next Month', predicted: 180, confidence: 78 },
      { period: 'Next Quarter', predicted: 540, confidence: 72 }
    ];
  };

  // Calculation functions
  const calculateAverageResolutionTime = (stats) => {
    // Mock calculation - in real implementation, this would be calculated from actual data
    return 36;
  };

  const calculateFirstCallResolution = (stats) => {
    // Mock calculation
    return 68;
  };

  const calculateSLACompliance = (stats) => {
    // Mock calculation
    return 87;
  };

  const calculateEscalationRate = (stats) => {
    // Mock calculation
    return 12;
  };

  const calculateBacklogTrend = (stats) => {
    // Mock calculation
    return [
      { date: '2024-01-01', count: 45 },
      { date: '2024-01-02', count: 48 },
      { date: '2024-01-03', count: 42 },
      { date: '2024-01-04', count: 50 },
      { date: '2024-01-05', count: 47 }
    ];
  };

  const calculateRiskIndicators = (stats) => {
    return [
      { name: 'High Priority Backlog', value: 8, risk: 'high' },
      { name: 'Overdue Requests', value: 3, risk: 'medium' },
      { name: 'Unassigned Requests', value: 12, risk: 'low' },
      { name: 'SLA Risk', value: 15, risk: 'medium' }
    ];
  };

  const calculateCapacityPlanning = (stats) => {
    return {
      currentCapacity: 100,
      projectedDemand: 120,
      capacityGap: 20,
      recommendations: [
        'Hire 2 additional IT support staff',
        'Implement automation for common requests',
        'Cross-train existing staff'
      ]
    };
  };

  // Export functions
  const exportAnalytics = async (format) => {
    try {
      const exportData = {
        dateRange,
        generatedAt: new Date().toISOString(),
        generatedBy: userProfile?.full_name || user?.email,
        analytics
      };

      if (format === 'pdf') {
        await exportToPDF(exportData);
      } else if (format === 'excel') {
        await exportToExcel(exportData);
      } else if (format === 'json') {
        await exportToJSON(exportData);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const exportToPDF = async (data) => {
    // Mock PDF export - in real implementation, use a PDF library
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `it-analytics-${dateRange}days-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = async (data) => {
    // Mock Excel export - in real implementation, use an Excel library
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `it-analytics-${dateRange}days-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = async (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `it-analytics-${dateRange}days-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <LoadingSpinner size="xl" text="Loading advanced analytics..." />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-y-auto"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 
                className="text-3xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Advanced Analytics Dashboard
              </h2>
              <p 
                className="text-sm mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Comprehensive insights and predictive analytics for IT service management
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label 
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Export:
                </Label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="px-3 py-1 text-sm rounded-md border"
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <Button
                variant="outline"
                onClick={() => exportAnalytics(exportFormat)}
                className="flex items-center gap-2"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
              <Button
                variant="outline"
                onClick={fetchAdvancedAnalytics}
                className="flex items-center gap-2"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="p-2"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-muted)'
                }}
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 mb-6">
            {['overview', 'detailed', 'predictive'].map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'outline'}
                onClick={() => setViewMode(mode)}
                className="capitalize"
                style={{
                  background: viewMode === mode ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: viewMode === mode ? 'white' : 'var(--text-primary)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                {mode}
              </Button>
            ))}
          </div>

          {/* Date Range Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <Label 
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Date Range:
              </Label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 text-sm rounded-md border"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>

          {/* Overview Mode */}
          {viewMode === 'overview' && (
            <div className="space-y-6">
              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card 
                    className="hover:shadow-lg transition-all duration-300"
                    style={{
                      background: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="p-3 rounded-xl"
                            style={{
                              background: 'var(--accent-success)',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p 
                              className="text-3xl font-bold mb-1"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {analytics.slaCompliance}%
                            </p>
                            <p 
                              className="text-sm font-medium"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              SLA Compliance
                            </p>
                          </div>
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card 
                    className="hover:shadow-lg transition-all duration-300"
                    style={{
                      background: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="p-3 rounded-xl"
                            style={{
                              background: 'var(--accent-info)',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p 
                              className="text-3xl font-bold mb-1"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {analytics.firstCallResolution}%
                            </p>
                            <p 
                              className="text-sm font-medium"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              First Call Resolution
                            </p>
                          </div>
                        </div>
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card 
                    className="hover:shadow-lg transition-all duration-300"
                    style={{
                      background: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="p-3 rounded-xl"
                            style={{
                              background: 'var(--accent-warning)',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p 
                              className="text-3xl font-bold mb-1"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {analytics.customerSatisfaction}%
                            </p>
                            <p 
                              className="text-sm font-medium"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Customer Satisfaction
                            </p>
                          </div>
                        </div>
                        <TrendingUp className="w-5 h-5 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card 
                    className="hover:shadow-lg transition-all duration-300"
                    style={{
                      background: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="p-3 rounded-xl"
                            style={{
                              background: 'var(--accent-danger)',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            <AlertTriangle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p 
                              className="text-3xl font-bold mb-1"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {analytics.escalationRate}%
                            </p>
                            <p 
                              className="text-sm font-medium"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Escalation Rate
                            </p>
                          </div>
                        </div>
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card 
                    style={{
                      background: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <CardHeader>
                      <h3 
                        className="text-lg font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Requests by Category
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.categoryBreakdown.map((category, index) => (
                          <div key={category.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{
                                  background: `hsl(${index * 60}, 70%, 50%)`
                                }}
                              />
                              <span 
                                className="text-sm font-medium"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {category.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-24 h-2 rounded-full overflow-hidden"
                                style={{ background: 'var(--bg-tertiary)' }}
                              >
                                <div 
                                  className="h-full rounded-full"
                                  style={{
                                    background: `hsl(${index * 60}, 70%, 50%)`,
                                    width: `${category.percentage}%`
                                  }}
                                />
                              </div>
                              <span 
                                className="text-sm font-medium w-12 text-right"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {category.count}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Performance Metrics */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card 
                    style={{
                      background: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <CardHeader>
                      <h3 
                        className="text-lg font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Performance Metrics
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-sm"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Avg Response Time
                          </span>
                          <span 
                            className="text-sm font-bold"
                            style={{ color: 'var(--accent-info)' }}
                          >
                            {analytics.responseTimeMetrics.average}h
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-sm"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Avg Resolution Time
                          </span>
                          <span 
                            className="text-sm font-bold"
                            style={{ color: 'var(--accent-success)' }}
                          >
                            {analytics.resolutionTimeMetrics.average}h
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-sm"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Workload Utilization
                          </span>
                          <span 
                            className="text-sm font-bold"
                            style={{ color: 'var(--accent-warning)' }}
                          >
                            {analytics.workloadDistribution.utilization}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-sm"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Available Capacity
                          </span>
                          <span 
                            className="text-sm font-bold"
                            style={{ color: 'var(--accent-primary)' }}
                          >
                            {analytics.workloadDistribution.availableCapacity}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          )}

          {/* Detailed Mode */}
          {viewMode === 'detailed' && (
            <div className="space-y-6">
              {/* Department Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card 
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <CardHeader>
                    <h3 
                      className="text-lg font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Department Performance
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.departmentBreakdown.map((dept, index) => (
                        <div key={dept.name} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                          <div>
                            <p 
                              className="text-sm font-medium"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {dept.name}
                            </p>
                            <p 
                              className="text-xs"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {dept.count} requests
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p 
                                className="text-sm font-bold"
                                style={{ color: 'var(--accent-info)' }}
                              >
                                {dept.avgResolutionTime}h
                              </p>
                              <p 
                                className="text-xs"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                Avg Resolution
                              </p>
                            </div>
                            <div className="text-right">
                              <p 
                                className="text-sm font-bold"
                                style={{ color: 'var(--accent-success)' }}
                              >
                                {dept.satisfaction}%
                              </p>
                              <p 
                                className="text-xs"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                Satisfaction
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Assignee Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card 
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <CardHeader>
                    <h3 
                      className="text-lg font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Team Performance
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.assigneeBreakdown.map((assignee, index) => (
                        <div key={assignee.name} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                          <div>
                            <p 
                              className="text-sm font-medium"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {assignee.name}
                            </p>
                            <p 
                              className="text-xs"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {assignee.count} requests
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p 
                                className="text-sm font-bold"
                                style={{ color: 'var(--accent-info)' }}
                              >
                                {assignee.avgResolutionTime}h
                              </p>
                              <p 
                                className="text-xs"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                Avg Resolution
                              </p>
                            </div>
                            <div className="text-right">
                              <p 
                                className="text-sm font-bold"
                                style={{ color: 'var(--accent-warning)' }}
                              >
                                {assignee.workload}%
                              </p>
                              <p 
                                className="text-xs"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                Workload
                              </p>
                            </div>
                            <div className="text-right">
                              <p 
                                className="text-sm font-bold"
                                style={{ color: 'var(--accent-success)' }}
                              >
                                {assignee.satisfaction}%
                              </p>
                              <p 
                                className="text-xs"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                Satisfaction
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Predictive Mode */}
          {viewMode === 'predictive' && (
            <div className="space-y-6">
              {/* Forecast Data */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card 
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <CardHeader>
                    <h3 
                      className="text-lg font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Demand Forecast
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.forecastData.map((forecast, index) => (
                        <div key={forecast.period} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                          <div>
                            <p 
                              className="text-sm font-medium"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {forecast.period}
                            </p>
                            <p 
                              className="text-xs"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Confidence: {forecast.confidence}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p 
                              className="text-2xl font-bold"
                              style={{ color: 'var(--accent-primary)' }}
                            >
                              {forecast.predicted}
                            </p>
                            <p 
                              className="text-xs"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Predicted Requests
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Risk Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card 
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <CardHeader>
                    <h3 
                      className="text-lg font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Risk Indicators
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.riskIndicators.map((risk, index) => (
                        <div key={risk.name} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                          <div>
                            <p 
                              className="text-sm font-medium"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {risk.name}
                            </p>
                            <p 
                              className="text-xs"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Risk Level: {risk.risk}
                            </p>
                          </div>
                          <div className="text-right">
                            <p 
                              className="text-2xl font-bold"
                              style={{ 
                                color: risk.risk === 'high' ? 'var(--accent-danger)' :
                                       risk.risk === 'medium' ? 'var(--accent-warning)' :
                                       'var(--accent-success)'
                              }}
                            >
                              {risk.value}
                            </p>
                            <p 
                              className="text-xs"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              Current Value
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Capacity Planning */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card 
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <CardHeader>
                    <h3 
                      className="text-lg font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Capacity Planning
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                          <p 
                            className="text-2xl font-bold"
                            style={{ color: 'var(--accent-info)' }}
                          >
                            {analytics.capacityPlanning.currentCapacity}%
                          </p>
                          <p 
                            className="text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Current Capacity
                          </p>
                        </div>
                        <div className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                          <p 
                            className="text-2xl font-bold"
                            style={{ color: 'var(--accent-warning)' }}
                          >
                            {analytics.capacityPlanning.projectedDemand}%
                          </p>
                          <p 
                            className="text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Projected Demand
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                        <p 
                          className="text-sm font-medium mb-2"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Capacity Gap: {analytics.capacityPlanning.capacityGap}%
                        </p>
                        <div className="space-y-2">
                          <p 
                            className="text-xs font-medium"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Recommendations:
                          </p>
                          {analytics.capacityPlanning.recommendations.map((rec, index) => (
                            <p 
                              key={index}
                              className="text-xs"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              • {rec}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdvancedAnalytics;
