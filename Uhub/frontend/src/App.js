// src/App.js
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { SidebarProvider } from "./context/SidebarContext";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import LoadingDiagnostic from "./components/LoadingDiagnostic";

// Lazy load components for better performance
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Employees = lazy(() => import("./pages/Employees"));
const EmployeeForm = lazy(() => import("./pages/EmployeeForm"));
const EmployeeProfile = lazy(() => import("./pages/EmployeeProfile"));
const Assets = lazy(() => import("./pages/Assets"));
const ExpenseTracker = lazy(() => import("./pages/ExpenseTracker"));
const Tickets = lazy(() => import("./pages/Tickets"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const AccessRequests = lazy(() => import("./pages/AccessRequests"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AssetProfile = lazy(() => import("./pages/AssetProfile"));
const InvitationSignup = lazy(() => import("./pages/InvitationSignup"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ConfirmEmail = lazy(() => import("./pages/ConfirmEmail"));

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

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  return <ProtectedRoute adminOnly={true}>{children}</ProtectedRoute>;
};

// App Routes Component
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    }>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/invitation-signup" element={<InvitationSignup />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/employees" element={
          <ProtectedRoute>
            <Employees />
          </ProtectedRoute>
        } />
        
        <Route path="/employee/new" element={
          <ProtectedRoute>
            <EmployeeForm />
          </ProtectedRoute>
        } />
        
        <Route path="/employee/:id" element={
          <ProtectedRoute>
            <EmployeeProfile />
          </ProtectedRoute>
        } />
        
        <Route path="/employee/:id/edit" element={
          <ProtectedRoute>
            <EmployeeForm />
          </ProtectedRoute>
        } />
        
        <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
        <Route path="/assets/:id" element={<ProtectedRoute><AssetProfile /></ProtectedRoute>} />
        <Route path="/expenses" element={
          <ProtectedRoute>
            <ExpenseTracker />
          </ProtectedRoute>
        } />
        
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />
        
        <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/users" element={
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        } />
        
        <Route path="/admin/access-requests" element={
          <AdminRoute>
            <AccessRequests />
          </AdminRoute>
        } />
        
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <SidebarProvider>
              <Router>
                <div className="App">
                  <AppRoutes />
                  <LoadingDiagnostic />
                </div>
              </Router>
            </SidebarProvider>
          </AuthProvider>
        </ToastProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
