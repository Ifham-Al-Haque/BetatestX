import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { supabase } from '../supabaseClient';

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFE", 
  "#FF6699", "#33CC99", "#FF9933", "#9966FF", "#FF6666"
];

export default function TodaySpendingChart() {
  const [todayExpenses, setTodayExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalToday, setTotalToday] = useState(0);

  useEffect(() => {
    fetchTodayExpenses();
  }, []);

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

      setTodayExpenses(data || []);
      const total = (data || []).reduce((sum, expense) => sum + (Number(expense.amount_aed) || 0), 0);
      setTotalToday(total);
    } catch (error) {
      console.error('Error fetching today\'s expenses:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="w-full">
      {/* Header with Today's Date and Total */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Today's Spending</h3>
            <p className="text-sm text-gray-600">{formatDate(new Date())}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalToday)}
            </div>
            <div className="text-sm text-gray-500">Total Today</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div 
          className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200"
        >
          <div className="text-sm text-blue-600 font-medium">Total Expenses</div>
          <div className="text-xl font-bold text-blue-800">{todayExpenses.length}</div>
        </div>
        
        <div 
          className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200"
        >
          <div className="text-sm text-green-600 font-medium">Departments</div>
          <div className="text-xl font-bold text-green-800">{chartData.length}</div>
        </div>
        
        <div 
          className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200"
        >
          <div className="text-sm text-purple-600 font-medium">Average per Expense</div>
          <div className="text-xl font-bold text-purple-800">
            {todayExpenses.length > 0 ? formatCurrency(totalToday / todayExpenses.length) : 'AED 0.00'}
          </div>
        </div>
      </div>

      {/* Chart and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-md font-semibold mb-4 text-gray-800">Spending by Department</h4>
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
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <div>No expenses recorded today</div>
              </div>
            </div>
          )}
        </div>

        {/* Expense List */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-md font-semibold mb-4 text-gray-800">Today's Expenses</h4>
          <div className="max-h-64 overflow-y-auto">
            {todayExpenses.length > 0 ? (
              <div className="space-y-3">
                {todayExpenses.map((expense, index) => (
                  <div
                    key={expense.id || index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{expense.service_name || 'Unknown Service'}</div>
                      <div className="text-sm text-gray-600">{expense.department || 'Unassigned'}</div>
                      {expense.description && (
                        <div className="text-xs text-gray-500 truncate">{expense.description}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{formatCurrency(expense.amount_aed)}</div>
                      <div className="text-xs text-gray-500">
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
              <div className="flex items-center justify-center h-48 text-gray-500">
                <div className="text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <div>No expenses today</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchTodayExpenses}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
        >
          <span>🔄</span>
          Refresh Today's Data
        </button>
      </div>
    </div>
  );
} 