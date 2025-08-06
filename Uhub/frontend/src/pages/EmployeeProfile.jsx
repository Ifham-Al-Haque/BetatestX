// src/pages/EmployeeProfile.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Calendar, Building, 
  Shield, Monitor, Briefcase, Edit, ArrowLeft,
  CheckCircle, AlertCircle, Clock, Star
} from "lucide-react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import UserDropdown from "../components/UserDropdown";
import DarkModeToggle from "../components/DarkModeToggle";
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
        reporting_manager:reporting_manager_id ( full_name, name, employee_id )
      `)
      .eq("id", id)
      .single();

    if (empError) {
      console.error("Error fetching employee:", empError.message);
      setLoading(false);
      return;
    }

    // Fetch additional access data from employee_access table if needed
    const { data: accessList } = await supabase
      .from("employee_access")
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
      // Use the JSONB fields from the employees table directly
      // The asset_list and access_list are already in empData as JSONB arrays
    });

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  if (loading) {
    return (
      <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 p-10">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 p-10">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-600 mb-2">Employee Not Found</h2>
              <p className="text-gray-500">The employee you're looking for doesn't exist.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAccessLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'semi-admin': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'viewer': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Helper function to safely handle JSONB arrays
  const getArrayData = (data) => {
    if (Array.isArray(data)) {
      return data;
    }
    if (typeof data === 'string') {
      // If it's a string, try to split by newlines or commas
      return data.split(/[\n,]/).filter(item => item.trim() !== '');
    }
    return [];
  };

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Link
                to="/employees"
                className="p-2 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-800">Employee Profile</h1>
                <p className="text-gray-600">View and manage employee information</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <UserDropdown />
            </div>
          </div>

          {/* Main Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          >
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
              <div className="flex items-center gap-6">
                <div className="relative">
                  {(employee.profile_picture || employee.photo_url) ? (
                    <img
                      src={employee.profile_picture || employee.photo_url}
                      alt={employee.full_name || employee.name}
                      className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center">
                      <Avatar
                        name={employee.full_name || employee.name}
                        size="96"
                        round
                        color="#ffffff"
                        textSizeRatio={2}
                        fgColor="#4F46E5"
                      />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{employee.full_name || employee.name}</h2>
                  <p className="text-xl text-blue-100 mb-1">
                    {employee.position || employee.designation} — {employee.department}
                  </p>
                  <div className="flex items-center gap-4 text-blue-100">
                    <span className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {employee.employee_id}
                    </span>
                    {employee.status && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(employee.status)}`}>
                        {employee.status}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/employee/${employee.id}/edit`}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 border border-white/30"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Link>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-8">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{employee.email || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-800">{employee.phone || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Join Date</p>
                    <p className="font-medium text-gray-800">
                      {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'Not provided'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <MapPin className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-800">{employee.location || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {employee.summary && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <User className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Summary</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{employee.summary}</p>
                </motion.div>
              )}

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Key Roles */}
                  {getArrayData(employee.key_roles).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Star className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">Key Roles</h3>
                      </div>
                      <ul className="space-y-2">
                        {getArrayData(employee.key_roles).map((role, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{role}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Responsibilities */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">Responsibilities</h3>
                    </div>
                    <ul className="space-y-2">
                      {getArrayData(employee.responsibilities).length > 0 ? (
                        getArrayData(employee.responsibilities).map((res, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{res}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500 italic">No responsibilities assigned</li>
                      )}
                    </ul>
                  </motion.div>

                  {/* Scopes */}
                  {getArrayData(employee.scopes).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-100"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <Briefcase className="w-5 h-5 text-teal-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">Job Scopes</h3>
                      </div>
                      <ul className="space-y-2">
                        {getArrayData(employee.scopes).map((scope, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{scope}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* System Access */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Shield className="w-5 h-5 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">System Access</h3>
                    </div>
                    <div className="space-y-2">
                      {getArrayData(employee.access_list).length > 0 ? (
                        getArrayData(employee.access_list).map((access, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                            <span className="font-medium text-gray-800">{access}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 italic">No system access assigned</div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Extra Duties */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Star className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">Extra Duties</h3>
                    </div>
                    <ul className="space-y-2">
                      {getArrayData(employee.duties).length > 0 ? (
                        getArrayData(employee.duties).map((duty, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{duty}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500 italic">No extra duties assigned</li>
                      )}
                    </ul>
                  </motion.div>

                  {/* Extra Responsibilities */}
                  {getArrayData(employee.extra_responsibilities).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border border-pink-100"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <Briefcase className="w-5 h-5 text-pink-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">Extra Responsibilities</h3>
                      </div>
                      <ul className="space-y-2">
                        {getArrayData(employee.extra_responsibilities).map((resp, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Asset List */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-100"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Monitor className="w-5 h-5 text-orange-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">Asset Assignments</h3>
                    </div>
                    <div className="space-y-2">
                      {getArrayData(employee.asset_list).length > 0 ? (
                        getArrayData(employee.asset_list).map((asset, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                            <span className="font-medium text-gray-800">{asset}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 italic">No assets assigned</div>
                      )}
                    </div>
                  </motion.div>

                  {/* Key Roles Detailed */}
                  {getArrayData(employee.key_roles_detailed).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-100"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Star className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">Detailed Key Roles</h3>
                      </div>
                      <ul className="space-y-2">
                        {getArrayData(employee.key_roles_detailed).map((role, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{role}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              {employee.reporting_manager && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Reporting Manager</h3>
                  </div>
                  <p className="text-gray-700">
                    {employee.reporting_manager.full_name || employee.reporting_manager.name} ({employee.reporting_manager.employee_id})
                  </p>
                </motion.div>
              )}

              {/* Auth User Information */}
              {employee.auth_user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mt-6 p-6 bg-blue-50 rounded-xl border border-blue-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">System Access</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-800">{employee.auth_user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Role</p>
                      <p className="font-medium text-gray-800">{employee.auth_user.role || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${
                        employee.auth_user.is_verified 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }`}>
                        {employee.auth_user.is_verified ? "Verified" : "Unverified"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

