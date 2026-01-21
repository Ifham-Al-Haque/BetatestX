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
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import SmartHomeRoute from './components/SmartHomeRoute';
import RoutePrefetcher from './components/RoutePrefetcher';

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

// Lazy load components for better performance
const Welcome = React.lazy(() => import('./pages/Welcome'));
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const Employees = React.lazy(() => import('./pages/Employees'));
const EmployeeHistory = React.lazy(() => import('./pages/EmployeeHistory'));
const EmployeeProfile = React.lazy(() => import('./pages/EmployeeProfile'));
const EmployeeForm = React.lazy(() => import('./pages/EmployeeForm'));
const EmployeeOnboarding = React.lazy(() => import('./pages/EmployeeOnboarding'));
const EmployeeOffboarding = React.lazy(() => import('./pages/EmployeeOffboarding'));
const Drivers = React.lazy(() => import('./pages/Driver'));
const DriverForm = React.lazy(() => import('./pages/DriverForm'));
const DriverProfile = React.lazy(() => import('./pages/DriverProfile'));
const Assets = React.lazy(() => import('./pages/Assets'));
const AssetProfile = React.lazy(() => import('./pages/AssetProfile'));
const AssetEdit = React.lazy(() => import('./pages/AssetEdit'));
const ITAssets = React.lazy(() => import('./pages/ITAssets'));
const ITRequests = React.lazy(() => import('./pages/ITRequestsEnhanced'));
const RequestInbox = React.lazy(() => import('./pages/RequestInbox'));
const CSPA = React.lazy(() => import('./pages/CSPA'));
const Complaints = React.lazy(() => import('./pages/Complaints'));
const Attendance = React.lazy(() => import('./pages/Attendance'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const CalendarView = React.lazy(() => import('./pages/CalendarView'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const FleetManagement = React.lazy(() => import('./pages/FleetManagement'));
const DeliveryManagement = React.lazy(() => import('./pages/DeliveryManagement'));
const DeliveryTracking = React.lazy(() => import('./pages/DeliveryTracking'));
const DeliveryRoutes = React.lazy(() => import('./pages/DeliveryRoutes'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const Suggestions = React.lazy(() => import('./pages/Suggestions'));
const TaskManagement = React.lazy(() => import('./pages/TaskManagement'));
const ExpenseTracker = React.lazy(() => import('./pages/ExpenseTracker'));
const PaymentCalendar = React.lazy(() => import('./pages/PaymentCalendar'));
const Chat = React.lazy(() => import('./pages/Chat'));
const ComplaintsInbox = React.lazy(() => import('./pages/ComplaintsInbox'));
const Simcard = React.lazy(() => import('./pages/Simcard'));
const Events = React.lazy(() => import('./pages/Events'));
const Memories = React.lazy(() => import('./pages/Memories'));
const EventPictureUpload = React.lazy(() => import('./pages/EventPictureUpload'));
const UserWelcome = React.lazy(() => import('./pages/UserWelcome'));
const SubscribeNow = React.lazy(() => import('./pages/SubscribeNow'));
const Collections = React.lazy(() => import('./pages/Collections'));
const FleetOnboarding = React.lazy(() => import('./pages/FleetOnboarding'));
const FleetOffboarding = React.lazy(() => import('./pages/FleetOffboarding'));
const FleetDeliveryChecklist = React.lazy(() => import('./pages/FleetDeliveryChecklist'));
const FleetMaintenanceRecord = React.lazy(() => import('./pages/FleetMaintenanceRecord'));
const MarketingCalendar = React.lazy(() => import('./pages/MarketingCalendar'));
const OrganizationalHierarchy = React.lazy(() => import('./pages/OrganizationalHierarchy'));
const IOTRecord = React.lazy(() => import('./pages/IOTRecord'));
const ITTools = React.lazy(() => import('./pages/ITTools'));
const RoleDebugger = React.lazy(() => import('./components/RoleDebugger'));

function App() {
  // Prevent unwanted page reloads on tab switch/visibility change
  React.useEffect(() => {
    // Prevent reload on visibility change unless we're actually on offline page
    const handleVisibilityChange = () => {
      // Only prevent reload if we're not on the offline page
      if (!window.location.pathname.includes('offline') && !document.title.includes('Offline')) {
        // Prevent any automatic reloads on tab switch
        // This ensures the page doesn't reload when switching tabs
      }
    };

    // Prevent beforeunload from causing issues
    const handleBeforeUnload = (e) => {
      // Only show confirmation if user is actually trying to leave
      // Don't interfere with normal navigation
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/welcome" element={<Welcome />} />
                        <Route path="/login" element={<Login />} />
                        
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
                            <Layout>
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

                        {/* Temporary test route to verify routing is working */}
                        <Route path="/driver/test" element={
                          <Layout>
                            <div className="p-8">
                              <h1 className="text-2xl font-bold text-green-600">✅ Route Test Successful!</h1>
                              <p>If you can see this, routing is working correctly.</p>
                            </div>
                          </Layout>
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
                          <ProtectedRoute requiredFeature="task_management">
                            <Layout>
                              <Tasks />
                            </Layout>
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
                          <ProtectedRoute requiredFeature="employees">
                            <Layout>
                              <Employees />
                            </Layout>
                          </ProtectedRoute>
                        } />
                        
                        {/* Employee Profile Route */}
                        <Route path="/employee/:id" element={
                          <ProtectedRoute requiredFeature="employees">
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

                        <Route path="/it-requests" element={
                          <ProtectedRoute requiredFeature="it_requests">
                            <Layout>
                              <ITRequests />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/request-inbox" element={
                          <ProtectedRoute requiredFeature="it_requests" requiredRoles={['admin', 'it_management']}>
                            <Layout>
                              <RequestInbox />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        <Route path="/it-tools" element={
                          <ProtectedRoute requiredFeature="it_requests" requiredRoles={['admin', 'it_management']}>
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

                        <Route path="/fleet" element={
                          <ProtectedRoute requiredFeature="fleet_management">
                            <Layout>
                              <FleetManagement />
                            </Layout>
                          </ProtectedRoute>
                        } />

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
                          <ProtectedRoute requiredFeature="complaints">
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

                        {/* Request Inbox */}
                        <Route path="/request-inbox" element={
                          <ProtectedRoute requiredFeature="request_inbox">
                            <Layout>
                              <div className="p-8">
                                <h1 className="text-2xl font-bold mb-4">Request Inbox</h1>
                                <p>Request inbox functionality coming soon...</p>
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
                              <div className="p-8">
                                <h1 className="text-2xl font-bold mb-4">Upcoming Payments</h1>
                                <p>Upcoming payments functionality coming soon...</p>
                              </div>
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Vouchers */}
                        <Route path="/vouchers" element={
                          <ProtectedRoute requiredFeature="vouchers">
                            <Layout>
                              <div className="p-8">
                                <h1 className="text-2xl font-bold mb-4">Vouchers</h1>
                                <p>Vouchers management functionality coming soon...</p>
                              </div>
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
                              <div className="p-8">
                                <h1 className="text-2xl font-bold mb-4">Reports</h1>
                                <p>Reports functionality coming soon...</p>
                              </div>
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Fleet Management Routes */}
                        <Route path="/fleet-onboarding" element={
                          <ProtectedRoute requiredFeature="fleet_onboarding">
                            <Layout>
                              <FleetOnboarding />
                            </Layout>
                          </ProtectedRoute>
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

                        {/* Debug Route */}
                        <Route path="/role-debug" element={
                          <ProtectedRoute>
                            <Layout>
                              <RoleDebugger />
                            </Layout>
                          </ProtectedRoute>
                        } />

                        {/* Catch all route - redirect to home for authenticated users */}
                        <Route path="*" element={
                          <ProtectedRoute>
                            <Layout>
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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
