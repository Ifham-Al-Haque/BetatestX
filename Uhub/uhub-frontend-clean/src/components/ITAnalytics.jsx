import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, TrendingDown, Clock, Users, 
  AlertTriangle, CheckCircle, XCircle, Calendar, Target,
  Download, RefreshCw, Filter, ChevronDown, ChevronUp,
  Activity, Award, Timer, Globe, Zap, Flag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { itServicesApi } from '../services/itServicesApi';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Label from '../components/ui/label';
import LoadingSpinner from '../components/LoadingSpinner';

const ITAnalytics = ({ onClose }) => {
  const { user, userProfile } = useAuth();
  const { isDark } = useTheme();
  
  const [analytics, setAnalytics] = useState({
    totalRequests: 0,
    openRequests: 0,
    inProgressRequests: 0,
    resolvedRequests: 0,
    closedRequests: 0,
    cancelledRequests: 0,
    averageResolutionTime: 0,
    categoryBreakdown: [],
    priorityBreakdown: [],
    monthlyTrends: [],
    unassignedRequests: 0,
    overdueRequests: 0,
    topRequesters: [],
    resolutionTimeByCategory: [],
    slaCompliance: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, fetchAnalytics]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const stats = await itServicesApi.requests.getStats(user?.id, userProfile?.role);
      
      // Calculate additional metrics
      const now = new Date();
      const daysAgo = parseInt(dateRange);
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      setAnalytics({
        totalRequests: stats.total_requests,
        openRequests: stats.open_requests,
        inProgressRequests: stats.in_progress_requests,
        resolvedRequests: stats.resolved_requests,
        closedRequests: stats.closed_requests,
        cancelledRequests: stats.cancelled_requests,
        averageResolutionTime: 24, // Mock data - would be calculated from actual data
        categoryBreakdown: [
          { name: 'Hardware', count: 15, percentage: 30 },
          { name: 'Software', count: 12, percentage: 24 },
          { name: 'Access', count: 10, percentage: 20 },
          { name: 'Network', count: 8, percentage: 16 },
          { name: 'Other', count: 5, percentage: 10 }
        ],
        priorityBreakdown: [
          { name: 'Critical', count: 5, percentage: 10 },
          { name: 'High', count: 15, percentage: 30 },
          { name: 'Medium', count: 20, percentage: 40 },
          { name: 'Low', count: 10, percentage: 20 }
        ],
        monthlyTrends: [
          { month: 'Jan', requests: 45, resolved: 42 },
          { month: 'Feb', requests: 52, resolved: 48 },
          { month: 'Mar', requests: 38, resolved: 35 },
          { month: 'Apr', requests: 61, resolved: 58 },
          { month: 'May', requests: 47, resolved: 44 },
          { month: 'Jun', requests: 55, resolved: 52 }
        ],
        unassignedRequests: stats.unassigned_requests,
        overdueRequests: 3, // Mock data
        topRequesters: [
          { name: 'John Doe', count: 12, department: 'Sales' },
          { name: 'Jane Smith', count: 8, department: 'Marketing' },
          { name: 'Mike Johnson', count: 6, department: 'IT' }
        ],
        resolutionTimeByCategory: [
          { category: 'Hardware', avgHours: 48 },
          { category: 'Software', avgHours: 24 },
          { category: 'Access', avgHours: 12 },
          { category: 'Network', avgHours: 72 }
        ],
        slaCompliance: 85 // Mock data
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Mock export functionality
    const data = {
      dateRange,
      analytics,
      exportedAt: new Date().toISOString()
    };
    
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
        <LoadingSpinner size="xl" text="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
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
                className="text-2xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                IT Service Analytics
              </h2>
              <p 
                className="text-sm mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Comprehensive insights into IT service request performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={exportData}
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
                onClick={fetchAnalytics}
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

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                          background: 'var(--accent-primary)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p 
                          className="text-3xl font-bold mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {analytics.totalRequests}
                        </p>
                        <p 
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Total Requests
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
                          {analytics.resolvedRequests}
                        </p>
                        <p 
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Resolved
                        </p>
                      </div>
                    </div>
                    <Award className="w-5 h-5 text-green-500" />
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
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p 
                          className="text-3xl font-bold mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {analytics.averageResolutionTime}h
                        </p>
                        <p 
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Avg Resolution Time
                        </p>
                      </div>
                    </div>
                    <Timer className="w-5 h-5 text-yellow-500" />
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
                          background: 'var(--accent-info)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <Target className="w-6 h-6 text-white" />
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
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts and Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

            {/* Priority Breakdown */}
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
                    Requests by Priority
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.priorityBreakdown.map((priority, index) => (
                      <div key={priority.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{
                              background: index === 0 ? 'var(--accent-danger)' :
                                        index === 1 ? 'var(--accent-warning)' :
                                        index === 2 ? 'var(--accent-info)' :
                                        'var(--accent-success)'
                            }}
                          />
                          <span 
                            className="text-sm font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {priority.name}
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
                                background: index === 0 ? 'var(--accent-danger)' :
                                          index === 1 ? 'var(--accent-warning)' :
                                          index === 2 ? 'var(--accent-info)' :
                                          'var(--accent-success)',
                                width: `${priority.percentage}%`
                              }}
                            />
                          </div>
                          <span 
                            className="text-sm font-medium w-12 text-right"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {priority.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Additional Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Requesters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
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
                    Top Requesters
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topRequesters.map((requester, index) => (
                      <div key={requester.name} className="flex items-center justify-between">
                        <div>
                          <p 
                            className="text-sm font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {requester.name}
                          </p>
                          <p 
                            className="text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {requester.department}
                          </p>
                        </div>
                        <span 
                          className="text-sm font-bold"
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          {requester.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Resolution Time by Category */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
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
                    Avg Resolution Time
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.resolutionTimeByCategory.map((item, index) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <span 
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {item.category}
                        </span>
                        <span 
                          className="text-sm font-bold"
                          style={{ color: 'var(--accent-info)' }}
                        >
                          {item.avgHours}h
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
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
                    Quick Stats
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-sm"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Unassigned Requests
                      </span>
                      <span 
                        className="text-sm font-bold"
                        style={{ color: 'var(--accent-warning)' }}
                      >
                        {analytics.unassignedRequests}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-sm"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Overdue Requests
                      </span>
                      <span 
                        className="text-sm font-bold"
                        style={{ color: 'var(--accent-danger)' }}
                      >
                        {analytics.overdueRequests}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-sm"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Open Requests
                      </span>
                      <span 
                        className="text-sm font-bold"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        {analytics.openRequests}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-sm"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        In Progress
                      </span>
                      <span 
                        className="text-sm font-bold"
                        style={{ color: 'var(--accent-info)' }}
                      >
                        {analytics.inProgressRequests}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ITAnalytics;
