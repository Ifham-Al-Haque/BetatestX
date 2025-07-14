// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import UserDropdown from "../components/UserDropdown";
import DarkModeToggle from "../components/DarkModeToggle";
import {
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [chartType, setChartType] = useState("bar");

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date_paid", { ascending: true });
    console.log("Expenses:", data);
    if (!error && data) setExpenses(data);
  }

  const totalExpense = expenses.reduce((acc, item) => acc + (item.amount_aed || 0), 0);

  const monthlyData = {};
  const serviceData = {};

  expenses.forEach((item) => {
    const month = item.date_paid
      ? new Date(item.date_paid).toLocaleDateString("en-US", { year: "numeric", month: "short" })
      : "Unknown";

    monthlyData[month] = (monthlyData[month] || 0) + (item.amount_aed || 0);
    serviceData[item.service_name || "Unknown"] =
      (serviceData[item.service_name || "Unknown"] || 0) + (item.amount_aed || 0);
  });

  const monthlyChartData = Object.entries(monthlyData).map(([month, total]) => ({
    name: month,
    amount: total,
  }));
  const serviceChartData = Object.entries(serviceData).map(([service, total]) => ({
    name: service,
    amount: total,
  }));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Top Bar */}
      <div className="flex justify-end items-center gap-4 p-4 bg-white dark:bg-gray-800 shadow">
        <DarkModeToggle />
        <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
          <UserDropdown />
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex">
        <Sidebar />
        <div className="ml-64 p-6 w-full">
          <h1 className="text-3xl font-bold mb-4">Dashboard Overview</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Total Expenses</h3>
              <p className="text-4xl text-blue-600 font-bold mt-3">AED {totalExpense.toFixed(2)}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center justify-end border border-gray-200 dark:border-gray-700">
              <span className="mr-2 text-gray-600 dark:text-gray-300">Chart Type:</span>
              <button
                className={`px-4 py-2 rounded-md text-sm mr-2 border ${
                  chartType === "bar"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
                onClick={() => setChartType("bar")}
              >
                Bar
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm border ${
                  chartType === "line"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                }`}
                onClick={() => setChartType("line")}
              >
                Line
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Expenses by Month</h3>
            <ResponsiveContainer width="100%" height={350}>
              {monthlyChartData.length === 0 ? (
                <p className="text-center text-gray-500">No data available for chart.</p>
              ) : chartType === "bar" ? (
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="amount" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Expenses by Service</h3>
            <ResponsiveContainer width="100%" height={350}>
              {serviceChartData.length === 0 ? (
                <p className="text-center text-gray-500">No data available for chart.</p>
              ) : chartType === "bar" ? (
                <BarChart data={serviceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={serviceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="amount" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

