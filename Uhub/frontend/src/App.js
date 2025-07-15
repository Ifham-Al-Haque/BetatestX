// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Assets from "./pages/Assets";
import Tickets from "./pages/Tickets";
import AccessRequests from "./pages/AccessRequests";
import ExpenseTracker from "./pages/ExpenseTracker";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminOnlyPage from "./pages/AdminOnlyPage"; // ✅ Import added
import ConfirmEmail from "./pages/ConfirmEmail";
import EmployeeProfile from "./pages/EmployeeProfile";
import EmployeeForm from "./pages/EmployeeForm";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
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
        <Route path="/employees/:id" element={
        <ProtectedRoute>
          <EmployeeProfile />
          </ProtectedRoute>
                          } />
                          <Route path="/employees/new" element={<ProtectedRoute><EmployeeForm /></ProtectedRoute>} />
                          <Route path="/employees/edit/:id" element={<ProtectedRoute><EmployeeForm /></ProtectedRoute>} />
        <Route path="/assets" element={
          <ProtectedRoute>
            <Assets />
          </ProtectedRoute>
        } />
        <Route path="/tickets" element={
          <ProtectedRoute>
            <Tickets />
          </ProtectedRoute>
        } />
        <Route path="/access-requests" element={
          <ProtectedRoute>
            <AccessRequests />
          </ProtectedRoute>
        } />
        <Route path="/expenses" element={
          <ProtectedRoute>
            <ExpenseTracker />
          </ProtectedRoute>
        } />
        <Route path="/admin-only" element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminOnlyPage />
            </AdminRoute>
          </ProtectedRoute>
        } />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
      </Routes>
    </Router>
  );
}

export default App;
