// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Assets from "./pages/Assets";
import Tickets from "./pages/Tickets";
import AccessRequests from "./pages/AccessRequests";
import ExpenseTracker from "./pages/ExpenseTracker";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/access-requests" element={<AccessRequests />} />
        <Route path="/expenses" element={<ExpenseTracker />} />
      </Routes>
    </Router>
  );
}

export default App;
