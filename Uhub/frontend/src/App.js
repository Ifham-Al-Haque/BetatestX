// src/App.js
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext';
import RouteSkeleton from './components/ui/RouteSkeleton';
import ProtectedRoute from './components/ProtectedRoute';
import PayrollProtectedRoute from './components/PayrollProtectedRoute';
import Layout from './components/Layout';
import SmartHomeRoute from './components/SmartHomeRoute';
import RoutePrefetcher from './components/RoutePrefetcher';
import RouteVisitTracker from './components/RouteVisitTracker';
import EditionGuard from './components/EditionGuard';
import PushIdentity from './components/PushIdentity';
const isDev = process.env.NODE_ENV === 'development';

// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes - cache data for 10 minutes
      retry: (failureCount, error) => {
        if (error?.status >= 400 && error?.status < 500) { return false; }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // Don't refetch on every mount - only if data is stale
      refetchOnReconnect: true, // Only refetch on reconnect
      networkMode: 'online',
    },
    mutations: {
      retry: false,
    },
  },
});

// Safe lazy: ensure default export exists to avoid "Lazy element type must resolve to a class or function"
function safeLazy(importFn, name) {
  return React.lazy(async () => {
    const mod = await importFn();
    const Component = mod?.default;
    if (typeof Component !== 'function' && !(Component?.$$typeof)) {
      console.error(`[safeLazy] Module "${name}" has no valid default export:`, mod);
      return { default: () => <div className="p-8 text-red-600">Page failed to load ({name}). Check console.</div> };
    }
    return { default: Component };
  });
}

// Lazy load components for better performance
const Welcome = safeLazy(() => import('./pages/Welcome'), 'Welcome');
const Login = safeLazy(() => import('./pages/Login'), 'Login');
const ResetPassword = safeLazy(() => import('./pages/ResetPassword'), 'ResetPassword');
const Dashboard = safeLazy(() => import('./pages/Dashboard'), 'Dashboard');
const AdminDashboard = safeLazy(() => import('./pages/AdminDashboard'), 'AdminDashboard');
const UserManagement = safeLazy(() => import('./pages/UserManagement'), 'UserManagement');
const Employees = safeLazy(() => import('./pages/Employees'), 'Employees');
const EmployeeHistory = safeLazy(() => import('./pages/EmployeeHistory'), 'EmployeeHistory');
const EmployeeProfile = safeLazy(() => import('./pages/EmployeeProfile'), 'EmployeeProfile');
const EmployeeForm = safeLazy(() => import('./pages/EmployeeForm'), 'EmployeeForm');
const EmployeeOnboarding = safeLazy(() => import('./pages/EmployeeOnboarding'), 'EmployeeOnboarding');
const EmployeeOffboarding = safeLazy(() => import('./pages/EmployeeOffboarding'), 'EmployeeOffboarding');
const Drivers = safeLazy(() => import('./pages/Driver'), 'Driver');
const DriverForm = safeLazy(() => import('./pages/DriverForm'), 'DriverForm');
const DriverProfile = safeLazy(() => import('./pages/DriverProfile'), 'DriverProfile');
const Assets = safeLazy(() => import('./pages/Assets'), 'Assets');
const AssetProfile = safeLazy(() => import('./pages/AssetProfile'), 'AssetProfile');
const AssetEdit = safeLazy(() => import('./pages/AssetEdit'), 'AssetEdit');
const ITAssets = safeLazy(() => import('./pages/ITAssets'), 'ITAssets');
const ITRequests = safeLazy(() => import('./pages/ITRequestsEnhanced'), 'ITRequests');
const ITServicesHome = safeLazy(() => import('./pages/ITServicesHome'), 'ITServicesHome');
const RequestInbox = safeLazy(() => import('./pages/RequestInbox'), 'RequestInbox');
const CSPA = safeLazy(() => import('./pages/CSPA'), 'CSPA');
const Complaints = safeLazy(() => import('./pages/Complaints'), 'Complaints');
const Attendance = safeLazy(() => import('./pages/Attendance'), 'Attendance');
const CalendarView = safeLazy(() => import('./pages/CalendarView'), 'CalendarView');
const Analytics = safeLazy(() => import('./pages/Analytics'), 'Analytics');
const FleetManagement = safeLazy(() => import('./pages/FleetManagement'), 'FleetManagement');
const FleetDashboard = safeLazy(() => import('./pages/FleetDashboard'), 'FleetDashboard');
const DeliveryManagement = safeLazy(() => import('./pages/DeliveryManagement'), 'DeliveryManagement');
const DeliveryTracking = safeLazy(() => import('./pages/DeliveryTracking'), 'DeliveryTracking');
const DeliveryRoutes = safeLazy(() => import('./pages/DeliveryRoutes'), 'DeliveryRoutes');
const UserProfile = safeLazy(() => import('./pages/UserProfile'), 'UserProfile');
const Suggestions = safeLazy(() => import('./pages/Suggestions'), 'Suggestions');
const SuggestionsInbox = safeLazy(() => import('./pages/SuggestionsInbox'), 'SuggestionsInbox');
const TaskManagement = safeLazy(() => import('./pages/TaskManagement'), 'TaskManagement');
const TaskReports = safeLazy(() => import('./pages/TaskReports'), 'TaskReports');
const ExpenseTracker = safeLazy(() => import('./pages/ExpenseTracker'), 'ExpenseTracker');
const PaymentCalendar = safeLazy(() => import('./pages/PaymentCalendar'), 'PaymentCalendar');
const Chat = safeLazy(() => import('./pages/Chat'), 'Chat');
const ComplaintsInbox = safeLazy(() => import('./pages/ComplaintsInbox'), 'ComplaintsInbox');
const Simcard = safeLazy(() => import('./pages/Simcard'), 'Simcard');
const SimcardProfile = safeLazy(() => import('./pages/SimcardProfile'), 'SimcardProfile');
const Events = safeLazy(() => import('./pages/Events'), 'Events');
const Memories = safeLazy(() => import('./pages/Memories'), 'Memories');
const EventPictureUpload = safeLazy(() => import('./pages/EventPictureUpload'), 'EventPictureUpload');
const UserWelcome = safeLazy(() => import('./pages/UserWelcome'), 'UserWelcome');
const SubscribeNow = safeLazy(() => import('./pages/SubscribeNow'), 'SubscribeNow');
const Collections = safeLazy(() => import('./pages/Collections'), 'Collections');
const FleetOffboarding = safeLazy(() => import('./pages/FleetOffboarding'), 'FleetOffboarding');
const FleetDeliveryChecklist = safeLazy(() => import('./pages/FleetDeliveryChecklist'), 'FleetDeliveryChecklist');
const FleetMaintenanceRecord = safeLazy(() => import('./pages/FleetMaintenanceRecord'), 'FleetMaintenanceRecord');
const FleetDriverCalendar = safeLazy(() => import('./pages/FleetDriverCalendar'), 'FleetDriverCalendar');
const MarketingCalendar = safeLazy(() => import('./pages/MarketingCalendar'), 'MarketingCalendar');
const OrganizationalHierarchy = safeLazy(() => import('./pages/OrganizationalHierarchy'), 'OrganizationalHierarchy');
const IOTRecord = safeLazy(() => import('./pages/IOTRecord'), 'IOTRecord');
const ITTools = safeLazy(() => import('./pages/ITTools'), 'ITTools');
const PayrollCalculator = safeLazy(() => import('./pages/PayrollCalculator'), 'PayrollCalculator');
const Payroll = safeLazy(() => import('./pages/Payroll'), 'Payroll');
const UpcomingPaymentEvents = safeLazy(() => import('./pages/UpcomingPaymentEvents'), 'UpcomingPaymentEvents');
const Voucher = safeLazy(() => import('./pages/Voucher'), 'Voucher');
const OperationHome = safeLazy(() => import('./pages/operation/OperationHome'), 'OperationHome');
const OperationTeams = safeLazy(() => import('./pages/operation/OperationTeams'), 'OperationTeams');
const FleetLifecycle = safeLazy(() => import('./pages/operation/FleetLifecycle'), 'FleetLifecycle');
const UDriveFleetio = safeLazy(() => import('./pages/operation/UDriveFleetio'), 'UDriveFleetio');
const OperationRoster = safeLazy(() => import('./pages/operation/OperationRoster'), 'OperationRoster');
const FleetRecordProfile = safeLazy(() => import('./pages/operation/FleetRecordProfile'), 'FleetRecordProfile');
const BreakdownsPage = safeLazy(() => import('./pages/Breakdowns'), 'BreakdownsPage');
const FleetPmSchedules = safeLazy(() => import('./pages/operation/FleetPmSchedules'), 'FleetPmSchedules');
const OperationTeamAllocation = safeLazy(() => import('./pages/operation/OperationTeamAllocation'), 'OperationTeamAllocation');

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ChatProvider>
            <NotificationProvider>
              <SidebarProvider>
                <ThemeProvider>
                  <Router>
                    <RoutePrefetcher />
                    <RouteVisitTracker />
                    <EditionGuard />
                    <PushIdentity />
                    <Suspense fallback={<RouteSkeleton title="Loading route and preparing data..." />}>
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/welcome" element={<Welcome />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        
                        {/* Smart Home Route - Redirects based on auth status */}
                        <Route path="/" element={<SmartHomeRoute />} />

                        {/* Protected Routes - Role-based landing pages */}
                        <Route path="/dashboard" element={
                          <ProtectedRoute requiredFeature="dashboard">
                            <Layout>
                              <Dashboard />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Admin Routes */}
                        <Route path="/admin/*" element={
                          <ProtectedRoute requiredRole="admin">
                            <Layout pageTitle="Admin Dashboard" pageDescription="User activity monitoring and system administration">
                              <Routes>
                                <Route path="dashboard" element={<AdminDashboard />} />
                                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                              </Routes>
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Role-specific landing pages */}
                        <Route path="/cspa" element={
                          <ProtectedRoute requiredFeature="cspa">
                            <Layout>
                              <CSPA />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/drivers" element={
                          <ProtectedRoute requiredFeature="driver_records">
                            <Layout>
                              <Drivers />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Driver Form Routes - Order matters! More specific routes first */}
                        <Route path="/driver/new" element={
                          <ProtectedRoute requiredFeature="driver_records">
                            <Layout>
                              <DriverForm />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/driver/:id/edit" element={
                          <ProtectedRoute requiredFeature="driver_records">
                            <Layout>
                              <DriverForm />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/driver/:id" element={
                          <ProtectedRoute requiredFeature="driver_records">
                            <Layout>
                              <DriverProfile />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/attendance" element={
                          <ProtectedRoute requiredFeature="attendance">
                            <Layout>
                              <Attendance />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/tasks" element={
                          <ProtectedRoute requiredFeature="my_tasks">
                            <Navigate to="/task-management?tab=my-tasks" replace />
                          </ProtectedRoute>
                        } />

                        {/* Other protected routes */}
                        <Route path="/user-management" element={
                          <ProtectedRoute requiredFeature="user_management">
                            <Layout pageTitle="User Management" pageDescription="Manage system users and their permissions">
                              <UserManagement />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/employees" element={
                          <ProtectedRoute requiredFeatures={['employees', 'employee_records']}>
                            <Layout>
                              <Employees />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        {/* Employee Profile Route */}
                        <Route path="/employee/:id" element={
                          <ProtectedRoute requiredFeatures={['employees', 'employee_records']}>
                            <Layout>
                              <EmployeeProfile />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        {/* Employee Create Route */}
                        <Route path="/employee-form" element={
                          <ProtectedRoute requiredFeature="employees">
                            <Layout>
                              <EmployeeForm />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        {/* Employee Edit Route */}
                        <Route path="/employee/:id/edit" element={
                          <ProtectedRoute requiredFeature="employees">
                            <Layout>
                              <EmployeeForm />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Employee Onboarding Routes */}
                        <Route path="/employee-onboarding" element={
                          <ProtectedRoute requiredFeature="employee_onboarding">
                            <Layout>
                              <EmployeeOnboarding />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Employee Offboarding Routes */}
                        <Route path="/employee-offboarding" element={
                          <ProtectedRoute requiredFeature="employee_offboarding">
                            <Layout>
                              <EmployeeOffboarding />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Employee History Route */}
                        <Route path="/employee-history" element={
                          <ProtectedRoute requiredFeature="employees">
                            <Layout>
                              <EmployeeHistory />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Payroll (merged: records + calculator + batch history) */}
                        <Route path="/payroll-calculator" element={
                          <PayrollProtectedRoute>
                            <Layout>
                              <PayrollCalculator />
                            </Layout>
                          </PayrollProtectedRoute>
                        } />
                        <Route path="/payroll" element={
                          <PayrollProtectedRoute>
                            <Layout>
                              <Payroll />
                            </Layout>
                          </PayrollProtectedRoute>
                        } />

                        {/* Slice of Life Routes */}
                        <Route path="/events" element={
                          <ProtectedRoute requiredFeature="events">
                            <Layout>
                              <Events />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/memories" element={
                          <ProtectedRoute requiredFeature="memories">
                            <Layout>
                              <Memories />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/event-picture-upload" element={
                          <ProtectedRoute requiredFeature="events">
                            <Layout>
                              <EventPictureUpload />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/assets/:id" element={
                          <ProtectedRoute requiredFeature="assets">
                            <Layout>
                              <AssetProfile />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/assets/:id/edit" element={
                          <ProtectedRoute requiredFeature="assets">
                            <Layout>
                              <AssetEdit />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/assets" element={
                          <ProtectedRoute requiredFeature="assets">
                            <Layout>
                              <Assets />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/it-assets" element={
                          <ProtectedRoute requiredFeature="it_assets">
                            <Layout>
                              <ITAssets />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/it-services" element={
                          <ProtectedRoute requiredFeature="it_requests">
                            <Layout>
                              <ITServicesHome />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/it-requests" element={
                          <ProtectedRoute requiredFeature="it_requests">
                            <Layout>
                              <ITRequests />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/request-inbox" element={
                          <ProtectedRoute requiredFeature="request_inbox">
                            <Layout>
                              <RequestInbox />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/it-tools" element={
                          <ProtectedRoute requiredFeature="it_tools">
                            <Layout>
                              <ITTools />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/complaints" element={
                          <ProtectedRoute requiredFeature="complaints">
                            <Layout>
                              <Complaints />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/analytics" element={
                          <ProtectedRoute requiredFeature="analytics">
                            <Layout>
                              <Analytics />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/fleet" element={<Navigate to="/operation/fleet-records" replace />} />
                        <Route path="/fleet-dashboard" element={<Navigate to="/operation/fleetio/dashboard" replace />} />

                        <Route path="/fleet-onboarding" element={
                          <Navigate to="/operation/fleet-lifecycle" replace />
                        } />

                        <Route path="/fleet-offboarding" element={
                          <Navigate to="/operation/fleet-lifecycle?tab=offboarding" replace />
                        } />

                        <Route path="/fleet-maintenance-record" element={
                          <Navigate to="/operation/fleetio/maintenance" replace />
                        } />

                        <Route path="/fleet-delivery-checklist" element={
                          <Navigate to="/operation/fleetio/inspections" replace />
                        } />

                        <Route path="/fleet-driver-calendar" element={
                          <Navigate to="/operation/fleetio/assignments" replace />
                        } />

                        {/* Legacy fleet pages removed — use /operation/* routes above */}

                        {/* Delivery Management Routes */}
                        <Route path="/delivery-management" element={
                          <ProtectedRoute requiredFeature="delivery_management">
                            <Layout>
                              <DeliveryManagement />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/delivery-tracking" element={
                          <ProtectedRoute requiredFeature="delivery_tracking">
                            <Layout>
                              <DeliveryTracking />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/delivery-routes" element={
                          <ProtectedRoute requiredFeature="delivery_routes">
                            <Layout>
                              <DeliveryRoutes />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <Layout>
                              <UserProfile />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/settings" element={
                          <Navigate to="/profile?tab=preferences" replace />
                        } />

                        {/* Additional routes referenced in sidebar */}
                        <Route path="/calendar-view" element={
                          <ProtectedRoute requiredFeature="calendar_view">
                            <Layout>
                              <CalendarView />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Organizational Hierarchy */}
                        <Route path="/organizational-hierarchy" element={
                          <ProtectedRoute requiredFeature="organizational_hierarchy">
                            <Layout>
                              <OrganizationalHierarchy />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Team Chat */}
                        <Route path="/chat" element={
                          <ProtectedRoute requiredFeature="communication">
                            <Layout>
                              <Chat />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Complaints Inbox */}
                        <Route path="/complaints-inbox" element={
                          <ProtectedRoute requiredFeature="complaints_inbox">
                            <Layout>
                              <ComplaintsInbox />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Suggestions */}
                        <Route path="/suggestions" element={
                          <ProtectedRoute requiredFeature="suggestions">
                            <Layout>
                              <Suggestions />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Suggestions Inbox */}
                        <Route path="/suggestions-inbox" element={
                          <ProtectedRoute requiredFeature="suggestions_inbox">
                            <Layout>
                              <SuggestionsInbox />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* CS Tickets */}
                        <Route path="/tickets" element={
                          <ProtectedRoute requiredFeature="cs_tickets">
                            <Layout>
                              <div className="p-8">
                                <h1 className="text-2xl font-bold mb-4">CS Tickets</h1>
                                <p>Customer service tickets functionality coming soon...</p>
                              </div>
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Fleet Records */}
                        <Route path="/driver-operations" element={
                          <ProtectedRoute requiredFeature="fleet_records">
                            <Layout>
                              <div className="p-8">
                                <h1 className="text-2xl font-bold mb-4">Fleet Records</h1>
                                <p>Fleet records functionality coming soon...</p>
                              </div>
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Breakdowns */}
                        <Route path="/breakdowns" element={
                          <ProtectedRoute requiredFeature="breakdowns">
                            <Layout>
                              <div className="p-8">
                                <h1 className="text-2xl font-bold mb-4">Breakdowns</h1>
                                <p>Breakdowns management functionality coming soon...</p>
                              </div>
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Sim Cards */}
                        <Route path="/simcards" element={
                          <ProtectedRoute requiredFeature="simcards">
                            <Layout>
                              <Simcard />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        <Route path="/simcards/:id" element={
                          <ProtectedRoute requiredFeature="simcards">
                            <Layout>
                              <SimcardProfile />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Expense Tracker */}
                        <Route path="/expense-tracker" element={
                          <ProtectedRoute requiredFeature="expense_tracker">
                            <Layout>
                              <ExpenseTracker />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Expenses (alternative path for sidebar compatibility) */}
                        <Route path="/expenses" element={
                          <ProtectedRoute requiredFeature="expense_tracker">
                            <Layout>
                              <ExpenseTracker />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Payment Calendar */}
                        <Route path="/payment-calendar" element={
                          <ProtectedRoute requiredFeature="payment_calendar">
                            <Layout>
                              <PaymentCalendar />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Upcoming Payments */}
                        <Route path="/upcoming-payments" element={
                          <ProtectedRoute requiredFeature="upcoming_payments">
                            <Layout>
                              <UpcomingPaymentEvents />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Vouchers */}
                        <Route path="/vouchers" element={
                          <ProtectedRoute requiredFeature="vouchers">
                            <Layout>
                              <Voucher />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Task Management */}
                        <Route path="/task-management" element={
                          <ProtectedRoute requiredFeature="task_management">
                            <Layout>
                              <TaskManagement />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Reports */}
                        <Route path="/reports" element={
                          <ProtectedRoute requiredFeature="reports">
                            <Layout>
                              <TaskReports />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Fleet Management Routes */}
                        {/* Fleet onboarding removed — adding a vehicle in Fleet Records covers it. */}
                        <Route path="/fleet-onboarding" element={
                          <Navigate to="/operation/fleet-lifecycle" replace />
                        } />

                        <Route path="/fleet-offboarding" element={
                          <ProtectedRoute requiredFeature="fleet_offboarding">
                            <Layout>
                              <FleetOffboarding />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/fleet-delivery-checklist" element={
                          <ProtectedRoute requiredFeature="fleet_delivery_checklist">
                            <Layout>
                              <FleetDeliveryChecklist />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/fleet-maintenance-record" element={
                          <ProtectedRoute requiredFeature="fleet_maintenance_record">
                            <Layout>
                              <FleetMaintenanceRecord />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/fleet-driver-calendar" element={
                          <ProtectedRoute requiredFeature="fleet_management">
                            <Layout>
                              <FleetDriverCalendar />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Subscribe Now */}
                        <Route path="/subscribe-now" element={
                          <ProtectedRoute requiredFeature="subscribe_now">
                            <Layout>
                              <SubscribeNow />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Collections */}
                        <Route path="/collections" element={
                          <ProtectedRoute requiredFeature="collections">
                            <Layout>
                              <Collections />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Marketing Calendar */}
                        <Route path="/marketing-calendar" element={
                          <ProtectedRoute requiredFeature="marketing_calendar">
                            <Layout>
                              <MarketingCalendar />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* IOT Record */}
                        <Route path="/iot-record" element={
                          <ProtectedRoute requiredFeature="iot_record">
                            <Layout>
                              <IOTRecord />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Operation (unified department panel) */}
                        <Route path="/operation" element={
                          <ProtectedRoute requiredFeature="fleet_management">
                            <Layout>
                              <OperationHome />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        <Route path="/operation/fleet-records" element={
                          <ProtectedRoute requiredFeature="fleet_records">
                            <Layout>
                              <FleetManagement
                                pageTitle="Fleet Record"
                                profileBasePath="/operation/fleet-records"
                                excludeSampleData
                              />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        <Route path="/operation/fleet-records/:id" element={
                          <ProtectedRoute requiredFeature="fleet_records">
                            <Layout>
                              <FleetRecordProfile />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        <Route path="/operation/fleet-lifecycle" element={
                          <ProtectedRoute requiredFeature="fleet_lifecycle">
                            <Layout>
                              <FleetLifecycle />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        <Route path="/operation/fleetio" element={
                          <Navigate to="/operation/fleetio/dashboard" replace />
                        } />
                        <Route path="/operation/fleetio/modules" element={
                          <ProtectedRoute requiredFeature="udrive_fleetio">
                            <Layout>
                              <UDriveFleetio />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        <Route path="/operation/fleetio/dashboard" element={
                          <ProtectedRoute requiredFeature="udrive_fleetio">
                            <Layout>
                              <FleetDashboard />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        <Route path="/operation/fleetio/maintenance" element={
                          <ProtectedRoute requiredFeature="fleet_maintenance_record">
                            <Layout>
                              <FleetMaintenanceRecord />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        <Route path="/operation/fleetio/inspections" element={
                          <ProtectedRoute requiredFeature="fleet_delivery_checklist">
                            <Layout>
                              <FleetDeliveryChecklist />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        <Route path="/operation/fleetio/assignments" element={
                          <ProtectedRoute requiredFeature="fleet_management">
                            <Layout>
                              <FleetDriverCalendar />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        <Route path="/operation/fleetio/preventive-maintenance" element={
                          <ProtectedRoute requiredFeature="fleet_maintenance_record">
                            <Layout>
                              <FleetPmSchedules />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        <Route path="/operation/drivers" element={
                          <ProtectedRoute requiredFeature="driver_records">
                            <Layout>
                              <Drivers />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        <Route path="/operation/teams" element={
                          <ProtectedRoute requiredFeature="driver_records">
                            <Layout>
                              <OperationTeams />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        <Route path="/operation/roster" element={
                          <ProtectedRoute requiredFeature="operation_roster">
                            <Layout>
                              <OperationRoster />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        <Route path="/operation/team-allocation" element={
                          <ProtectedRoute requiredFeature="operation_roster">
                            <Layout>
                              <OperationTeamAllocation />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        <Route path="/operation/breakdowns" element={
                          <ProtectedRoute requiredFeature="breakdowns">
                            <Layout>
                              <BreakdownsPage />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Legacy operation/fleet paths → new Operation routes */}
                        <Route path="/driver-operations" element={<Navigate to="/operation/fleet-records" replace />} />
                        <Route path="/breakdowns" element={<Navigate to="/operation/breakdowns" replace />} />

                        {/* Catch all route - redirect to home for authenticated users */}
                        <Route path="*" element={
                          <ProtectedRoute>
                            <Layout hidePageHeader>
                              <UserWelcome />
                            </Layout>
                          </ProtectedRoute>
                        } />
                      </Routes>
                    </Suspense>
                  </Router>
                </ThemeProvider>
              </SidebarProvider>
            </NotificationProvider>
          </ChatProvider>
        </ToastProvider>
      </AuthProvider>
      {isDev ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}

export default App;
