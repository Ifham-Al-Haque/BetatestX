import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Star,
  MessageSquare,
  Users,
  Activity,
  CheckCircle,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  User,
  Calendar,
  XCircle,
  AlertCircle
} from 'lucide-react';

const CSPAPerformanceAnalytics = ({ data, selectedPeriod = 'month' }) => {
  const [selectedMetric, setSelectedMetric] = useState('responseTime');
  const [chartType, setChartType] = useState('bar');
  const [selectedCallType, setSelectedCallType] = useState('all'); // all, inbound, outbound
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [showAgentDetails, setShowAgentDetails] = useState(false);
  const [selectedBarData, setSelectedBarData] = useState(null);
  const [error, setError] = useState(null);

  // Call analytics data structure
  const [callAnalytics, setCallAnalytics] = useState({
    totalInbound: 0,
    totalOutbound: 0,
    weeklyData: [],
    agentData: []
  });

  // Initialize call analytics with real data
  useEffect(() => {
    try {
      if (data && data.processedData && data.dataType === 'callCenter') {
        const realCallData = generateCallAnalyticsFromData(data.processedData);
        setCallAnalytics(realCallData);
      }
    } catch (err) {
      console.error('Error in useEffect:', err);
      setError(err.message);
    }
  }, [data]);

  // Generate call analytics from real imported data
  const generateCallAnalyticsFromData = (processedData) => {
    try {
      if (!processedData || processedData.length === 0) {
        return {
          totalInbound: 0,
          totalOutbound: 0,
          weeklyData: [],
          agentData: []
        };
      }

      // Group data by week
      const weeklyGroups = {};
      const agentGroups = {};

      processedData.forEach(item => {
        try {
          // Group by week
          const date = new Date(item.startDate || item.date || new Date());
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekKey = `Week ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          
          if (!weeklyGroups[weekKey]) {
            weeklyGroups[weekKey] = { week: weekKey, inbound: 0, outbound: 0, total: 0 };
          }

          // Group by agent
          if (!agentGroups[item.agent]) {
            agentGroups[item.agent] = { 
              agent: item.agent, 
              inbound: 0, 
              outbound: 0, 
              total: 0, 
              totalTalkTime: 0,
              surveyRatings: []
            };
          }

          // Count calls by direction
          if (item.direction && (item.direction.toLowerCase().includes('inbound') || item.direction.toLowerCase().includes('in'))) {
            weeklyGroups[weekKey].inbound++;
            agentGroups[item.agent].inbound++;
          } else if (item.direction && (item.direction.toLowerCase().includes('outbound') || item.direction.toLowerCase().includes('out'))) {
            weeklyGroups[weekKey].outbound++;
            agentGroups[item.agent].outbound++;
          }

          weeklyGroups[weekKey].total++;
          agentGroups[item.agent].total++;
          agentGroups[item.agent].totalTalkTime += item.talkTime || 0;

          if (item.surveyRating > 0) {
            agentGroups[item.agent].surveyRatings.push(item.surveyRating);
          }
        } catch (itemError) {
          console.warn('Error processing item:', item, itemError);
        }
      });

      // Convert to arrays and calculate performance
      const weeklyData = Object.values(weeklyGroups);
      const agentData = Object.values(agentGroups).map(agent => ({
        ...agent,
        performance: calculateAgentPerformance(agent)
      }));

      return {
        totalInbound: weeklyData.reduce((sum, week) => sum + week.inbound, 0),
        totalOutbound: weeklyData.reduce((sum, week) => sum + week.outbound, 0),
        weeklyData,
        agentData
      };
    } catch (err) {
      console.error('Error in generateCallAnalyticsFromData:', err);
      return {
        totalInbound: 0,
        totalOutbound: 0,
        weeklyData: [],
        agentData: []
      };
    }
  };

  const calculateAgentPerformance = (agent) => {
    try {
      const avgRating = agent.surveyRatings.length > 0 
        ? agent.surveyRatings.reduce((sum, rating) => sum + rating, 0) / agent.surveyRatings.length 
        : 0;
      
      if (avgRating >= 4.5 && agent.total >= 50) return 'Excellent';
      if (avgRating >= 4.0 && agent.total >= 30) return 'Good';
      return 'Average';
    } catch (err) {
      console.error('Error calculating agent performance:', err);
      return 'Average';
    }
  };

  const metrics = [
    {
      key: 'responseTime',
      label: 'Response Time',
      icon: Clock,
      color: 'blue',
      description: 'Average time to first response'
    },
    {
      key: 'resolutionTime',
      label: 'Resolution Time',
      icon: CheckCircle,
      color: 'green',
      description: 'Average time to resolve tickets'
    },
    {
      key: 'satisfaction',
      label: 'Customer Satisfaction',
      icon: Star,
      color: 'yellow',
      description: 'Average customer rating'
    },
    {
      key: 'ticketVolume',
      label: 'Ticket Volume',
      icon: MessageSquare,
      color: 'purple',
      description: 'Total tickets received'
    }
  ];

  const getMetricData = (metricKey) => {
    try {
      // Return empty data structure since we removed mock data
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [0, 0, 0, 0, 0, 0],
        unit: '',
        trend: 'up',
        change: '0%'
      };
    } catch (err) {
      console.error('Error in getMetricData:', err);
      return {
        labels: [],
        data: [],
        unit: '',
        trend: 'up',
        change: '0%'
      };
    }
  };

  const getTrendIcon = (trend) => {
    try {
      return trend === 'up' ? (
        <TrendingUp className="w-4 h-4 text-green-600" />
      ) : (
        <TrendingDown className="w-4 h-4 text-red-600" />
      );
    } catch (err) {
      console.error('Error in getTrendIcon:', err);
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
  };

  const getTrendColor = (trend) => {
    try {
      return trend === 'up' ? 'text-green-600' : 'text-red-600';
    } catch (err) {
      console.error('Error in getTrendColor:', err);
      return 'text-green-600';
    }
  };

  const renderChart = () => {
    try {
      const metricData = getMetricData(selectedMetric);
      
      switch (chartType) {
        case 'bar':
          return renderBarChart(metricData);
        case 'line':
          return renderLineChart(metricData);
        case 'pie':
          return renderPieChart(metricData);
        default:
          return renderBarChart(metricData);
      }
    } catch (err) {
      console.error('Error in renderChart:', err);
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>Error rendering chart</p>
          </div>
        </div>
      );
    }
  };

  const renderBarChart = (metricData) => {
    try {
      if (!metricData || !metricData.data || metricData.data.length === 0) {
        return (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-2" />
              <p>No data available</p>
            </div>
          </div>
        );
      }
      
      const maxValue = Math.max(...metricData.data);
      
      return (
        <div className="h-64 flex items-end justify-between space-x-2">
          {metricData.data.map((value, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="w-full bg-blue-100 rounded-t-lg relative">
                <div
                  className="bg-blue-600 rounded-t-lg transition-all duration-500 ease-out"
                  style={{
                    height: `${(value / maxValue) * 200}px`,
                    minHeight: '20px'
                  }}
                />
              </div>
              <span className="text-xs text-gray-600 mt-2">{metricData.labels[index]}</span>
            </div>
          ))}
        </div>
      );
    } catch (err) {
      console.error('Error in renderBarChart:', err);
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>Error rendering bar chart</p>
          </div>
        </div>
      );
    }
  };

  const renderLineChart = (metricData) => {
    try {
      if (!metricData || !metricData.data || metricData.data.length === 0) {
        return (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <LineChart className="w-12 h-12 mx-auto mb-2" />
              <p>No data available</p>
            </div>
          </div>
        );
      }
      
      const maxValue = Math.max(...metricData.data);
      const minValue = Math.min(...metricData.data);
      const range = maxValue - minValue;
      
      return (
        <div className="h-64 relative">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              points={metricData.data.map((value, index) => {
                const x = (index / (metricData.data.length - 1)) * 100;
                const y = 100 - ((value - minValue) / range) * 80 - 10;
                return `${x},${y}`;
              }).join(' ')}
            />
            {metricData.data.map((value, index) => {
              const x = (index / (metricData.data.length - 1)) * 100;
              const y = 100 - ((value - minValue) / range) * 80 - 10;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#3B82F6"
                />
              );
            })}
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-600">
            {metricData.labels.map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </div>
        </div>
      );
    } catch (err) {
      console.error('Error in renderLineChart:', err);
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>Error rendering line chart</p>
          </div>
        </div>
      );
    }
  };

  const renderPieChart = (metricData) => {
    try {
      if (!metricData || !metricData.data || metricData.data.length === 0) {
        return (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <PieChart className="w-12 h-12 mx-auto mb-2" />
              <p>No data available</p>
            </div>
          </div>
        );
      }

      const total = metricData.data.reduce((sum, value) => sum + value, 0);
      let currentAngle = 0;
      
      return (
        <div className="h-64 flex items-center justify-center">
          <svg className="w-48 h-48" viewBox="0 0 100 100">
            {metricData.data.map((value, index) => {
              const percentage = value / total;
              const angle = percentage * 360;
              const startAngle = currentAngle;
              currentAngle += angle;
              
              const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
              const y2 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              return (
                <path
                  key={index}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={`hsl(${(index * 60) % 360}, 70%, 60%)`}
                  stroke="#fff"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
        </div>
      );
    } catch (err) {
      console.error('Error in renderPieChart:', err);
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>Error rendering pie chart</p>
          </div>
        </div>
      );
    }
  };

  // Error boundary
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Component Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => setError(null)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Call Analytics Section */}
      {data && data.processedData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Call Analytics</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Call Type:</span>
              <select
                value={selectedCallType}
                onChange={(e) => setSelectedCallType(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Calls</option>
                <option value="inbound">Inbound Only</option>
                <option value="outbound">Outbound Only</option>
              </select>
            </div>
          </div>

          {/* Call Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <PhoneIncoming className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Inbound</p>
                  <p className="text-2xl font-bold text-blue-900">{callAnalytics.totalInbound}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <PhoneOutgoing className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Outbound</p>
                  <p className="text-2xl font-bold text-green-900">{callAnalytics.totalOutbound}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-3">
                <Phone className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Calls</p>
                  <p className="text-2xl font-bold text-purple-900">{callAnalytics.totalInbound + callAnalytics.totalOutbound}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Call Comparison Chart */}
          {callAnalytics.weeklyData.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Weekly Call Comparison</h4>
              <div className="h-64 flex items-end justify-between space-x-2">
                {callAnalytics.weeklyData.map((week, index) => {
                  const displayData = selectedCallType === 'inbound' ? week.inbound :
                                    selectedCallType === 'outbound' ? week.outbound :
                                    week.total;
                  const maxValue = Math.max(...callAnalytics.weeklyData.map(w => 
                    selectedCallType === 'inbound' ? w.inbound :
                    selectedCallType === 'outbound' ? w.outbound :
                    w.total
                  ));
                  const barColor = selectedCallType === 'inbound' ? 'bg-blue-600' :
                                 selectedCallType === 'outbound' ? 'bg-green-600' :
                                 'bg-purple-600';
                  
                  return (
                    <div key={week.week} className="flex flex-col items-center flex-1">
                      <div className="w-full bg-gray-100 rounded-t-lg relative">
                        <div
                          className={`${barColor} rounded-t-lg transition-all duration-500 ease-out cursor-pointer hover:opacity-80`}
                          style={{
                            height: `${(displayData / maxValue) * 200}px`,
                            minHeight: '20px'
                          }}
                          onClick={() => {
                            setSelectedWeek(week);
                            setShowAgentDetails(true);
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 mt-2">{week.week}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data Source Info */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <Phone className="w-4 h-4" />
              <span>
                <strong>Data Source:</strong> {data && data.processedData ? 
                  `Showing real data from ${data.file?.name || 'imported file'}` : 
                  'No data available. Import your call center data to see analytics.'
                }
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance Analytics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Performance Analytics</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Chart Type:</span>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const metricData = getMetricData(metric.key);
            const isSelected = selectedMetric === metric.key;
            
            return (
              <button
                key={metric.key}
                onClick={() => setSelectedMetric(metric.key)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-lg bg-${metric.color}-100`}>
                    <Icon className={`w-5 h-5 text-${metric.color}-600`} />
                  </div>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(metricData.trend)}
                    <span className={`text-sm font-medium ${getTrendColor(metricData.trend)}`}>
                      {metricData.change}
                    </span>
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                  {metricData.data[metricData.data.length - 1]}{metricData.unit}
                </h4>
                <p className="text-sm text-gray-600">{metric.label}</p>
                <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
              </button>
            );
          })}
        </div>

        {/* Chart Display */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              {metrics.find(m => m.key === selectedMetric)?.label} Trend
            </h4>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Period: {selectedPeriod}</span>
              <span>•</span>
              <span>Last 6 months</span>
            </div>
          </div>
          
          {renderChart()}
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {metrics.find(m => m.key === selectedMetric)?.description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Key Insights - Will be populated from real data */}
      {data && Object.keys(data).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="text-center py-8">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Data Analysis in Progress</h4>
            <p className="text-gray-600">
              Insights will be generated automatically based on your imported customer service data.
            </p>
          </div>
        </motion.div>
      )}

      {/* Agent Details Modal */}
      {showAgentDetails && selectedWeek && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Agent Performance for {selectedWeek.week}
              </h3>
              <button
                onClick={() => setShowAgentDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Inbound Calls</h4>
                <p className="text-2xl font-bold text-blue-900">{selectedWeek.inbound}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Outbound Calls</h4>
                <p className="text-2xl font-bold text-green-900">{selectedWeek.outbound}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Agent Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inbound</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outbound</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {callAnalytics.agentData.map((agent, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-sm text-gray-900">{agent.agent}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{agent.inbound}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{agent.outbound}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{agent.total}</td>
                        <td className="px-3 py-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            agent.performance === 'Excellent' ? 'bg-green-100 text-green-800' :
                            agent.performance === 'Good' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {agent.performance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowAgentDetails(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSPAPerformanceAnalytics;
