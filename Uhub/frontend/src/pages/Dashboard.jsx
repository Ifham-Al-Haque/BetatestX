import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import UserDropdown from "../components/UserDropdown";
import DarkModeToggle from "../components/DarkModeToggle";
import { CSVLink } from "react-csv";
import Calendar from 'react-calendar';
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Filters from "../components/Filters";
import PaginatedTable from "../components/PaginatedTable";
import ScrollableExpenseTable from "../components/ScrollableExpenseTable";
import moment from "moment";
import { format } from "date-fns";
import { Dialog } from "@headlessui/react";
import InteractiveExpenseChart from "../components/InteractiveExpenseChart";
import TodaySpendingChart from "../components/TodaySpendingChart";
import UpcomingPaymentEvents from "../components/UpcomingPaymentEvents";

// Colors for charts (used in chart styling)
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B', '#4ECDC4', '#45B7D1'];

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
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const LineChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
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
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [payments, setPayments] = useState([]);
  const [totalThisMonth, setTotalThisMonth] = useState(0);
  const [estimatedNextMonth, setEstimatedNextMonth] = useState(0);
  const [showDepartmentBreakdown, setShowDepartmentBreakdown] = useState(true);
  const [showYearlyBreakdown, setShowYearlyBreakdown] = useState(true);
  const [showScrollableTable, setShowScrollableTable] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actualCost, setActualCost] = useState(0);
  const [dataSource, setDataSource] = useState('loading'); // 'loading', 'database', 'fallback'

// Calculate estimated cost based on previous months' data

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
    console.log('📊 Estimated cost calculation:', total);

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
  // Enhanced calendar day click handler
  function handleDayClick(value) {
    const clickedDate = value.toDateString();
    
    // Get payments for this date
    const paymentEvents = payments.filter((p) => {
      const dueDate = new Date(p.due_date);
      return dueDate.toDateString() === clickedDate;
    });
    
    // Get calendar events for this date
    const calendarEventsForDate = calendarEvents.filter((event) => {
      return event.start.toDateString() === clickedDate;
    });
    
    // Combine all events for this date
    const allEvents = [
      ...paymentEvents.map(p => ({
        ...p,
        type: 'payment',
        title: p.title || 'Payment',
        amount: p.amount,
        status: p.status
      })),
      ...calendarEventsForDate.map(e => ({
        ...e,
        type: 'calendar',
        title: e.title,
        amount: e.amount,
        status: e.status
      }))
    ];
    
    setSelectedDateEvents(allEvents);
    setIsModalOpen(true);
  }
    
  // Fetch expenses on initial load - Temporarily disabled
  // useEffect(() => {
  //   fetchExpenses();
  // }, []);

  // Update overdue payments status - Temporarily disabled until database is set up
  // useEffect(() => {
  // const updateOverduePayments = async () => {
  //   try {
  //     // First check if payments table exists by trying to select from it
  //     const { data: testData, error: testError } = await supabase
  //       .from('payments')
  //       .select('id')
  //       .limit(1);

  //     if (testError) {
  //       console.log('Payments table not available yet:', testError.message);
  //       return; // Exit early if table doesn't exist
  //     }

  //     const today = new Date().toISOString().split("T")[0];

  //     const { data: overduePayments, error: selectError } = await supabase
  //       .from("payments")
  //       .select("id, due_date, status")
  //       .lt("due_date", today)
  //       .eq("status", "pending");

  //     if (selectError) {
  //       console.error("Error fetching overdue payments:", selectError);
  //       return;
  //     }

  //     if (overduePayments && overduePayments.length > 0) {
  //       const idsToUpdate = overduePayments.map((p) => p.id);

  //       const { error } = await supabase
  //         .from("payments")
  //         .update({ status: "overdue" })
  //         .in("id", idsToUpdate);

  //       if (error) {
  //         console.error("Failed to update overdue payments", error);
  //         // Don't throw error, just log it
  //       }
  //     }
  //   } catch (err) {
  //     console.error("Error in updateOverduePayments:", err);
  //     // Don't throw error, just log it
  //   }
  // };

  // updateOverduePayments();
  // }, []);
 // Fetch payments and calculate totals for this month and next month - Temporarily disabled
// useEffect(() => {
//   const fetchPayments = async () => {
//     try {
//       // First check if payments table exists by trying to select from it
//       const { data: testData, error: testError } = await supabase
//         .from('payments')
//         .select('id')
//         .limit(1);

//       if (testError) {
//         console.log('Payments table not available yet:', testError.message);
//         setPayments([]);
//         setTotalThisMonth(0);
//         setEstimatedNextMonth(0);
//         return; // Exit early if table doesn't exist
//       }

//       const { data, error } = await supabase.from('payments').select('*');

//       if (error) {
//         console.error('Error fetching payments:', error);
//         // Set empty array if table doesn't exist or other error
//         setPayments([]);
//         setTotalThisMonth(0);
//         setEstimatedNextMonth(0);
//         return;
//       }

//       if (data) {
//         setPayments(data);

//         const currentMonth = moment().month();
//         const currentYear = moment().year();
//         const nextMonth = moment().add(1, 'months').month();
//         const nextMonthYear = moment().add(1, 'months').year();

//         const totalCurrent = data
//           .filter(p => {
//             const date = moment(p.payment_date);
//             return date.month() === currentMonth && date.year() === currentYear;
//           })
//           .reduce((sum, p) => sum + Number(p.amount || 0), 0);
   
//         const totalNext = data
//           .filter(p => {
//             const date = moment(p.payment_date);
//             return date.month() === nextMonth && date.year() === nextMonthYear;
//           })
//           .reduce((sum, p) => sum + Number(p.amount || 0), 0);

//         setTotalThisMonth(totalCurrent);
//         setEstimatedNextMonth(totalNext);
//       }
//     } catch (err) {
//       console.error('Error in fetchPayments:', err);
//       setPayments([]);
//       setTotalThisMonth(0);
//       setEstimatedNextMonth(0);
//     }
//   };

//   fetchPayments();
// }, []);

  // Auto Update Status - Temporarily disabled until database is set up
  // useEffect(() => {
  //   const autoUpdateStatus = async () => {
  //     try {
  //       // First check if payments table exists by trying to select from it
  //       const { data: testData, error: testError } = await supabase
  //         .from('payments')
  //         .select('id')
  //         .limit(1);

  //       if (testError) {
  //         console.log('Payments table not available yet:', testError.message);
  //         return; // Exit early if table doesn't exist
  //       }

  //       const today = moment().format('YYYY-MM-DD');
  //       const { data, error } = await supabase
  //         .from('payments')
  //         .update({ status: 'paid' })
  //         .lte('payment_date', today)
  //         .eq('status', 'pending');

  //       if (error) {
  //         console.error('Auto-update error:', error);
  //         // Don't throw error, just log it
  //       }
  //     } catch (err) {
  //       console.error('Auto-update error:', err);
  //       // Don't throw error, just log it
  //     }
  //   };

  //   autoUpdateStatus();
  // }, []);

  // Use actualCost in a summary card, and ensure calculateEstimates is called in a useEffect
  useEffect(() => {
    if (payments && payments.length > 0) {
      calculateEstimates(payments);
    }
  }, [payments]);

// Fetch expenses on component mount - Temporarily disabled
// useEffect(() => {
//   fetchExpenses();
// }, []);


   // Fetch expenses from Supabase - Now handled in fetchRealData
  // async function fetchExpenses() {
  //   // This function is now replaced by fetchRealData
  // }

  const calendarEvents = [
    {
      title: "AWS Renewal",
      start: new Date("2025-07-25"),
      end: new Date("2025-07-25"),
      status: "upcoming",
      amount: 2500,
      description: "Annual AWS infrastructure renewal"
    },
    {
      title: "Office365 License Payment",
      start: new Date("2025-07-22"),
      end: new Date("2025-07-22"),
      status: "pending",
      amount: 1200,
      description: "Monthly Office365 license renewal"
    },
    {
      title: "Atlassian Subscription",
      start: new Date("2025-07-28"),
      end: new Date("2025-07-28"),
      status: "upcoming",
      amount: 800,
      description: "Quarterly Atlassian tools subscription"
    },
    {
      title: "Ziwo CRM Payment",
      start: new Date("2025-07-30"),
      end: new Date("2025-07-30"),
      status: "pending",
      amount: 600,
      description: "Monthly Ziwo CRM service payment"
    }
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
    console.log('🔍 Filtering expenses:', expenses.length, 'total records');
    console.log('🔍 Sample raw expenses:', expenses.slice(0, 2));
    
    const filtered = expenses.filter((e) => {
      const departmentMatch = departmentFilter === "All" || e.department === departmentFilter;
      const yearMatch =
        yearFilter === "All" ||
        (e.date_paid && new Date(e.date_paid).getFullYear().toString() === yearFilter);
      const date = new Date(e.date_paid);
      const startMatch = !startDate || (e.date_paid && isValidDate(date) && date >= new Date(startDate));
      const endMatch = !endDate || (e.date_paid && isValidDate(date) && date <= new Date(endDate));
      return departmentMatch && yearMatch && startMatch && endMatch;
    });
    
    console.log('✅ Filtered expenses:', filtered.length, 'records after filtering');
    console.log('✅ Sample filtered expenses:', filtered.slice(0, 2));
    
    // Check for data quality issues
    const issues = [];
    filtered.forEach((expense, index) => {
      if (!expense.amount_aed || expense.amount_aed <= 0) {
        issues.push(`Record ${index + 1}: Missing or zero amount`);
      }
      if (!expense.department || expense.department.trim() === '') {
        issues.push(`Record ${index + 1}: Missing department`);
      }
      if (!expense.date_paid) {
        issues.push(`Record ${index + 1}: Missing date`);
      }
    });
    
    if (issues.length > 0) {
      console.warn('⚠️ Data quality issues found:', issues);
    }
    
    return filtered;
  }, [expenses, departmentFilter, yearFilter, startDate, endDate]);

  const totalExpense = useMemo(
    () =>
      filteredExpenses.reduce((acc, item) => acc + (Number(item.amount_aed) || 0), 0),
    [filteredExpenses]
  );

  const { monthlyData, departmentData, allMonths } = useMemo(() => {
    console.log('📊 Calculating chart data from', filteredExpenses.length, 'filtered expenses');
    console.log('📊 Sample filtered expenses:', filteredExpenses.slice(0, 3));
    
    const monthlyData = {};
    const departmentData = {};

    filteredExpenses.forEach((item, index) => {
      const validAmount = Number(item.amount_aed) || 0;
      
      // Handle date parsing more robustly
      let month = "Unknown";
      if (item.date_paid) {
        try {
          const date = new Date(item.date_paid);
          if (!isNaN(date.getTime())) {
            month = date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
          }
        } catch (error) {
          console.warn('⚠️ Invalid date for expense:', item.date_paid, 'in record:', index);
        }
      }

      // Normalize department name
      const dept = (item.department || "Unassigned").trim();
      
      // Normalize service name
      const service = (item.service_name || "Unknown").trim();

      monthlyData[month] = (monthlyData[month] || 0) + validAmount;
      departmentData[dept] = (departmentData[dept] || 0) + validAmount;
      
      console.log(`📊 Processing expense ${index + 1}:`, {
        amount: validAmount,
        month: month,
        department: dept,
        service: service
      });
    });

    const allMonths = Array.from(
      new Set(
        filteredExpenses.map((e) => {
          if (e.date_paid) {
            try {
              const date = new Date(e.date_paid);
              if (!isNaN(date.getTime())) {
                return date.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                });
              }
            } catch (error) {
              console.warn('⚠️ Invalid date in allMonths calculation:', e.date_paid);
            }
          }
          return "Unknown";
        })
      )
    );

    console.log('📈 Department data:', Object.keys(departmentData).length, 'departments');
    console.log('📈 Monthly data:', Object.keys(monthlyData).length, 'months');
    console.log('📈 Sample department data:', Object.entries(departmentData).slice(0, 3));
    console.log('📈 All months:', allMonths);

    return { monthlyData, departmentData, allMonths };
  }, [filteredExpenses]);

  // Chart data calculations - used in InteractiveExpenseChart component
  const monthlyChartData = useMemo(
    () => Object.entries(monthlyData).map(([name, amount]) => ({ name, amount })),
    [monthlyData]
  );

  

  const departmentChartData = useMemo(
    () => Object.entries(departmentData).map(([name, amount]) => ({ name, amount })),
    [departmentData]
  );

  // Group expenses by year then department (for new department-year breakdown)
  const departmentYearlyData = useMemo(() => {
    console.log('📊 Calculating department yearly data from', filteredExpenses.length, 'expenses');
    
    const data = {};
    filteredExpenses.forEach(({ date_paid, department, amount_aed }, index) => {
      let year = "Unknown";
      if (date_paid) {
        try {
          const date = new Date(date_paid);
          if (!isNaN(date.getTime())) {
            year = date.getFullYear().toString();
          }
        } catch (error) {
          console.warn('⚠️ Invalid date for yearly breakdown:', date_paid, 'in record:', index);
        }
      }
      
      // Normalize department name to prevent duplicates
      const dept = department ? department.trim() : "Unassigned";
      const amount = Number(amount_aed) || 0;
      
      if (!data[year]) data[year] = {};
      if (!data[year][dept]) data[year][dept] = 0;
      data[year][dept] += amount;
      
      console.log(`📊 Yearly breakdown - Record ${index + 1}:`, {
        year: year,
        department: dept,
        amount: amount,
        running_total: data[year][dept]
      });
    });
    
    console.log('📈 Department yearly data:', data);
    return data;
  }, [filteredExpenses]);

  const csvFilename = `expenses-${departmentFilter}-${yearFilter}.csv`;

  // Function to get calendar tile content for events
  const getCalendarTileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toDateString();
      const eventsForDate = calendarEvents.filter(event => 
        event.start.toDateString() === dateString
      );
      
      if (eventsForDate.length > 0) {
        return (
          <div className="calendar-event-indicator">
            {eventsForDate.map((event, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                  event.status === 'upcoming' ? 'bg-blue-500' : 
                  event.status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                title={`${event.title} - AED ${event.amount}`}
              />
            ))}
          </div>
        );
      }
    }
    return null;
  };

  const resetFilters = useCallback(() => {
    setDepartmentFilter("All");
    setYearFilter("All");
    setStartDate("");
    setEndDate("");
  }, []);

  // Fetch upcoming payment events - handled by UpcomingPaymentEvents component
  // const fetchUpcomingEvents = async () => {
  //   // This is now handled by the UpcomingPaymentEvents component
  // };

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

  // Test function to check if payments table is accessible - Temporarily disabled
  // const testPaymentsTable = async () => {
  //   try {
  //     console.log('Testing payments table access...');
  //     const { data, error } = await supabase
  //       .from('payments')
  //       .select('id, title, amount, payment_date, status')
  //       .limit(1);

  //     if (error) {
  //       console.error('Payments table access error:', error);
  //       return false;
  //     }

  //     console.log('✅ Payments table is accessible:', data);
  //     return true;
  //   } catch (err) {
  //     console.error('Payments table test failed:', err);
  //     return false;
  //   }
  // };

  // Test and enable functions if table is accessible - Temporarily disabled
  // useEffect(() => {
  //   const checkAndEnable = async () => {
  //     const isAccessible = await testPaymentsTable();
  //     if (isAccessible) {
  //       console.log('✅ Payments table accessible - enabling functions');
  //       // You can uncomment the functions here if needed
  //     } else {
  //       console.log('❌ Payments table not accessible - keeping functions disabled');
  //     }
  //   };

  //   checkAndEnable();
  // }, []);

  // Safe function to test database access and enable real data
  const enableRealData = async () => {
    try {
      console.log('🔍 Testing database access...');
      
      // Test expenses table (primary focus since you have 112 records)
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('id, service_name, amount_aed, date_paid, department, service_status, currency, months')
        .limit(1);

      if (expensesError) {
        console.error('❌ Expenses table error:', expensesError);
        console.log('💡 Error details:', {
          message: expensesError.message,
          details: expensesError.details,
          hint: expensesError.hint,
          code: expensesError.code
        });
        console.log('💡 Quick fix: Disable RLS temporarily with: ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;');
        return false;
      }

      // Test payments table (optional since it's empty)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .limit(1);

      if (paymentsError) {
        console.log('⚠️ Payments table error (expected since table is empty):', paymentsError.message);
      }

      if (expensesError) {
        console.error('❌ Expenses table error:', expensesError);
        console.log('💡 Error details:', {
          message: expensesError.message,
          details: expensesError.details,
          hint: expensesError.hint,
          code: expensesError.code
        });
        console.log('💡 The query that failed: SELECT id, description, amount_aed, date_paid, department FROM expenses LIMIT 1');
        console.log('💡 Fix: Run quick_fix_expenses_400.sql in your Supabase SQL editor');
        console.log('💡 Common causes:');
        console.log('   - Table does not exist');
        console.log('   - Missing columns: id, title, amount, payment_date, department');
        console.log('   - RLS (Row Level Security) blocking access');
        console.log('   - Wrong data types');
        console.log('💡 Quick fix: Disable RLS temporarily with: ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;');
        return false;
      }

      console.log('✅ Database access successful!');
      console.log('Payments sample:', paymentsData);
      console.log('Expenses sample:', expensesData);
      
      return true;
    } catch (err) {
      console.error('❌ Database test failed:', err);
      return false;
    }
  };

  // Test database and enable real data if accessible
  useEffect(() => {
    const checkDatabase = async () => {
      console.log('🔍 Starting database check...');
      const isAccessible = await enableRealData();
      
      if (isAccessible) {
        console.log('✅ Database accessible - fetching real data...');
        fetchRealData();
      } else {
        console.log('❌ Database not accessible - loading fallback data...');
        console.log('📋 This ensures your dashboard always works');
        console.log('📋 To fix: Run fix_your_supabase_tables.sql in Supabase SQL editor');
        
        // Load fallback data immediately
        const fallbackExpenses = [
          {
            id: '1',
            title: 'Office Supplies',
            amount_aed: 150.00,
            date_paid: '2025-01-15',
            department: 'IT',
            service_name: 'Office Supplies',
            vendor: 'OfficeMax',
            description: 'Monthly office supplies',
            status: 'paid'
          },
          {
            id: '2',
            title: 'Cloud Storage',
            amount_aed: 300.00,
            date_paid: '2025-01-20',
            department: 'IT',
            service_name: 'Cloud Services',
            vendor: 'AWS',
            description: 'Monthly cloud storage',
            status: 'paid'
          },
          {
            id: '3',
            title: 'Software License',
            amount_aed: 500.00,
            date_paid: '2025-01-25',
            department: 'IT',
            service_name: 'Software License',
            vendor: 'Microsoft',
            description: 'Office365 license',
            status: 'paid'
          },
          {
            id: '4',
            title: 'Internet Service',
            amount_aed: 200.00,
            date_paid: '2025-02-01',
            department: 'IT',
            service_name: 'Internet',
            vendor: 'Etisalat',
            description: 'Monthly internet service',
            status: 'paid'
          },
          {
            id: '5',
            title: 'Office Furniture',
            amount_aed: 800.00,
            date_paid: '2025-02-05',
            department: 'HR',
            service_name: 'Furniture',
            vendor: 'IKEA',
            description: 'New office chairs',
            status: 'paid'
          }
        ];
        
        const fallbackPayments = [
          {
            id: '1',
            title: 'AWS Renewal',
            amount: 2500.00,
            payment_date: '2025-01-25',
            due_date: '2025-01-25',
            status: 'paid',
            description: 'Annual AWS infrastructure renewal'
          },
          {
            id: '2',
            title: 'Office365 License',
            amount: 1200.00,
            payment_date: '2025-02-22',
            due_date: '2025-02-22',
            status: 'paid',
            description: 'Monthly Office365 license renewal'
          },
          {
            id: '3',
            title: 'Atlassian Subscription',
            amount: 800.00,
            payment_date: '2025-02-28',
            due_date: '2025-02-28',
            status: 'paid',
            description: 'Quarterly Atlassian tools subscription'
          },
          {
            id: '4',
            title: 'Ziwo CRM Payment',
            amount: 600.00,
            payment_date: '2025-03-30',
            due_date: '2025-03-30',
            status: 'pending',
            description: 'Monthly Ziwo CRM service payment'
          }
        ];
        
        setExpenses(fallbackExpenses);
        setPayments(fallbackPayments);
        
        // Calculate totals from fallback data
        const currentMonth = moment().month();
        const currentYear = moment().year();
        
        const totalCurrent = fallbackPayments
          .filter(p => {
            const date = moment(p.payment_date);
            return date.month() === currentMonth && date.year() === currentYear;
          })
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        
        setTotalThisMonth(totalCurrent);
        setEstimatedNextMonth(1200);
        setDataSource('fallback');
        
        console.log('✅ Fallback data loaded successfully!');
        console.log('📊 You should now see real amounts instead of zeros');
      }
    };

    checkDatabase();
  }, []);

  // Function to fetch real data
  const fetchRealData = async () => {
    try {
      console.log('🔄 Starting to fetch real data...');
      
      // Fetch real payments - using * to get all columns (table might be empty)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('❌ Payments fetch error:', paymentsError);
      } else {
        console.log('✅ Payments loaded:', paymentsData?.length || 0, 'records');
        console.log('📊 Sample payment data:', paymentsData?.slice(0, 2));
        
        // Normalize payments data to match your database structure
        const normalizedPayments = (paymentsData || []).map(payment => {
          console.log('🔍 Raw payment record:', payment);
          
          const normalized = {
            ...payment,
            // Map to your actual column names
            amount: payment.amount || payment.amount_aed || 0,
            payment_date: payment.payment_date || payment.due_date || payment.date,
            due_date: payment.due_date || payment.payment_date || payment.date,
            title: payment.title || payment.description || 'Payment',
            status: payment.status || 'pending',
            department: payment.department || 'General'
          };
          
          console.log('✅ Normalized payment record:', normalized);
          return normalized;
        });
        
        setPayments(normalizedPayments);
        
        // Calculate totals using normalized data
        const currentMonth = moment().month();
        const currentYear = moment().year();
        const nextMonth = moment().add(1, 'months').month();
        const nextMonthYear = moment().add(1, 'months').year();

        const totalCurrent = normalizedPayments
          .filter(p => {
            const date = moment(p.payment_date);
            return date.month() === currentMonth && date.year() === currentYear;
          })
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
   
        const totalNext = normalizedPayments
          .filter(p => {
            const date = moment(p.payment_date);
            return date.month() === nextMonth && date.year() === nextMonthYear;
          })
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        setTotalThisMonth(totalCurrent);
        setEstimatedNextMonth(totalNext);
      }

      // Fetch real expenses - using your exact column names
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('id, service_name, amount_aed, date_paid, department, service_status, currency, months, created_at')
        .order('date_paid', { ascending: true });

      if (expensesError) {
        console.error('❌ Expenses fetch error:', expensesError);
      } else {
        console.log('✅ Expenses loaded:', expensesData?.length || 0, 'records');
        console.log('📊 Sample expense data:', expensesData?.slice(0, 2));
        console.log('🔍 REAL DATA CHECK - First 3 records from Supabase:');
        console.log(expensesData?.slice(0, 3));
        console.log('🔍 REAL DATA CHECK - Total records:', expensesData?.length);
        console.log('🔍 REAL DATA CHECK - Data source: Supabase Database');
        
        // Normalize the data to match your actual database structure
        const normalizedExpenses = (expensesData || []).map(expense => {
          console.log('🔍 Raw expense record:', expense);
          
          const normalized = {
            ...expense,
            // Use your exact column names
            amount_aed: expense.amount_aed || 0,
            date_paid: expense.date_paid || expense.created_at,
            department: expense.department || 'Unassigned',
            service_name: expense.service_name || 'Unknown',
            title: expense.service_name || 'Expense', // Use service_name as title
            vendor: expense.service_name || 'Unknown', // Use service_name as vendor
            status: expense.service_status || 'active',
            // Add calculated fields for charts
            category: expense.service_name, // For departmental expenses chart
            description: expense.service_name // For display purposes
          };
          
          console.log('✅ Normalized expense record:', normalized);
          return normalized;
        });
        
        setExpenses(normalizedExpenses);
        console.log('✅ Expenses normalized and set');
      }

      setDataSource('database');
      console.log('✅ Real data loading completed!');
    } catch (err) {
      console.error('❌ Error loading real data:', err);
      console.log('💡 Adding fallback sample data for testing...');
      
      // Add fallback sample data if database is not accessible
      const fallbackExpenses = [
        {
          id: '1',
          title: 'Office Supplies',
          amount_aed: 150.00,
          date_paid: '2025-01-15',
          department: 'IT',
          service_name: 'Office Supplies',
          vendor: 'OfficeMax',
          description: 'Monthly office supplies',
          status: 'paid'
        },
        {
          id: '2',
          title: 'Cloud Storage',
          amount_aed: 300.00,
          date_paid: '2025-01-20',
          department: 'IT',
          service_name: 'Cloud Services',
          vendor: 'AWS',
          description: 'Monthly cloud storage',
          status: 'paid'
        },
        {
          id: '3',
          title: 'Software License',
          amount_aed: 500.00,
          date_paid: '2025-01-25',
          department: 'IT',
          service_name: 'Software License',
          vendor: 'Microsoft',
          description: 'Office365 license',
          status: 'paid'
        },
        {
          id: '4',
          title: 'Internet Service',
          amount_aed: 200.00,
          date_paid: '2025-02-01',
          department: 'IT',
          service_name: 'Internet',
          vendor: 'Etisalat',
          description: 'Monthly internet service',
          status: 'paid'
        },
        {
          id: '5',
          title: 'Office Furniture',
          amount_aed: 800.00,
          date_paid: '2025-02-05',
          department: 'HR',
          service_name: 'Furniture',
          vendor: 'IKEA',
          description: 'New office chairs',
          status: 'paid'
        }
      ];
      
      const fallbackPayments = [
        {
          id: '1',
          title: 'AWS Renewal',
          amount: 2500.00,
          payment_date: '2025-01-25',
          due_date: '2025-01-25',
          status: 'paid',
          description: 'Annual AWS infrastructure renewal'
        },
        {
          id: '2',
          title: 'Office365 License',
          amount: 1200.00,
          payment_date: '2025-02-22',
          due_date: '2025-02-22',
          status: 'paid',
          description: 'Monthly Office365 license renewal'
        },
        {
          id: '3',
          title: 'Atlassian Subscription',
          amount: 800.00,
          payment_date: '2025-02-28',
          due_date: '2025-02-28',
          status: 'paid',
          description: 'Quarterly Atlassian tools subscription'
        },
        {
          id: '4',
          title: 'Ziwo CRM Payment',
          amount: 600.00,
          payment_date: '2025-03-30',
          due_date: '2025-03-30',
          status: 'pending',
          description: 'Monthly Ziwo CRM service payment'
        }
      ];
      
      setExpenses(fallbackExpenses);
      setPayments(fallbackPayments);
      
      // Calculate totals from fallback data
      const currentMonth = moment().month();
      const currentYear = moment().year();
      
      const totalCurrent = fallbackPayments
        .filter(p => {
          const date = moment(p.payment_date);
          return date.month() === currentMonth && date.year() === currentYear;
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      
      setTotalThisMonth(totalCurrent);
      setEstimatedNextMonth(1200); // Sample estimate
      
      setDataSource('fallback');
      console.log('✅ Fallback data loaded successfully!');
    }
  };

  return (
    <>
      <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #ffffffff 0%, #fdfeffff 100%)" }}>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 p-10">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <img src="/Udrivehub.png" alt="Udrivehub Logo" className="h-10 w-auto" />
                <h1 className="text-4xl font-bold tracking-tight">Dashboard Overview</h1>
                {dataSource === 'loading' && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    Loading Data...
                  </div>
                )}
                {dataSource === 'database' && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Live Data
                  </div>
                )}
                {dataSource === 'fallback' && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Sample Data
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <DarkModeToggle />
                <UserDropdown />
              </div>
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
              <AnimatedCard className="w-full md:w-[380px] flex flex-col">
                <div className="mb-4">
                  <SectionHeader icon={<CalendarIcon />} title="Payment Calendar" />
                  <div className="text-sm text-gray-600 mb-2">
                    Track upcoming payments and events
                  </div>
                </div>
                
                {/* Calendar Summary Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                    <div className="text-xs text-blue-600 font-medium">This Month</div>
                    <div className="text-lg font-bold text-blue-800">
                      {payments.filter(p => {
                        const dueDate = new Date(p.due_date);
                        const now = new Date();
                        return dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
                      }).length}
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                    <div className="text-xs text-green-600 font-medium">Next 7 Days</div>
                    <div className="text-lg font-bold text-green-800">
                      {payments.filter(p => {
                        const dueDate = new Date(p.due_date);
                        const now = new Date();
                        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                        return dueDate >= now && dueDate <= nextWeek;
                      }).length}
                    </div>
                  </div>
                </div>

                {/* Enhanced Calendar */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <Calendar
                    onChange={setCalendarDate}
                    value={calendarDate}
                    onClickDay={handleDayClick}
                    tileContent={getCalendarTileContent}
                    className="w-full"
                    tileClassName={({ date, view }) => {
                      if (view !== 'month') return '';
                      
                      const events = payments.filter((p) => {
                        const dueDate = new Date(p.due_date);
                        return dueDate.toDateString() === date.toDateString();
                      });
                      
                      if (events.length === 0) return '';
                      
                      const hasUrgent = events.some(e => e.status === 'overdue');
                      const hasUpcoming = events.some(e => e.status === 'pending');
                      
                      if (hasUrgent) return 'bg-red-50 border-red-200';
                      if (hasUpcoming) return 'bg-blue-50 border-blue-200';
                      return 'bg-green-50 border-green-200';
                    }}
                  />
                </div>

                {/* Quick Actions */}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    View All Events
                  </button>
                  <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                    Add New Payment
                  </button>
                </div>
              </AnimatedCard>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-8 mb-12 ">
              <AnimatedCard className="lg:col-span-2">
                <SectionHeader icon={<MoneyIcon />} title="Today's Spending Overview" />
                <TodaySpendingChart />
              </AnimatedCard>
              <AnimatedCard className="lg:col-span-2">
                <SectionHeader icon={<BarChartIcon />} title="Interactive Monthly Expenses" />
                <InteractiveExpenseChart />
              </AnimatedCard>
              <AnimatedCard className="lg:col-span-2">
                <SectionHeader icon={<BarChartIcon />} title="Departmental Expenses" />
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={departmentChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `AED ${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip 
                      formatter={(value) => [`AED ${Number(value).toFixed(2)}`, 'Amount']}
                      labelFormatter={(label) => `Department: ${label}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </AnimatedCard>
            </div>
            {/* Expense Data Table with View Toggle */}
            <AnimatedCard className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader icon={<BarChartIcon />} title="Detailed Expense Data" />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowScrollableTable(true)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      showScrollableTable 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Scrollable View
                  </button>
                  <button
                    onClick={() => setShowScrollableTable(false)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      !showScrollableTable 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Paginated View
                  </button>
                </div>
              </div>
              
              {showScrollableTable ? (
                <ScrollableExpenseTable data={filteredExpenses} />
              ) : (
                <PaginatedTable 
                  data={filteredExpenses}
                  columns={[
                    { key: 'title', label: 'Title' },
                    { key: 'amount_aed', label: 'Amount (AED)', render: (value) => `AED ${Number(value).toFixed(2)}` },
                    { key: 'date_paid', label: 'Date', render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
                    { key: 'department', label: 'Department' },
                    { key: 'service_name', label: 'Service' },
                    { 
                      key: 'status', 
                      label: 'Status', 
                      render: (value) => (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          value === 'paid' ? 'bg-green-100 text-green-800' :
                          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {value || 'N/A'}
                        </span>
                      )
                    }
                  ]}
                  itemsPerPage={10}
                />
              )}
            </AnimatedCard>

          
            {/* Upcoming Events CalendarView (optional, can be removed if not needed) */}
            <AnimatedCard className="mb-12">
              <SectionHeader icon={<CalendarIcon />} title="Upcoming Events" />
              <UpcomingPaymentEvents />
            </AnimatedCard>
{/* Yearly Breakdown Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <AnimatedCard className="flex-1">
                <div className="flex justify-between items-center mb-4">
                  <SectionHeader icon={<BarChartIcon />} title="Yearly Departmental Expense" />
                  <button
                    onClick={() => setShowDepartmentBreakdown((v) => !v)}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    aria-label="Toggle Department Breakdown"
                  >
                    <span>{showDepartmentBreakdown ? "Hide Details" : "Show Details"}</span>
                    <span className="text-xs">{showDepartmentBreakdown ? "▼" : "▶"}</span>
                  </button>
                </div>

                {/* Department Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium">Total Departments</div>
                    <div className="text-lg font-bold text-blue-800">
                      {Object.keys(departmentData).length}
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-600 font-medium">Total Years</div>
                    <div className="text-lg font-bold text-purple-800">
                      {Object.keys(departmentYearlyData).length}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {showDepartmentBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 max-h-80 overflow-y-auto">
                        <h4 className="text-md font-semibold mb-3 text-gray-800 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Department Breakdown by Year
                        </h4>
                        {Object.entries(departmentYearlyData)
                          .sort(([a], [b]) => b.localeCompare(a)) // Sort years descending
                          .map(([year, departments]) => (
                            <div key={year} className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                              <h5 className="text-md font-semibold mb-2 text-blue-700 flex items-center gap-2">
                                <span className="text-lg">📅</span>
                                Year: {year}
                              </h5>
                              <div className="space-y-2">
                                {Object.entries(departments)
                                  .sort(([, a], [, b]) => b - a) // Sort by amount descending
                                  .map(([dept, total]) => (
                                    <div key={dept} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100">
                                      <span className="font-medium text-gray-700 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                        {dept}
                                      </span>
                                      <span className="font-bold text-blue-600">AED {total.toFixed(2)}</span>
                                    </div>
                                  ))}
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">Year Total:</span>
                                  <span className="font-bold text-blue-800">
                                    AED {Object.values(departments).reduce((sum, amount) => sum + amount, 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </AnimatedCard>
              <AnimatedCard className="flex-1">
                <div className="flex justify-between items-center mb-4">
                  <SectionHeader icon={<PieChartIcon />} title="Year-wise Expense Overview" />
                  <button
                    onClick={() => setShowYearlyBreakdown((v) => !v)}
                    className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    aria-label="Toggle Yearly Breakdown"
                  >
                    <span>{showYearlyBreakdown ? "Hide Details" : "Show Details"}</span>
                    <span className="text-xs">{showYearlyBreakdown ? "▼" : "▶"}</span>
                  </button>
                </div>
                
                {/* Yearly Chart */}
                <div className="mb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={yearlyBreakdown} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `AED ${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        formatter={(value) => [`AED ${Number(value).toFixed(2)}`, 'Amount']}
                        labelFormatter={(label) => `Year: ${label}`}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="total" 
                        fill="#10b981" 
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Yearly Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600 font-medium">Total Years</div>
                    <div className="text-lg font-bold text-green-800">{yearlyBreakdown.length}</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium">Total Amount</div>
                    <div className="text-lg font-bold text-blue-800">
                      AED {yearlyBreakdown.reduce((sum, year) => sum + Number(year.total), 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <AnimatePresence>
                  {showYearlyBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                        <h4 className="text-md font-semibold mb-3 text-gray-800 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Detailed Yearly Breakdown
                        </h4>
                        <div className="space-y-3">
                          {yearlyBreakdown.map((year) => (
                            <div key={year.year} className="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                              <span className="font-medium text-gray-700">{year.year}</span>
                              <span className="font-bold text-green-600">AED {Number(year.total).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </AnimatedCard>
            </div>
          
          </main>
        </div>
      </div>

              {/* Summary Cards - Properly Aligned */}
        <div className="px-10 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <MoneyIcon />
            Financial Overview
          </h2>
          
          {/* First Row - 4 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <AnimatedCard>
              <SummaryCard 
                icon={<MoneyIcon />} 
                title="Total Expenses" 
                value={`AED ${totalExpense.toFixed(2)}`} 
                color="border-green-500" 
                subtitle={`${filteredExpenses.length} records`}
              />
            </AnimatedCard>
            <AnimatedCard>
              <SummaryCard 
                icon={<BarChartIcon />} 
                title="This Month" 
                value={`AED ${actualThisMonth.toFixed(2)}`} 
                color="border-blue-500" 
                subtitle={isOverBudget ? "Over budget" : "Under budget"}
              />
            </AnimatedCard>
            <AnimatedCard>
              <SummaryCard 
                icon={<PieChartIcon />} 
                title="Next Month Estimate" 
                value={`AED ${estimatedCost.toFixed(2)}`} 
                color="border-orange-500" 
                subtitle="Based on 3-month average"
              />
            </AnimatedCard>
            <AnimatedCard>
              <SummaryCard 
                icon={<CalendarIcon />} 
                title="Actual Cost" 
                value={`AED ${actualCost.toFixed(2)}`} 
                color="border-purple-500" 
                subtitle="Current month payments"
              />
            </AnimatedCard>
          </div>
          
          {/* Second Row - 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <AnimatedCard>
              <SummaryCard 
                icon={<LineChartIcon />} 
                title="Cost Difference" 
                value={`AED ${costDifference.toFixed(2)}`} 
                color={isOverBudget ? "border-red-500" : "border-green-500"} 
                subtitle={isOverBudget ? "Over budget" : "Under budget"}
              />
            </AnimatedCard>
            <AnimatedCard>
              <SummaryCard 
                icon={<CalendarIcon />} 
                title="Upcoming Events" 
                value={calendarEvents.filter(e => e.status === 'upcoming').length} 
                color="border-blue-500" 
                subtitle="This month"
              />
            </AnimatedCard>
            <AnimatedCard>
              <SummaryCard 
                icon={<MoneyIcon />} 
                title="Pending Payments" 
                value={calendarEvents.filter(e => e.status === 'pending').length} 
                color="border-yellow-500" 
                subtitle="Requires attention"
              />
            </AnimatedCard>
          </div>
          
          {/* Third Row - 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <AnimatedCard>
              <SummaryCard 
                icon={<BarChartIcon />} 
                title="Total This Month" 
                value={`AED ${totalThisMonth.toFixed(2)}`} 
                color="border-green-500" 
                subtitle="All payments"
              />
            </AnimatedCard>
            <AnimatedCard>
              <SummaryCard 
                icon={<MoneyIcon />} 
                title="Next Month Estimate" 
                value={`AED ${estimatedNextMonth.toFixed(2)}`} 
                color="border-orange-500" 
                subtitle="Projected"
              />
            </AnimatedCard>
            <AnimatedCard>
              <SummaryCard 
                icon={<BarChartIcon />} 
                title="Departments" 
                value={departments.length - 1} 
                color="border-indigo-500" 
                subtitle="Active departments"
              />
            </AnimatedCard>
            <AnimatedCard>
              <SummaryCard 
                icon={<CalendarIcon />} 
                title="Years Tracked" 
                value={years.length - 1} 
                color="border-teal-500" 
                subtitle="Data coverage"
              />
            </AnimatedCard>
          </div>
        </div>

      {/* Enhanced Event Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Events on {format(calendarDate, 'PPP')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon />
                <p className="text-gray-500 mt-2">No events scheduled for this date.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateEvents.map((event, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-800">{event.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                            event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            event.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                        
                        {event.description && (
                          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MoneyIcon />
                            AED {event.amount?.toFixed(2) || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon />
                            {event.type === 'payment' ? 'Payment' : 'Calendar Event'}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(event.status)}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}


