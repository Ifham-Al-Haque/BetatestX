import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import UserDropdown from "../components/UserDropdown";
import DarkModeToggle from "../components/DarkModeToggle";
import CalendarView from "../components/CalendarView";
import { CSVLink } from "react-csv";
import Calendar from 'react-calendar';
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
  Cell,
} from "recharts";
import Filters from "../components/Filters";
import ChartSelector from "../components/ChartSelector";
import { YearlyBreakdown } from "../components/Breakdowns";
import PaginatedTable from "../components/PaginatedTable";
import moment from "moment";
import { format } from "date-fns";
import { Dialog } from "@headlessui/react";

// Define COLORS for PieChart slices
const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFE", "#FF6699", "#33CC99", "#FF9933"
];

// Inline SummaryCard component
const SummaryCard = ({ icon, title, value, color, subtitle }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow flex flex-col items-center min-h-[120px] transition hover:shadow-lg border-t-4 ${color}`}> 
    <div className="mb-2">{icon}</div>
    <h2 className="text-md font-semibold mb-1 text-center">{title}</h2>
    <p className={`text-2xl font-bold ${color.includes('green') ? 'text-green-600' : color.includes('red') ? 'text-red-600' : 'text-blue-600'}`}>{value}</p>
    {subtitle && <span className="text-xs mt-1 text-gray-500">{subtitle}</span>}
  </div>
);
// Inline SectionHeader component
const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <span>{icon}</span>
    <h3 className="text-lg font-semibold">{title}</h3>
  </div>
);
// Inline SVG icons
const BarChartIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect x="3" y="12" width="4" height="8"/><rect x="10" y="8" width="4" height="12"/><rect x="17" y="4" width="4" height="16"/></svg>
);
const MoneyIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
);
const PieChartIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M12 12l9 0"/></svg>
);
const CalendarIcon = () => (
  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
);

// Inline AnimatedCard component for professional polish
const AnimatedCard = ({ children, className = "" }) => (
  <motion.div
    whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-blue-100 dark:border-gray-700 ${className}`}
  >
    {children}
  </motion.div>
);

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [chartType, setChartType] = useState("bar");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [payments, setPayments] = useState([]);
  const [totalThisMonth, setTotalThisMonth] = useState(0);
  const [estimatedNextMonth, setEstimatedNextMonth] = useState(0);
  const [showDepartmentBreakdown, setShowDepartmentBreakdown] = useState(true);
  const [showYearlyBreakdown, setShowYearlyBreakdown] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actualCost, setActualCost] = useState(0);



function calculateEstimates(data) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const previousMonths = data.filter((p) => {
      const dueDate = new Date(p.due_date);
      return (
        dueDate.getMonth() < currentMonth &&
        dueDate.getFullYear() === currentYear
      );
    });

    const last3Months = previousMonths.slice(-3);
    const total = last3Months.reduce((sum, p) => sum + p.amount, 0);
    // Removed: setEstimatedCost(average);

    const currentMonthPayments = data.filter((p) => {
      const dueDate = new Date(p.due_date);
      return (
        dueDate.getMonth() === currentMonth &&
        dueDate.getFullYear() === currentYear
      );
    });
    const currentTotal = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    setActualCost(currentTotal);
  }
// Fetch payments and calculate estimates
  function getStatusColor(status) {
    switch (status) {
      case "paid":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-400";
      case "overdue":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  }
 //
  function handleDayClick(value) {
    const events = payments.filter((p) => {
      const dueDate = new Date(p.due_date);
      return (
        dueDate.toDateString() === value.toDateString()
      );
    });
    setSelectedDateEvents(events);
    setIsModalOpen(true);
  }
    
  // Fetch expenses on initial load
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Update overdue payments status
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
 // Fetch payments and calculate totals for this month and next month
useEffect(() => {
  const fetchPayments = async () => {
    const { data, error } = await supabase.from('payments').select('*');

    if (!error && data) {
      setPayments(data);

      const currentMonth = moment().month();
      const currentYear = moment().year();
      const nextMonth = moment().add(1, 'months').month();
      const nextMonthYear = moment().add(1, 'months').year();

      const totalCurrent = data
        .filter(p => {
          const date = moment(p.payment_date);
          return date.month() === currentMonth && date.year() === currentYear;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);
 
      const totalNext = data
        .filter(p => {
          const date = moment(p.payment_date);
          return date.month() === nextMonth && date.year() === nextMonthYear;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      setTotalThisMonth(totalCurrent);
      setEstimatedNextMonth(totalNext);
    }
  };

  fetchPayments();
}, []);

  // Auto Update Status
  useEffect(() => {
  const autoUpdateStatus = async () => {
    const today = moment().format('YYYY-MM-DD');
    const { data, error } = await supabase
      .from('payments')
      .update({ status: 'paid' })
      .lte('payment_date', today)
      .eq('status', 'pending');

    if (error) console.error('Auto-update error:', error);
  };

  autoUpdateStatus();
}, []);

  // Use actualCost in a summary card, and ensure calculateEstimates is called in a useEffect
useEffect(() => {
  calculateEstimates(payments);
}, [payments]);


 // Fetch expenses from Supabase

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

// Line 200+ area — calculate cost metrics
const costSummary = useMemo(() => {
  const now = new Date();

  const actual = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const estimated = getNextMonthEstimate(expenses); // This must be defined above

  const difference = actual - estimated;
  const overBudget = difference > 0;

  return {
    estimatedCost: estimated,
    actualThisMonth: actual,
    costDifference: difference,
    isOverBudget: overBudget,
  };
}, [expenses]);
  const { estimatedCost, actualThisMonth, costDifference, isOverBudget } = costSummary; 



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
    <>
      <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 p-10">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <img src="/Udrivehub.png" alt="Udrivehub Logo" className="h-10 w-auto" />
                <h1 className="text-4xl font-bold tracking-tight">Dashboard Overview</h1>
              </div>
              <div className="flex items-center gap-4">
                <DarkModeToggle />
                <UserDropdown />
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
              <AnimatedCard><SummaryCard icon={<BarChartIcon />} title="Estimated Cost (Next Month)" value={`AED ${estimatedCost.toFixed(2)}`} color="border-blue-500" /></AnimatedCard>
              <AnimatedCard><SummaryCard icon={<MoneyIcon />} title="Actual Cost (This Month)" value={`AED ${actualCost}`} color="border-green-500" /></AnimatedCard>
              <AnimatedCard><SummaryCard icon={<MoneyIcon />} title="Difference" value={`AED ${costDifference.toFixed(2)}`} color={isOverBudget ? "border-red-500" : "border-green-500"} subtitle={isOverBudget ? 'Over Budget' : 'Under Budget'} /></AnimatedCard>
              <AnimatedCard><SummaryCard icon={<BarChartIcon />} title="Total Expense" value={`AED ${totalExpense.toFixed(2)}`} color="border-blue-500" /></AnimatedCard>
              <AnimatedCard><SummaryCard icon={<MoneyIcon />} title="Total This Month" value={`AED ${totalThisMonth}`} color="border-green-500" /></AnimatedCard>
              <AnimatedCard><SummaryCard icon={<BarChartIcon />} title="Next Month Estimate" value={`AED ${estimatedNextMonth}`} color="border-orange-500" /></AnimatedCard>
              <AnimatedCard><SummaryCard icon={<MoneyIcon />} title="Actual This Month (Memo)" value={`AED ${actualThisMonth}`} color="border-green-400" /></AnimatedCard>
            </div>

            {/* Filters and Payment Calendar */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
              <AnimatedCard className="flex-1 w-full mb-6 md:mb-0">
                <div className="mb-4">
                  <SectionHeader icon={<BarChartIcon />} title="Filters" />
                </div>
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
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4 inline-block"
                >
                  Export to CSV
                </CSVLink>
              </AnimatedCard>
              <AnimatedCard className="w-full md:w-[340px] flex flex-col items-center">
                <SectionHeader icon={<CalendarIcon />} title="Payment Calendar" />
                <Calendar
                  onChange={setCalendarDate}
                  value={calendarDate}
                  onClickDay={handleDayClick}
                  tileContent={({ date }) => {
                    const events = payments.filter((p) => {
                      const dueDate = new Date(p.due_date);
                      return dueDate.toDateString() === date.toDateString();
                    });
                    return (
                      <div className="flex flex-col gap-1 mt-1">
                        {events.map((e) => (
                          <span
                            key={e.id}
                            className={`w-2 h-2 rounded-full mx-auto ${getStatusColor(e.status)}`}
                          />
                        ))}
                      </div>
                    );
                  }}
                  className="w-full"
                  tileClassName="!text-xs"
                />
              </AnimatedCard>
            </div>

            {/* Chart Selector */}
            <div className="mb-8">
              <SectionHeader icon={<BarChartIcon />} title="Chart Type" />
              <ChartSelector chartType={chartType} setChartType={setChartType} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <AnimatedCard>
                <SectionHeader icon={<BarChartIcon />} title="Monthly Expenses" />
                <ResponsiveContainer width="100%" height={350}>
                  {renderChart(monthlyChartData, "#2563EB")}
                </ResponsiveContainer>
              </AnimatedCard>
              <AnimatedCard>
                <SectionHeader icon={<BarChartIcon />} title="Departmental Expenses" />
                <ResponsiveContainer width="100%" height={350}>
                  {renderChart(departmentChartData, "#0bedf5b0")}
                </ResponsiveContainer>
              </AnimatedCard>
              <AnimatedCard className="lg:col-span-2">
                <SectionHeader icon={<PieChartIcon />} title="Service Expenses" />
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={fullServiceChartData}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {fullServiceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </AnimatedCard>
              <AnimatedCard className="lg:col-span-2">
                <SectionHeader icon={<BarChartIcon />} title="Service Expenses by Month (Stacked)" />
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
              </AnimatedCard>
            </div>

            {/* Yearly Breakdown Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <AnimatedCard className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <SectionHeader icon={<BarChartIcon />} title="Yearly Departmental Expense" />
                  <button
                    onClick={() => setShowDepartmentBreakdown((v) => !v)}
                    className="text-sm text-blue-600 hover:underline ml-2"
                    aria-label="Toggle Department Breakdown"
                  >
                    {showDepartmentBreakdown ? "Hide" : "Show"}
                  </button>
                </div>
                <AnimatePresence>
                  {showDepartmentBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.4 }}
                      className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-inner border max-h-80 overflow-y-auto"
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </AnimatedCard>
              <AnimatedCard className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <SectionHeader icon={<PieChartIcon />} title="Year-wise Expense" />
                  <button
                    onClick={() => setShowYearlyBreakdown((v) => !v)}
                    className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded ml-2"
                    aria-label="Toggle Yearly Breakdown"
                  >
                    {showYearlyBreakdown ? "Hide Yearly Breakdown" : "Show Yearly Breakdown"}
                  </button>
                </div>
                <AnimatePresence>
                  {showYearlyBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.4 }}
                      className=""
                    >
                      <YearlyBreakdown
                        show={showYearlyBreakdown}
                        toggle={() => setShowYearlyBreakdown((v) => !v)}
                        data={yearlyBreakdown}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </AnimatedCard>
            </div>

            {/* Upcoming Events CalendarView (optional, can be removed if not needed) */}
            <AnimatedCard className="mb-12">
              <SectionHeader icon={<CalendarIcon />} title="Upcoming Events" />
              <CalendarView events={calendarEvents} />
            </AnimatedCard>

            {/* Paginated Table */}
            <AnimatedCard className="mb-12">
              <SectionHeader icon={<BarChartIcon />} title="Expense Data" />
              <PaginatedTable data={filteredExpenses} />
            </AnimatedCard>
          </main>
        </div>
      </div>
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Events on {format(calendarDate, 'PPP')}</h3>
            {selectedDateEvents.length === 0 ? (
              <p>No payment events.</p>
            ) : (
              <ul className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <li key={event.id} className="border rounded p-2">
                    <p className="font-semibold">{event.title}</p>
                    <p>Status: <span className={`font-semibold ${getStatusColor(event.status)}`}>{event.status}</span></p>
                    <p>Amount: ${event.amount}</p>
                  </li>
                ))}
              </ul>
            )}
            <button
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}


