import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import UserDropdown from "../components/UserDropdown";
import DarkModeToggle from "../components/DarkModeToggle";
import CalendarView from "../components/CalendarView";
import { CSVLink } from "react-csv";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  Pie,
  Bar,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import Filters from "../components/Filters";
import ChartSelector from "../components/ChartSelector";
import { YearlyBreakdown } from "../components/Breakdowns";
import PaginatedTable from "../components/PaginatedTable";

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


  useEffect(() => {
  const updateOverduePayments = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data: overduePayments } = await supabase
      .from("payments")
      .select("id, due_date, status")
      .lt("due_date", today)
      .eq("status", "pending");

    if (overduePayments.length > 0) {
      const idsToUpdate = overduePayments.map((p) => p.id);

      const { error } = await supabase
        .from("payments")
        .update({ status: "overdue" })
        .in("id", idsToUpdate);

      if (error) console.error("Failed to update overdue payments", error);
    }
  };

  updateOverduePayments();
}, []);





  async function fetchExpenses() {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date_paid", { ascending: true });

    if (!error && data) setExpenses(data);
  }

  const calendarEvents = [
  {
    title: "AWS Renewal",
    start: new Date("2025-07-25"),
    end: new Date("2025-07-25"),
    status: "upcoming",
  },
  {
    title: "Office365 License Payment",
    start: new Date("2025-07-22"),
    end: new Date("2025-07-22"),
    status: "pending",
  },
];
<CalendarView events={calendarEvents} />

function getNextMonthEstimate(expenses) {
  const now = new Date();
  const pastMonths = expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() !== now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const last3Months = pastMonths.slice(-3);
  const total = last3Months.reduce((sum, e) => sum + e.amount, 0);
  return Math.round(total / last3Months.length || 0);
}
// Calculate actual expenses for the current month


// Calculate estimated cost for the next month
const { estimatedCost, actualThisMonth, costDifference, isOverBudget } = useMemo(() => {
  const now = new Date();

  const actualThisMonth = expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const estimatedCost = getNextMonthEstimate(expenses);

  const costDifference = actualThisMonth - estimatedCost;
  const isOverBudget = costDifference > 0;

  return { estimatedCost, actualThisMonth, costDifference, isOverBudget };
}, [expenses]);


  const departments = useMemo(
    () => ["All", ...new Set(expenses.map((e) => e.department || "Unassigned"))],
    [expenses]
  );

  const years = useMemo(() => {
    return [
      "All",
      ...new Set(
        expenses.map((e) =>
          e.date_paid ? new Date(e.date_paid).getFullYear().toString() : "Unknown"
        )
      ),
    ];
  }, [expenses]);

  const isValidDate = (d) => d instanceof Date && !isNaN(d);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const departmentMatch = departmentFilter === "All" || e.department === departmentFilter;
      const yearMatch =
        yearFilter === "All" ||
        (e.date_paid && new Date(e.date_paid).getFullYear().toString() === yearFilter);
      const date = new Date(e.date_paid);
      const startMatch = !startDate || (e.date_paid && isValidDate(date) && date >= new Date(startDate));
      const endMatch = !endDate || (e.date_paid && isValidDate(date) && date <= new Date(endDate));
      return departmentMatch && yearMatch && startMatch && endMatch;
    });
  }, [expenses, departmentFilter, yearFilter, startDate, endDate]);

  const totalExpense = useMemo(
    () =>
      filteredExpenses.reduce((acc, item) => acc + (Number(item.amount_aed) || 0), 0),
    [filteredExpenses]
  );

  const { monthlyData, serviceData, departmentData, serviceByMonthMap, allMonths } = useMemo(() => {
    const monthlyData = {};
    const serviceData = {};
    const departmentData = {};
    const serviceByMonthMap = {};

    filteredExpenses.forEach((item) => {
      const validAmount = Number(item.amount_aed) || 0;
      const month = item.date_paid
        ? new Date(item.date_paid).toLocaleDateString("en-US", { year: "numeric", month: "short" })
        : "Unknown";

      monthlyData[month] = (monthlyData[month] || 0) + validAmount;
      serviceData[item.service_name || "Unknown"] =
        (serviceData[item.service_name || "Unknown"] || 0) + validAmount;
      departmentData[item.department || "Unassigned"] =
        (departmentData[item.department || "Unassigned"] || 0) + validAmount;

      const service = item.service_name || "Unknown";
      if (!serviceByMonthMap[service]) {
        serviceByMonthMap[service] = {};
      }
      serviceByMonthMap[service][month] = (serviceByMonthMap[service][month] || 0) + validAmount;
    });

    const allMonths = Array.from(
      new Set(
        filteredExpenses.map((e) =>
          e.date_paid
            ? new Date(e.date_paid).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "Unknown"
        )
      )
    );

    return { monthlyData, serviceData, departmentData, serviceByMonthMap, allMonths };
  }, [filteredExpenses]);

  const serviceByMonthChartData = useMemo(() => {
    return allMonths.map((month) => {
      const entry = { name: month };
      for (const service in serviceByMonthMap) {
        entry[service] = serviceByMonthMap[service][month] || 0;
      }
      return entry;
    });
  }, [allMonths, serviceByMonthMap]);

  const monthlyChartData = useMemo(
    () => Object.entries(monthlyData).map(([name, amount]) => ({ name, amount })),
    [monthlyData]
  );

  const fullServiceChartData = useMemo(
    () => Object.entries(serviceData).map(([name, amount]) => ({ name, amount })),
    [serviceData]
  );

  const departmentChartData = useMemo(
    () => Object.entries(departmentData).map(([name, amount]) => ({ name, amount })),
    [departmentData]
  );

  // Group expenses by year then department (for new department-year breakdown)
  const departmentYearlyData = useMemo(() => {
    const data = {};
    filteredExpenses.forEach(({ date_paid, department, amount_aed }) => {
      const year = date_paid ? new Date(date_paid).getFullYear().toString() : "Unknown";
      const dept = department || "Unassigned";
      const amount = Number(amount_aed) || 0;
      if (!data[year]) data[year] = {};
      if (!data[year][dept]) data[year][dept] = 0;
      data[year][dept] += amount;
    });
    return data;
  }, [filteredExpenses]);

  const csvFilename = `expenses-${departmentFilter}-${yearFilter}.csv`;

  const resetFilters = useCallback(() => {
    setDepartmentFilter("All");
    setYearFilter("All");
    setStartDate("");
    setEndDate("");
  }, []);

  const renderChart = (data, color) => {
    if (data.length === 0) {
      return <p className="text-center text-gray-500">No data available</p>;
    }

    switch (chartType) {
      case "scatter":
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" type="category" />
            <YAxis dataKey="amount" type="number" />
            <Tooltip />
            <Legend />
            <Scatter data={data} fill={color} />
          </ScatterChart>
        );
      case "bar":
        return (
          <BarChart data={data}>
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
          <LineChart data={data}>
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
            />
            <Tooltip />
            <Legend />
          </PieChart>
        );
      default:
        return null;
    }
  };

  // Yearly breakdown for overall expense per year
  const yearlyBreakdown = useMemo(() => {
    const breakdown = filteredExpenses.reduce((acc, item) => {
      const year = item.date_paid ? new Date(item.date_paid).getFullYear() : "Unknown";
      acc[year] = (acc[year] || 0) + (Number(item.amount_aed) || 0);
      return acc;
    }, {});
    return Object.entries(breakdown).map(([yr, total]) => ({
      year: yr,
      total: total.toFixed(2),
    }));
  }, [filteredExpenses]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex justify-end items-center gap-4 p-4 bg-white dark:bg-gray-800 shadow">
        <DarkModeToggle />
        <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
          <UserDropdown />
        </div>
      </div>
      <div className="bg-blue-100 text-blue-900 p-4 rounded-xl shadow-md mt-6">
  <h2 className="text-lg font-semibold">Estimated Next Month Cost</h2>
  <p className="text-3xl mt-2 font-bold">AED {estimatedCost}</p>
</div>
<div className={`p-4 rounded-xl shadow-md mt-6 ${isOverBudget ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'}`}>
  <h2 className="text-lg font-semibold">Budget Comparison</h2>
  <p className="mt-2">Estimated: <strong>AED {estimatedCost}</strong></p>
  <p>Actual: <strong>AED {actualThisMonth}</strong></p>
  <p className="mt-2 font-bold">
    {isOverBudget ? `Over Budget by AED ${costDifference}` : `Under Budget by AED ${Math.abs(costDifference)}`}
  </p>
</div>

      <div className="flex">
        <Sidebar />
        <div className="ml-64 p-6 w-full">
          <h1 className="text-3xl font-bold mb-4">Dashboard Overview</h1>

          <Filters
            departments={departments}
            years={years}
            departmentFilter={departmentFilter}
            setDepartmentFilter={setDepartmentFilter}
            yearFilter={yearFilter}
            setYearFilter={setYearFilter}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            onResetFilters={resetFilters}
          />

          <CSVLink
            data={filteredExpenses}
            filename={csvFilename}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6 inline-block"
          >
            Export to CSV
          </CSVLink>

          <div className="flex items-center mb-6">
            <ChartSelector chartType={chartType} setChartType={setChartType} />
          </div>
          {/* 🔔 Calendar View */}
<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border">
  <h3 className="text-lg font-semibold mb-4">📅 Upcoming & Pending Payments</h3>
  <CalendarView
    events={[
      {
        title: "AWS Renewal",
        start: new Date("2025-07-25"),
        end: new Date("2025-07-25"),
        status: "upcoming",
      },
      {
        title: "Office365 License Payment",
        start: new Date("2025-07-22"),
        end: new Date("2025-07-22"),
        status: "pending",
      },
    ]}
  />
</div>

{/* 🔮 Estimated Cost Card */}
<div className="bg-blue-100 text-blue-900 p-4 rounded-xl shadow-md mt-6 max-w-xs">
  <h2 className="text-lg font-semibold">📈 Estimated Cost (Next Month)</h2>
  <p className="text-3xl mt-2 font-bold">AED {estimatedCost}</p>
</div>

{/* 📊 Budget Comparison */}
<div
  className={`p-4 rounded-xl shadow-md mt-6 max-w-md ${
    isOverBudget ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'
  }`}
>
  <h2 className="text-lg font-semibold">💰 Budget Comparison (This Month)</h2>
  <p className="mt-2">Estimated: <strong>AED {estimatedCost}</strong></p>
  <p>Actual: <strong>AED {actualThisMonth}</strong></p>
  <p className="mt-2 font-bold">
    {isOverBudget
      ? `⚠️ Over Budget by AED ${costDifference}`
      : `✅ Under Budget by AED ${Math.abs(costDifference)}`}
  </p>
</div>
          {/* ✅ Total Expense - moved to top */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border max-w-xs">
  <h3 className="text-md font-medium text-gray-600 dark:text-gray-300 mb-2">
    Total Expense
  </h3>
  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
    AED {totalExpense.toFixed(2)}
  </p>
</div>

          {[
            ["Monthly Expenses", monthlyChartData, "#2563EB"],
            //["Expenses Service By Month", serviceByMonthChartData, "#0ed0e9ff"],
            ["Departmental Expenses ", departmentChartData, "#0bedf5b0"],
            [" Service Expenses ", fullServiceChartData, "#0EA5E9"],
          ].map(([title, data, color]) => (
            <div
              key={title}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border"
            >
              <h3 className="text-lg font-semibold mb-4">{title}</h3>
              <ResponsiveContainer width="100%" height={350}>
                {renderChart(data, color)}
              </ResponsiveContainer>
            </div>
          ))}

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 border">
            <h3 className="text-lg font-semibold mb-4 text-black-500">
              Service Expenses Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={serviceByMonthChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.keys(serviceByMonthMap).map((service, index) => (
                  <Bar
                    key={service}
                    dataKey={service}
                    fill={`hsl(${(index * 40) % 360}, 70%, 50%)`}
                    stackId="a"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h2 className="text-xl font-semibold mb-4">
            Total Expense: AED {totalExpense.toFixed(2)}
          </h2>

          <div className="flex flex-wrap gap-4 mb-4">
            <AnimatePresence>
              <motion.div
                key="department-yearly-breakdown"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="flex-1"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold italic text-black-500">
                     Yearly Departmental Expense
                  </h3>
                  <button
                    onClick={() => setShowDepartmentBreakdown((v) => !v)}
                    className="text-sm text-blue-600 hover:underline"
                    aria-label="Toggle Department Breakdown"
                  >
                    {showDepartmentBreakdown ? "Hide" : "Show"}
                  </button>
                </div>

                {showDepartmentBreakdown && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border max-h-80 overflow-y-auto">
                    {Object.entries(departmentYearlyData).map(([year, departments]) => (
                      <div key={year} className="mb-4">
                        <h4 className="text-md font-semibold mb-2">Year: {year}</h4>
                        <ul className="list-disc list-inside">
                          {Object.entries(departments).map(([dept, total]) => (
                            <li key={dept}>
                              {dept}: AED {total.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {showYearlyBreakdown && (
                <motion.div
                  key="yearly-breakdown"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex-1"
                >
                  <YearlyBreakdown
                    show={showYearlyBreakdown}
                    toggle={() => setShowYearlyBreakdown((v) => !v)}
                    data={yearlyBreakdown}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <PaginatedTable data={filteredExpenses} />
        </div>
      </div>
    </div>
  );
}
