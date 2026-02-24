import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, TrendingUp, TrendingDown, BarChart3, PieChart, 
  Activity, Target, Award, Clock, AlertTriangle, DollarSign,
  MapPin, Building, GraduationCap, CheckCircle, XCircle,
  ArrowUpRight, ArrowDownRight, Eye, Download
} from 'lucide-react';
import { enhancedEmployeeApi } from '../services/enhancedEmployeeApi';
import { useToast } from '../context/ToastContext';

export default function EmployeeAnalyticsDashboard() {
  const { success, error: showError } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, selectedDepartment]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load various analytics data
      const [
        departmentStats,
        skillsGapAnalysis,
        turnoverAnalysis,
        dataCompletenessReport
      ] = await Promise.all([
        enhancedEmployeeApi.analytics.getDepartmentStats(),
        enhancedEmployeeApi.analytics.getSkillsGapAnalysis(),
        enhancedEmployeeApi.analytics.getTurnoverAnalysis(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString()
        ),
        enhancedEmployeeApi.analytics.getDataCompletenessReport()
      ]);

      setAnalytics({
        departmentStats,
        skillsGapAnalysis,
        turnoverAnalysis,
        dataCompletenessReport
      });
    } catch (err) {
      showError('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-600 mb-2">Analytics Unavailable</h2>
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    );
  }

  // Calculate summary metrics
  const totalEmployees = analytics.departmentStats?.length || 0;
  const activeEmployees = analytics.departmentStats?.filter(emp => emp.status === 'active').length || 0;
  const avgPerformanceRating = analytics.departmentStats?.reduce((sum, emp) => sum + (emp.performance_rating || 0), 0) / totalEmployees || 0;
  const avgDataCompleteness = analytics.departmentStats?.reduce((sum, emp) => sum + (emp.data_completeness_score || 0), 0) / totalEmployees || 0;

  // Department distribution
  const departmentDistribution = analytics.departmentStats?.reduce((acc, emp) => {
    const dept = emp.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {}) || {};

  // Performance distribution
  const performanceDistribution = {
    'Excellent (4.5-5.0)': analytics.departmentStats?.filter(emp => (emp.performance_rating || 0) >= 4.5).length || 0,
    'Good (3.5-4.4)': analytics.departmentStats?.filter(emp => (emp.performance_rating || 0) >= 3.5 && (emp.performance_rating || 0) < 4.5).length || 0,
    'Average (2.5-3.4)': analytics.departmentStats?.filter(emp => (emp.performance_rating || 0) >= 2.5 && (emp.performance_rating || 0) < 3.5).length || 0,
    'Below Average (<2.5)': analytics.departmentStats?.filter(emp => (emp.performance_rating || 0) < 2.5).length || 0
  };

  // Data completeness distribution
  const dataCompletenessDistribution = {
    'Complete (90-100%)': analytics.dataCompletenessReport?.filter(emp => (emp.data_completeness_score || 0) >= 90).length || 0,
    'Good (70-89%)': analytics.dataCompletenessReport?.filter(emp => (emp.data_completeness_score || 0) >= 70 && (emp.data_completeness_score || 0) < 90).length || 0,
    'Fair (50-69%)': analytics.dataCompletenessReport?.filter(emp => (emp.data_completeness_score || 0) >= 50 && (emp.data_completeness_score || 0) < 70).length || 0,
    'Poor (<50%)': analytics.dataCompletenessReport?.filter(emp => (emp.data_completeness_score || 0) < 50).length || 0
  };

  const MetricCard = ({ title, value, change, icon: Icon, color = 'blue' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 text-sm ${
              change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className={`p-3 bg-${color}-100 dark:bg-${color}-900 rounded-lg`}>
          <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </motion.div>
  );

  const ChartCard = ({ title, children, className = '' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </motion.div>
  );

  const ProgressBar = ({ label, value, total, color = 'blue' }) => (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-gray-900 dark:text-white font-medium">{value}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`bg-${color}-600 h-2 rounded-full transition-all duration-300`}
          style={{ width: `${(value / total) * 100}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Employee Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights into your workforce
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Departments</option>
            {Object.keys(departmentDistribution).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Employees"
          value={totalEmployees}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Active Employees"
          value={activeEmployees}
          change={((activeEmployees / totalEmployees) * 100).toFixed(1)}
          icon={CheckCircle}
          color="green"
        />
        <MetricCard
          title="Avg Performance Rating"
          value={avgPerformanceRating.toFixed(1)}
          icon={Target}
          color="yellow"
        />
        <MetricCard
          title="Avg Data Completeness"
          value={`${avgDataCompleteness.toFixed(0)}%`}
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <ChartCard title="Department Distribution">
          <div className="space-y-3">
            {Object.entries(departmentDistribution).map(([dept, count]) => (
              <ProgressBar
                key={dept}
                label={dept}
                value={count}
                total={totalEmployees}
                color="blue"
              />
            ))}
          </div>
        </ChartCard>

        {/* Performance Distribution */}
        <ChartCard title="Performance Rating Distribution">
          <div className="space-y-3">
            {Object.entries(performanceDistribution).map(([range, count]) => (
              <ProgressBar
                key={range}
                label={range}
                value={count}
                total={totalEmployees}
                color="green"
              />
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Completeness */}
        <ChartCard title="Data Completeness Distribution">
          <div className="space-y-3">
            {Object.entries(dataCompletenessDistribution).map(([range, count]) => (
              <ProgressBar
                key={range}
                label={range}
                value={count}
                total={totalEmployees}
                color="purple"
              />
            ))}
          </div>
        </ChartCard>

        {/* Skills Gap Analysis */}
        <ChartCard title="Top Skills by Department">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {analytics.skillsGapAnalysis?.slice(0, 10).map((skill, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{skill.skill_name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({skill.department})</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  skill.skill_level === 'Expert' ? 'bg-green-100 text-green-800' :
                  skill.skill_level === 'Advanced' ? 'bg-blue-100 text-blue-800' :
                  skill.skill_level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {skill.skill_level}
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Quality Issues */}
        <ChartCard title="Data Quality Issues">
          <div className="space-y-3">
            {analytics.dataCompletenessReport?.filter(emp => (emp.data_completeness_score || 0) < 70).slice(0, 5).map((emp) => (
              <div key={emp.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{emp.full_name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({emp.department})</span>
                </div>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {emp.data_completeness_score}%
                </span>
              </div>
            ))}
            {analytics.dataCompletenessReport?.filter(emp => (emp.data_completeness_score || 0) < 70).length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No data quality issues found
              </p>
            )}
          </div>
        </ChartCard>

        {/* Turnover Analysis */}
        <ChartCard title="Recent Hires & Turnover">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analytics.turnoverAnalysis?.filter(emp => !emp.termination_date).length || 0}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">New Hires</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {analytics.turnoverAnalysis?.filter(emp => emp.termination_date).length || 0}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">Terminations</div>
              </div>
            </div>
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Last 30 days
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Insights & Recommendations */}
      <ChartCard title="Insights & Recommendations">
        <div className="space-y-4">
          {/* Data Completeness Insights */}
          {avgDataCompleteness < 80 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Data Completeness Alert</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Average data completeness is {avgDataCompleteness.toFixed(0)}%. Consider implementing data quality initiatives.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Insights */}
          {avgPerformanceRating < 3.5 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">Performance Improvement Opportunity</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Average performance rating is {avgPerformanceRating.toFixed(1)}/5. Consider performance management programs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Skills Gap Insights */}
          {analytics.skillsGapAnalysis?.length > 0 && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-800 dark:text-purple-200">Skills Development Opportunity</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                    {analytics.skillsGapAnalysis.length} skills identified across departments. Consider targeted training programs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Positive Insights */}
          {avgDataCompleteness >= 80 && avgPerformanceRating >= 3.5 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">Excellent Workforce Health</h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your workforce shows strong data quality and performance metrics. Keep up the great work!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ChartCard>
    </div>
  );
}
