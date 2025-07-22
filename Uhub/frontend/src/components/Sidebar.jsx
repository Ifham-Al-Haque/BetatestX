// src/components/Sidebar.jsx
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="h-screen w-64 bg-gray-900 text-white fixed">
      <div className="flex items-center gap-3 p-6 text-xl font-bold italic border-b border-gray-700">
        <img src="/Uhub.png" alt="Uhub Logo" className="h-10 w-auto" />
        <span>UHUB</span>
      </div>
      <nav className="p-4 space-y-3">
        <Link to="/dashboard" className="block hover:text-blue-400">Dashboard</Link>
        <Link to="/employees" className="block hover:text-blue-400">Employees Records </Link>
        <Link to="/assets" className="block hover:text-blue-400">Assets Records </Link>
        <Link to="/tickets" className="block hover:text-blue-400">IT Tickets</Link>
        <Link to="/access-requests" className="block hover:text-blue-400"> Requests</Link>
        <Link to="/expenses" className="block hover:text-blue-400">Expense Data</Link>
      </nav>
    </div>
  );
}
