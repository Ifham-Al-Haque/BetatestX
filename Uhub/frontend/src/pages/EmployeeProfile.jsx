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
        reporting_manager:reporting_manager_id ( name, employee_id )
      `)
      .eq("id", id)
      .single();

    if (empError) {
      console.error("Error fetching employee:", empError.message);
      setLoading(false);
      return;
    }

    const { data: accessList } = await supabase
      .from("employee_access")
      .select("*")
      .eq("employee_id", id);

    const { data: assetList } = await supabase
      .from("employee_assets")
      .select("*")
      .eq("employee_id", id);

    let authUserData = null;
    if (empData.auth_user_id) {
      const { data: userData } = await supabase
        .from("profiles")
        .select("email, role, is_verified")
        .eq("id", empData.auth_user_id)
        .single();

      authUserData = userData;
    }

    setEmployee({
      ...empData,
      auth_user: authUserData,
      access_list: accessList || [],
      asset_list: assetList || [],
    });

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
          {/* Header */}
          <div className="flex items-center mb-6">
            {employee.profile_picture ? (
              <img
                src={employee.profile_picture}
                alt={employee.full_name}
                className="w-24 h-24 rounded-full border-2 border-blue-500 object-cover mr-6"
              />
            ) : (
              <Avatar
                name={employee.full_name}
                size="96"
                round
                className="mr-6"
                color="#4F46E5"
                textSizeRatio={2}
              />
            )}
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {employee.full_name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {employee.position} — {employee.department}
              </p>
              {employee.reporting_manager && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Reports to: {employee.reporting_manager.name} (
                  {employee.reporting_manager.employee_id})
                </p>
              )}
              {employee.auth_user?.email && (
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <p>Auth User: {employee.auth_user.email}</p>
                  <p>Role: {employee.auth_user.role || "N/A"}</p>
                  <p>
                    Status:{" "}
                    {employee.auth_user.is_verified ? "Verified" : "Unverified"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Responsibilities */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Responsibilities
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                {(employee.responsibilities || []).map((res, i) => (
                  <li key={i}>{res}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Extra Duties
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                {(employee.duties || []).map((duty, i) => (
                  <li key={i}>{duty}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Access & Assets */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Access List
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                {(employee.access_list || []).map((access, i) => (
                  <li key={i}>
                    {access.access_type} ({access.access_level})
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Asset List
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                {(employee.asset_list || []).map((asset, i) => (
                  <li key={i}>
                    {asset.asset_type} — {asset.asset_tag}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Edit Button */}
          <div className="mt-6">
            <Link
              to={`/employees/${employee.id}/edit`}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

