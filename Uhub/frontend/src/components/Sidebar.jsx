// src/components/Sidebar.jsx
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="h-screen w-64 bg-gray-900 text-white fixed">
      <div className="p-6 text-xl font-bold border-b border-gray-700">Uhub</div>
      <nav className="p-4 space-y-3">
        <Link to="/dashboard" className="block hover:text-blue-400">Dashboard</Link>
        <Link to="/employees" className="block hover:text-blue-400">Employees</Link>
        <Link to="/assets" className="block hover:text-blue-400">Assets</Link>
        <Link to="/tickets" className="block hover:text-blue-400">Tickets</Link>
        <Link to="/access-requests" className="block hover:text-blue-400">Access Requests</Link>
        <Link to="/expenses" className="block hover:text-blue-400">Expense Tracker</Link>
      </nav>
    </div>
  );
}
