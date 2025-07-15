// src/pages/EmployeeProfile.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";

export default function EmployeeProfile() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  async function fetchEmployee() {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();
    if (!error) {
      setEmployee(data);
    }
    setLoading(false);
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!employee) return <div className="p-6">Employee not found.</div>;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="ml-64 p-8 w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-6">
            <img
              src={employee.photo_url || "https://via.placeholder.com/120x120"}
              alt={employee.name}
              className="w-24 h-24 rounded-full border-2 border-blue-500 object-cover mr-6"
            />
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{employee.name}</h2>
              <p className="text-gray-600 dark:text-gray-300">{employee.designation} — {employee.department}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Summary</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {employee.summary || "This employee has no summary added yet."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Key Responsibilities</h3>
              <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
                {(employee.key_roles || "").split(",").map((role, i) => (
                  <li key={i}>{role.trim()}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Extra Duties</h3>
              <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
                {(employee.extra_responsibilities || "").split(",").map((item, i) => (
                  <li key={i}>{item.trim()}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Access Provided</h3>
              <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
                {(employee.access_list || "").split(",").map((access, i) => (
                  <li key={i}>{access.trim()}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Assets Assigned</h3>
              <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
                {(employee.assets || "").split(",").map((asset, i) => (
                  <li key={i}>{asset.trim()}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
