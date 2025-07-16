// src/pages/EmployeeProfile.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import Avatar from "react-avatar";

export default function EmployeeProfile() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployee = useCallback(async () => {
    setLoading(true);

    const { data: empData, error: empError } = await supabase
      .from("employees")
      .select(`
        *,
        reporting_manager:reporting_manager_id (
          name,
          employee_id
        )
      `)
      .eq("id", id)
      .single();

    if (empError) {
      console.error("Error fetching employee:", empError.message);
      setLoading(false);
      return;
    }

    let authUserData = null;
    if (empData.auth_user_id) {
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("email, role, is_verified")
        .eq("id", empData.auth_user_id)
        .single();

      if (!userError) authUserData = userData;
    }

    setEmployee({ ...empData, auth_user: authUserData });
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!employee) return <div className="p-6">Employee not found.</div>;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="ml-64 p-8 w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          {/* Profile Header */}
          <div className="flex items-center mb-6">
            {employee.photo_url ? (
              <img
                src={employee.photo_url}
                alt={employee.name}
                className="w-24 h-24 rounded-full border-2 border-blue-500 object-cover mr-6"
              />
            ) : (
              <Avatar
                name={employee.name}
                size="96"
                round
                className="mr-6"
                color="#4F46E5"
                textSizeRatio={2}
              />
            )}
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {employee.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {employee.designation} — {employee.department}
              </p>

              {employee.reporting_manager && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Reports to: {employee.reporting_manager.name} (
                  {employee.reporting_manager.employee_id})
                </p>
              )}

              {employee.auth_user?.email && (
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <p>Linked Auth User: {employee.auth_user.email}</p>
                  <p>Role: {employee.auth_user.role || "N/A"}</p>
                  <p>
                    Status:{" "}
                    {employee.auth_user.is_verified ? "Verified" : "Unverified"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Summary
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {employee.summary || "This employee has no summary added yet."}
            </p>
          </div>

          {/* Responsibilities */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Key Responsibilities
              </h3>

              {Array.isArray(employee.key_roles_detailed) &&
              employee.key_roles_detailed.length > 0 ? (
                <ul className="pl-5 space-y-3">
                  {employee.key_roles_detailed.map((item, i) => (
                    <li key={i}>
                      <p className="text-md font-medium text-gray-800 dark:text-white">
                        • {item.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 ml-4">
                        {item.description}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
                  {(employee.key_roles || "")
                    .split(",")
                    .filter(Boolean)
                    .map((role, i) => (
                      <li key={i}>{role.trim()}</li>
                    ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Extra Duties
              </h3>
              <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
                {(employee.extra_responsibilities || "")
                  .split(",")
                  .filter(Boolean)
                  .map((item, i) => (
                    <li key={i}>{item.trim()}</li>
                  ))}
              </ul>
            </div>
          </div>

          {/* Edit Responsibilities & Duties Button */}
          <div className="mt-4">
            <Link
              to={`/employees/${employee.id}/edit-duties`}
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Edit Responsibilities & Duties
            </Link>
          </div>

          {/* Access & Assets */}
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Access Provided
              </h3>
              <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
                {(employee.access_list || "")
                  .split(",")
                  .filter(Boolean)
                  .map((access, i) => (
                    <li key={i}>{access.trim()}</li>
                  ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Assets Assigned
              </h3>
              <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
                {(employee.assets || "")
                  .split(",")
                  .filter(Boolean)
                  .map((asset, i) => (
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

