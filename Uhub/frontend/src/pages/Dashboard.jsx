// src/pages/Dashboard.jsx
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 p-6 w-full">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the Uhub Admin Panel.</p>
      </div>
    </div>
  );
}
