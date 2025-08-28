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

// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error?.status >= 400 && error?.status < 500) { return false; }
        return false;
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
const Assets = React.lazy(() => import('./pages/Assets'));
const AssetProfile = React.lazy(() => import('./pages/AssetProfile'));
const ITAssets = React.lazy(() => import('./pages/ITAssets'));
const ITRequests = React.lazy(() => import('./pages/ITRequests'));
const CSPA = React.lazy(() => import('./pages/CSPA'));
const Complaints = React.lazy(() => import('./pages/Complaints'));
const Attendance = React.lazy(() => import('./pages/Attendance'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const CalendarView = React.lazy(() => import('./pages/CalendarView'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const FleetManagement = React.lazy(() => import('./pages/FleetManagement'));
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
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/welcome" element={<Welcome />} />
                        <Route path="/login" element={<Login />} />
                        
                        {/* Smart Home Route - Redirects based on auth status */}
                        <Route path="/" element={<SmartHomeRoute />} />

                        {/* Protected Routes - Role-based landing pages */}
                        <Route path="/dashboard" element={
                          <ProtectedRoute requiredRole="admin">
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
