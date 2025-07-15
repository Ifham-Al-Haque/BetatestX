// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import UserDropdown from "../components/UserDropdown";
import DarkModeToggle from "../components/DarkModeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { CSVLink } from "react-csv";
import {
  BarChart,
  LineChart,
  PieChart,
  Pie,
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
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDepartmentBreakdown, setShowDepartmentBreakdown] = useState(true);
  const [showYearlyBreakdown, setShowYearlyBreakdown] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date_paid", { ascending: true });

    if (!error && data) setExpenses(data);
  }

  const departments = ["All", ...new Set(expenses.map((e) => e.department || "Unassigned"))];
  const years = [
    "All",
    ...new Set(
      expenses.map((e) =>
        e.date_paid ? new Date(e.date_paid).getFullYear().toString() : "Unknown"
      )
    ),
  ];

  const filteredExpenses = expenses.filter((e) => {
    const departmentMatch = departmentFilter === "All" || e.department === departmentFilter;
    const yearMatch =
      yearFilter === "All" ||
      (e.date_paid && new Date(e.date_paid).getFullYear().toString() === yearFilter);
    const startMatch = !startDate || new Date(e.date_paid) >= new Date(startDate);
    const endMatch = !endDate || new Date(e.date_paid) <= new Date(endDate);
    return departmentMatch && yearMatch && startMatch && endMatch;
  });

  const totalExpense = filteredExpenses.reduce((acc, item) => acc + (item.amount_aed || 0), 0);

  const monthlyData = {};
  const serviceData = {};
  const departmentData = {};

  filteredExpenses.forEach((item) => {
    const month = item.date_paid
      ? new Date(item.date_paid).toLocaleDateString("en-US", { year: "numeric", month: "short" })
      : "Unknown";

    monthlyData[month] = (monthlyData[month] || 0) + (item.amount_aed || 0);
    serviceData[item.service_name || "Unknown"] =
      (serviceData[item.service_name || "Unknown"] || 0) + (item.amount_aed || 0);
    departmentData[item.department || "Unassigned"] =
      (departmentData[item.department || "Unassigned"] || 0) + (item.amount_aed || 0);
  });

  const monthlyChartData = Object.entries(monthlyData).map(([name, amount]) => ({ name, amount }));
  const fullServiceChartData = Object.entries(serviceData).map(([name, amount]) => ({ name, amount }));
  const serviceChartData = [...fullServiceChartData].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const departmentChartData = Object.entries(departmentData).map(([name, amount]) => ({ name, amount }));

  const renderChart = (data, color) => {
    if (data.length === 0) {
      return <p className="text-center text-gray-500">No data available</p>;
    }

    switch (chartType) {
      case "bar":
        return (
          <BarChart data={data} onClick={(e) => alert("Clicked on: " + e?.activeLabel)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case "line":
        return (
          <LineChart data={data} onClick={(e) => alert("Clicked on: " + e?.activeLabel)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="amount" stroke={color} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        );
      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill={color}
              label
              onClick={(e) => alert("Clicked on: " + e.name)}
            />
            <Tooltip />
            <Legend />
          </PieChart>
        );
      default:
        return null;
    }
  };

  const departmentBreakdown = Object.entries(departmentData).map(([dept, total]) => ({
    department: dept,
    total: total.toFixed(2),
  }));

  const yearlyBreakdown = Object.entries(
    filteredExpenses.reduce((acc, item) => {
      const year = item.date_paid ? new Date(item.date_paid).getFullYear() : "Unknown";
      acc[year] = (acc[year] || 0) + (item.amount_aed || 0);
      return acc;
    }, {})
  ).map(([yr, total]) => ({
    year: yr,
    total: total.toFixed(2),
  }));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex justify-end items-center gap-4 p-4 bg-white dark:bg-gray-800 shadow">
        <DarkModeToggle />
        <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
          <UserDropdown />
        </div>
      </div>

      <div className="flex">
        <Sidebar />
        <div className="ml-64 p-6 w-full">
          <h1 className="text-3xl font-bold mb-4">Dashboard Overview</h1>

          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div>
              <label className="mr-2 font-semibold">Filter by Department:</label>
              <select
                className="p-2 rounded border dark:bg-gray-700 dark:text-white"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mr-2 font-semibold">Filter by Year:</label>
              <select
                className="p-2 rounded border dark:bg-gray-700 dark:text-white"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mr-2 font-semibold">Start Date:</label>
              <input
                type="date"
                className="p-2 rounded border dark:bg-gray-700 dark:text-white"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="mr-2 font-semibold">End Date:</label>
              <input
                type="date"
                className="p-2 rounded border dark:bg-gray-700 dark:text-white"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <CSVLink
              data={filteredExpenses}
              filename={`expenses-${departmentFilter}-${yearFilter}.csv`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Export to CSV
            </CSVLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border">
              <h3 className="text-lg font-semibold">Total Expenses</h3>
              <p className="text-4xl text-blue-600 font-bold mt-3">AED {totalExpense.toFixed(2)}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border flex items-center justify-end">
              <span className="mr-2">Chart Type:</span>
              {["bar", "line", "pie"].map((type) => (
                <button
                  key={type}
                  className={`px-4 py-2 rounded-md text-sm mr-2 border ${
                    chartType === type
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
                  }`}
                  onClick={() => setChartType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {[ 
            ["Expenses By Month", monthlyChartData, "#2563EB"],
            ["Expenses By Service", fullServiceChartData, "#0EA5E9"],
            ["Expenses By Department", departmentChartData, "#F59E0B"]
          ].map(([title, data, color]) => (
            <div key={title} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border">
              <h3 className="text-lg font-semibold mb-4">{title}</h3>
              <ResponsiveContainer width="100%" height={350}>
                {renderChart(data, color)}
              </ResponsiveContainer>
            </div>
          ))}

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border">
            <h3 className="text-lg font-semibold mb-4 text-red-500">Top 5 Expensive Services</h3>
            <ResponsiveContainer width="100%" height={350}>
              {renderChart(serviceChartData, "#EF4444")}
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={() => setShowDepartmentBreakdown(!showDepartmentBreakdown)}
              className={`px-4 py-2 rounded-full font-medium transition ${
                showDepartmentBreakdown
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
              }`}
            >
              {showDepartmentBreakdown ? "Hide" : "Show"} Department Breakdown
            </button>

            <button
              onClick={() => setShowYearlyBreakdown(!showYearlyBreakdown)}
              className={`px-4 py-2 rounded-full font-medium transition ${
                showYearlyBreakdown
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
              }`}
            >
              {showYearlyBreakdown ? "Hide" : "Show"} Yearly Breakdown
            </button>
          </div>

          <AnimatePresence>
            {showDepartmentBreakdown && (
              <motion.div
                key="department-breakdown"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden"
              >
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Department-wise Expense</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {departmentBreakdown.map((dept) => (
                      <li key={dept.department} className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>{dept.department}:</strong> AED {dept.total}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showYearlyBreakdown && (
              <motion.div
                key="yearly-breakdown"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden"
              >
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Year-wise Expense</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {yearlyBreakdown.map((yr) => (
                      <li key={yr.year} className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>{yr.year}:</strong> AED {yr.total}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
// Note: Ensure you have the necessary dependencies installed:
// npm install @supabase/supabase-js framer-motion recharts react-csv