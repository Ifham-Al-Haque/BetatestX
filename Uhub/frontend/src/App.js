// src/App.js
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';

// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error?.status >= 400 && error?.status < 500) { return false; }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      networkMode: 'online',
      refetchOnReconnect: true,
      refetchOnMount: true,
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
const EmployeeProfile = React.lazy(() => import('./pages/EmployeeProfile'));
const EmployeeForm = React.lazy(() => import('./pages/EmployeeForm'));
const Drivers = React.lazy(() => import('./pages/Driver'));
const DriverProfile = React.lazy(() => import('./pages/DriverProfile'));
const DriverForm = React.lazy(() => import('./pages/DriverForm'));
const Assets = React.lazy(() => import('./pages/Assets'));
const ITAssets = React.lazy(() => import('./pages/ITAssets'));
const ITRequests = React.lazy(() => import('./pages/ITRequests'));
const ITTickets = React.lazy(() => import('./pages/ITTickets'));
const CSPA = React.lazy(() => import('./pages/CSPA'));
const Tickets = React.lazy(() => import('./pages/Tickets'));
const Complaints = React.lazy(() => import('./pages/Complaints'));
const ComplaintsInbox = React.lazy(() => import('./pages/ComplaintsInbox'));
const ComplaintsTest = React.lazy(() => import('./pages/ComplaintsTest'));
const RoleDebug = React.lazy(() => import('./pages/RoleDebug'));
const RequestInbox = React.lazy(() => import('./pages/RequestInbox'));
const Surveys = React.lazy(() => import('./pages/Surveys'));
const Attendance = React.lazy(() => import('./pages/Attendance'));
const AttendanceUpload = React.lazy(() => import('./pages/AttendanceUpload'));
const Payroll = React.lazy(() => import('./pages/Payroll'));
const EPR = React.lazy(() => import('./pages/EPR'));
const TaskManagement = React.lazy(() => import('./pages/TaskManagement'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const ExpenseTracker = React.lazy(() => import('./pages/ExpenseTracker'));
const PaymentCalendar = React.lazy(() => import('./pages/PaymentCalendar'));
const UpcomingPaymentEvents = React.lazy(() => import('./pages/UpcomingPaymentEvents'));
const Vouchers = React.lazy(() => import('./pages/Voucher'));
const Simcards = React.lazy(() => import('./pages/Simcard'));
const Breakdowns = React.lazy(() => import('./pages/Breakdowns'));
const FleetManagement = React.lazy(() => import('./pages/FleetManagement'));
const DriverOperations = React.lazy(() => import('./pages/DriverOperations'));
const CalendarView = React.lazy(() => import('./pages/CalendarView'));
const InvitationManager = React.lazy(() => import('./pages/InvitationManager'));
const TestInvitations = React.lazy(() => import('./pages/TestInvitations'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const AccessManagement = React.lazy(() => import('./pages/AccessManagement'));
const AccessRequests = React.lazy(() => import('./pages/AccessRequests'));
const RBACTest = React.lazy(() => import('./pages/RBACTest'));
const CallCenterDemo = React.lazy(() => import('./pages/CallCenterDemo'));
const CSVDataImporter = React.lazy(() => import('./components/CSVDataImporter'));
const InvitationAccept = React.lazy(() => import('./pages/InvitationAccept'));
const InvitationSignup = React.lazy(() => import('./pages/InvitationSignup'));
const ConfirmEmail = React.lazy(() => import('./pages/ConfirmEmail'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const Suggestions = React.lazy(() => import('./pages/Suggestions'));
const Events = React.lazy(() => import('./pages/Events'));
const Memories = React.lazy(() => import('./pages/Memories'));
const EventPictureUpload = React.lazy(() => import('./pages/EventPictureUpload'));
const Chat = React.lazy(() => import('./pages/Chat'));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <SidebarProvider>
            <ToastProvider>
              <ThemeProvider>
                <ChatProvider>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Welcome />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/confirm-email" element={<ConfirmEmail />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/invitation-accept" element={<InvitationAccept />} />
                    <Route path="/invitation-signup" element={<InvitationSignup />} />

                    {/* Protected Routes - Role-based landing pages */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Layout>
                          <Dashboard />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    {/* Admin Routes */}
                    <Route path="/admin/*" element={
                      <AdminRoute>
                        <Layout>
                          <Routes>
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                          </Routes>
                        </Layout>
                      </AdminRoute>
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
                      <ProtectedRoute requiredFeature="drivers">
                        <Layout>
                          <Drivers />
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
                        <Layout>
                          <Tasks />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    {/* Other protected routes */}
                    <Route path="/user-management" element={
                      <ProtectedRoute requiredFeature="user_management">
                        <Layout>
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

                    <Route path="/employee/:id" element={
                      <ProtectedRoute requiredFeature="employees">
                        <Layout>
                          <EmployeeProfile />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/employee-form" element={
                      <ProtectedRoute requiredFeature="employees">
                        <Layout>
                          <EmployeeForm />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/driver-profile" element={
                      <ProtectedRoute requiredFeature="drivers">
                        <Layout>
                          <DriverProfile />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/driver-form" element={
                      <ProtectedRoute requiredFeature="drivers">
                        <Layout>
                          <DriverForm />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/driver/new" element={
                      <ProtectedRoute requiredFeature="drivers">
                        <Layout>
                          <DriverForm />
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
                      <ProtectedRoute requiredFeature="requests">
                        <Layout>
                          <ITRequests />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/it-tickets" element={
                      <ProtectedRoute requiredFeature="it_tickets">
                        <Layout>
                          <ITTickets />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/tickets" element={
                      <ProtectedRoute requiredFeature="cs_tickets">
                        <Layout>
                          <Tickets />
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

                    <Route path="/complaints-inbox" element={
                      <ProtectedRoute requiredFeature="complaints_inbox">
                        <Layout>
                          <ComplaintsInbox />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/complaints-test" element={
                      <ProtectedRoute requiredFeature="complaints_test">
                        <Layout>
                          <ComplaintsTest />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/suggestions" element={
                      <ProtectedRoute requiredFeature="suggestions">
                        <Layout>
                          <Suggestions />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    {/* Slice of Life Routes */}
                    <Route path="/events" element={
                      <ProtectedRoute>
                        <Layout>
                          <Events />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/memories" element={
                      <ProtectedRoute>
                        <Layout>
                          <Memories />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/event-picture-upload" element={
                      <ProtectedRoute>
                        <Layout>
                          <EventPictureUpload />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/chat" element={
                      <ProtectedRoute>
                        <Layout>
                          <Chat />
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

                    <Route path="/role-debug" element={
                      <ProtectedRoute requiredFeature="role_debug">
                        <Layout>
                          <RoleDebug />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/surveys" element={
                      <ProtectedRoute requiredFeature="surveys">
                        <Layout>
                          <Surveys />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/attendance-upload" element={
                      <ProtectedRoute requiredFeature="attendance_upload">
                        <Layout>
                          <AttendanceUpload />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/payroll" element={
                      <ProtectedRoute requiredFeature="payroll">
                        <Layout>
                          <Payroll />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/epr" element={
                      <ProtectedRoute requiredFeature="epr">
                        <Layout>
                          <EPR />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/task-management" element={
                      <ProtectedRoute requiredFeature="task_management">
                        <Layout>
                          <TaskManagement />
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

                    <Route path="/expenses" element={
                      <ProtectedRoute requiredFeature="expense_tracker">
                        <Layout>
                          <ExpenseTracker />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/payment-calendar" element={
                      <ProtectedRoute requiredFeature="payment_calendar">
                        <Layout>
                          <PaymentCalendar />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/upcoming-payments" element={
                      <ProtectedRoute requiredFeature="upcoming_payments">
                        <Layout>
                          <UpcomingPaymentEvents />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/vouchers" element={
                      <ProtectedRoute requiredFeature="vouchers">
                        <Layout>
                          <Vouchers />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/simcards" element={
                      <ProtectedRoute requiredFeature="simcards">
                        <Layout>
                          <Simcards />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/breakdowns" element={
                      <ProtectedRoute requiredFeature="breakdowns">
                        <Layout>
                          <Breakdowns />
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

                    <Route path="/driver-operations" element={
                      <ProtectedRoute requiredFeature="fleet_records">
                        <Layout>
                          <DriverOperations />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/calendar-view" element={
                      <ProtectedRoute requiredFeature="calendar_view">
                        <Layout>
                          <CalendarView />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/invitation-manager" element={
                      <ProtectedRoute requiredFeature="invitation_manager">
                        <Layout>
                          <InvitationManager />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/test-invitations" element={
                      <ProtectedRoute requiredFeature="test_invitations">
                        <Layout>
                          <TestInvitations />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/profile" element={
                      <ProtectedRoute requiredFeature="user_profile">
                        <Layout>
                          <UserProfile />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/access-management" element={
                      <ProtectedRoute requiredFeature="access_management">
                        <Layout>
                          <AccessManagement />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/access-requests" element={
                      <ProtectedRoute requiredFeature="access_requests">
                        <Layout>
                          <AccessRequests />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/rbac-test" element={
                      <ProtectedRoute requiredFeature="rbac_test">
                        <Layout>
                          <RBACTest />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/call-center-demo" element={
                      <ProtectedRoute requiredFeature="call_center_demo">
                        <Layout>
                          <CallCenterDemo />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    <Route path="/csv-importer" element={
                      <ProtectedRoute requiredFeature="csv_importer">
                        <Layout>
                          <CSVDataImporter />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    {/* Catch all route - redirect to welcome */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
                <ReactQueryDevtools initialIsOpen={false} />
                </ChatProvider>
              </ThemeProvider>
            </ToastProvider>
          </SidebarProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
