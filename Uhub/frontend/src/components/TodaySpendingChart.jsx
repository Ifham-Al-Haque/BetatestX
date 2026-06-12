import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { supabase } from '../supabaseClient';
import { useChartTheme } from '../hooks/useChartTheme';

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFE", 
  "#FF6699", "#33CC99", "#FF9933", "#9966FF", "#FF6666"
];

const getTodayExpenses = (expenses) => {
  const today = new Date();
  return (expenses || []).filter((expense) => {
    const expenseDate = new Date(expense.date_paid || expense.date || expense.created_at);
    return expenseDate.toDateString() === today.toDateString();
  });
};

export default function TodaySpendingChart({ data: externalData }) {
  const chartTheme = useChartTheme();
  const [fetchedExpenses, setFetchedExpenses] = useState([]);
  const [loading, setLoading] = useState(!externalData);

  useEffect(() => {
    if (externalData) {
      setLoading(false);
      return;
    }
    fetchTodayExpenses();
  }, [externalData]);

  const fetchTodayExpenses = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('date_paid', startOfDay.toISOString())
        .lte('date_paid', endOfDay.toISOString());

      if (error) {
        console.error('Error fetching today\'s expenses:', error);
        return;
      }

      setFetchedExpenses(data || []);
    } catch (error) {
      console.error('Error fetching today\'s expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayExpenses = useMemo(() => {
    if (externalData) return getTodayExpenses(externalData);
    return fetchedExpenses;
  }, [externalData, fetchedExpenses]);

  const totalToday = useMemo(
    () => todayExpenses.reduce((sum, expense) => sum + (Number(expense.amount_aed) || 0), 0),
    [todayExpenses]
  );

  const chartData = useMemo(() => {
    const departmentTotals = {};
    
    todayExpenses.forEach(expense => {
      const dept = expense.department || 'Unassigned';
      const amount = Number(expense.amount_aed) || 0;
      departmentTotals[dept] = (departmentTotals[dept] || 0) + amount;
    });

    return Object.entries(departmentTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [todayExpenses]);

  const formatCurrency = (amount) => {
    return `AED ${Number(amount).toFixed(2)}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="today-spending-chart w-full">
      {/* Header with Today's Date and Total */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Today's Spending</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{formatDate(new Date())}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
              {formatCurrency(totalToday)}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Today</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="today-spending-stat-card p-4 rounded-lg border">
          <div className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>Total Expenses</div>
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{todayExpenses.length}</div>
        </div>
        
        <div className="today-spending-stat-card p-4 rounded-lg border">
          <div className="text-sm font-medium" style={{ color: 'var(--accent-success)' }}>Departments</div>
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{chartData.length}</div>
        </div>
        
        <div className="today-spending-stat-card p-4 rounded-lg border">
          <div className="text-sm font-medium" style={{ color: 'var(--accent-info, #8b5cf6)' }}>Average per Expense</div>
          <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {todayExpenses.length > 0 ? formatCurrency(totalToday / todayExpenses.length) : 'AED 0.00'}
          </div>
        </div>
      </div>

      {/* Chart and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="today-spending-panel p-4 rounded-lg border">
          <h4 className="text-md font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Spending by Department</h4>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Amount']}
                  contentStyle={chartTheme.tooltip}
                  labelStyle={chartTheme.labelStyle}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <div>No expenses recorded today</div>
              </div>
            </div>
          )}
        </div>

        {/* Expense List */}
        <div className="today-spending-panel p-4 rounded-lg border">
          <h4 className="text-md font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Today's Expenses</h4>
          <div className="max-h-64 overflow-y-auto">
            {todayExpenses.length > 0 ? (
              <div className="space-y-3">
                {todayExpenses.map((expense, index) => (
                  <div
                    key={expense.id || index}
                    className="today-spending-list-item flex justify-between items-center p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{expense.service_name || 'Unknown Service'}</div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{expense.department || 'Unassigned'}</div>
                      {expense.description && (
                        <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{expense.description}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold" style={{ color: 'var(--accent-primary)' }}>{formatCurrency(expense.amount_aed)}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(expense.date_paid).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48" style={{ color: 'var(--text-muted)' }}>
                <div className="text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <div>No expenses today</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!externalData && (
        <div className="mt-6 text-center">
          <button
            onClick={fetchTodayExpenses}
            className="uhub-btn-primary px-6 py-2 flex items-center gap-2 mx-auto"
          >
            <span>🔄</span>
            Refresh Today's Data
          </button>
        </div>
      )}
    </div>
  );
} 