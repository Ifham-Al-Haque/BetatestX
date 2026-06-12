import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useChartTheme, CHART_COLORS } from '../hooks/useChartTheme';

export const MonthlyTrendsChart = ({ data }) => {
  const chartTheme = useChartTheme();

  if (!data || data.length === 0) {
    return (
      <div className="dashboard-chart-empty flex items-center justify-center h-64 rounded-lg">
        <div className="text-center">
          <div className="dashboard-chart-empty-icon w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <p className="dashboard-chart-empty-text">No data available for monthly trends</p>
        </div>
      </div>
    );
  }

  const monthlyData = data.reduce((acc, expense) => {
    const date = new Date(expense.date_paid || expense.date || expense.created_at);
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const amount = parseFloat(expense.amount_aed || expense.amount || expense.value || expense.cost || 0);

    if (acc[monthYear]) {
      acc[monthYear] += amount;
    } else {
      acc[monthYear] = amount;
    }
    return acc;
  }, {});

  const chartData = Object.entries(monthlyData)
    .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => new Date(a.month) - new Date(b.month))
    .slice(-6);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
          <XAxis
            dataKey="month"
            stroke={chartTheme.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={chartTheme.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `AED ${(value / 1000).toFixed(1)}K`}
          />
          <Tooltip
            formatter={(value) => [`AED ${value.toLocaleString()}`, 'Total']}
            labelStyle={chartTheme.labelStyle}
            contentStyle={chartTheme.tooltip}
          />
          <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DepartmentSpendingChart = ({ data }) => {
  const chartTheme = useChartTheme();

  if (!data || data.length === 0) {
    return (
      <div className="dashboard-chart-empty flex items-center justify-center h-64 rounded-lg">
        <div className="text-center">
          <div className="dashboard-chart-empty-icon w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <p className="dashboard-chart-empty-text">No data available for department analysis</p>
        </div>
      </div>
    );
  }

  const departmentData = data.reduce((acc, expense) => {
    const department = expense.department || expense.dept || expense.division || 'Unassigned';
    const amount = parseFloat(expense.amount_aed || expense.amount || expense.value || expense.cost || 0);

    if (acc[department]) {
      acc[department] += amount;
    } else {
      acc[department] = amount;
    }
    return acc;
  }, {});

  const chartData = Object.entries(departmentData)
    .map(([department, total]) => ({
      name: department,
      value: Math.round(total * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`AED ${value.toLocaleString()}`, 'Amount']}
            labelStyle={chartTheme.labelStyle}
            contentStyle={chartTheme.tooltip}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const TrendChart = ({ data, title, subtitle, type = 'monthly' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-surface-overlay rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-content-muted">No data available for {title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-content-primary">{title}</h4>
        {subtitle && <p className="text-sm text-content-muted">{subtitle}</p>}
      </div>
      <div className="h-64">
        {type === 'monthly' ? (
          <MonthlyTrendsChart data={data} />
        ) : type === 'department' ? (
          <DepartmentSpendingChart data={data} />
        ) : (
          <div className="h-full bg-surface-overlay rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <p className="text-content-muted">Chart type not specified</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendChart;
