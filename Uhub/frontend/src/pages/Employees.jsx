// src/pages/Employees.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";

export default function Employees() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    const { data, error } = await supabase.from("employees").select("*");
    if (error) console.error("Fetch error:", error);
    else setEmployees(data);
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 p-6 w-full">
        <h2 className="text-2xl font-bold mb-4">Employee Records</h2>
        <table className="min-w-full bg-white shadow rounded">
          <thead>
            <tr className="bg-gray-200">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Department</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Access</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-t">
                <td className="p-2">{emp.name}</td>
                <td className="p-2">{emp.department}</td>
                <td className="p-2">{emp.role}</td>
                <td className="p-2">—</td> {/* Placeholder for access tracking */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
