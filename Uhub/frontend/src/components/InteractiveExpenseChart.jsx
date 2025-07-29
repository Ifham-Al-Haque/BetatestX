import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { supabase } from '../supabaseClient';

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFE", "#FF6699", "#33CC99", "#FF9933"
];

export default function InteractiveExpenseChart() {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on component mount
  React.useEffect(() => {
    fetchExpenseData();
  }, []);

  const fetchExpenseData = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date_paid', { ascending: true });

      if (error) throw error;

      // Process monthly data
      const monthly = {};
      const serviceData = {};

      data.forEach(expense => {
        const date = new Date(expense.date_paid);
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const amount = Number(expense.amount_aed) || 0;
        const service = expense.service_name || 'Unknown';

        // Monthly totals
        monthly[monthKey] = (monthly[monthKey] || 0) + amount;

        // Service breakdown
        if (!serviceData[monthKey]) serviceData[monthKey] = {};
        serviceData[monthKey][service] = (serviceData[monthKey][service] || 0) + amount;
      });

      setMonthlyData(Object.entries(monthly).map(([month, total]) => ({ month, total })));
      setServiceBreakdown(serviceData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expense data:', error);
      setLoading(false);
    }
  };

  const handleMonthClick = (data) => {
    if (data && data.month) {
      setSelectedMonth(data.month);
    }
  };

  const handleZoomOut = () => {
    setSelectedMonth(null);
  };

  const getServiceBreakdownData = () => {
    if (!selectedMonth || !serviceBreakdown[selectedMonth]) return [];
    
    return Object.entries(serviceBreakdown[selectedMonth]).map(([service, amount]) => ({
      service,
      amount
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading expense data...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {selectedMonth ? (
        // Zoomed in view - Service breakdown for selected month
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">
              Service Breakdown - {selectedMonth}
            </h4>
            <button
              onClick={handleZoomOut}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              ← Back to Monthly View
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <h5 className="text-md font-medium mb-2">Service Distribution</h5>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getServiceBreakdownData()}
                    dataKey="amount"
                    nameKey="service"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ service, percent }) => `${service} ${(percent * 100).toFixed(0)}%`}
                  >
                    {getServiceBreakdownData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `AED ${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Service List */}
            <div>
              <h5 className="text-md font-medium mb-2">Service Details</h5>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getServiceBreakdownData().map((item, index) => (
                  <div
                    key={item.service}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{item.service}</span>
                    </div>
                    <span className="font-semibold">AED {item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Monthly view - Clickable bar chart
        <div>
          <h4 className="text-lg font-semibold mb-4">Monthly Expenses (Click to Zoom)</h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`AED ${value.toFixed(2)}`, 'Total']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Bar
                dataKey="total"
                fill="#2563EB"
                radius={[4, 4, 0, 0]}
                onClick={handleMonthClick}
                style={{ cursor: 'pointer' }}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-500 mt-2 text-center">
            💡 Click on any month bar to see detailed service breakdown
          </p>
        </div>
      )}
    </div>
  );
}
