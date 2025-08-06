import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import Sidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Calendar, Building, 
  Shield, Monitor, Briefcase, Edit, ArrowLeft,
  CheckCircle, AlertCircle, Clock, Star, Save, X
} from "lucide-react";
import Avatar from "react-avatar";

export default function EmployeeForm() {
  const { sidebarWidth } = useSidebar();
  const [formData, setFormData] = useState({
    full_name: "",
    name: "",
    email: "",
    department: "",
    position: "",
    designation: "",
    employee_id: "",
    role: "",
    reporting_manager_id: "",
    reporting_manager: "",
    scopes: "",
    responsibilities: "",
    duties: "",
    access_list: "",
    asset_list: "",
    profile_picture: "",
    photo_url: "",
    summary: "",
    key_roles: "",
    extra_responsibilities: "",
    key_roles_detailed: "",
    status: "active",
    auth_user_id: "",
  });

  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch managers for reporting manager dropdown
  useEffect(() => {
    async function fetchManagers() {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name, name, employee_id")
        .order("full_name");
      
      if (!error && data) {
        setManagers(data);
      }
    }
    fetchManagers();
  }, []);

  // Fetch employee data for editing
  useEffect(() => {
    async function fetchEmployee() {
      if (id) {
        setLoading(true);
        const { data, error } = await supabase
          .from("employees")
          .select(`
            *,
            reporting_manager:reporting_manager_id ( id, full_name, name, employee_id )
          `)
          .eq("id", id)
          .single();

        if (error) {
          setError("Failed to load employee data.");
          setLoading(false);
          return;
        }

        if (data) {
          // Convert JSONB fields to strings for form display
          const processedData = {
            ...data,
            scopes: Array.isArray(data.scopes) ? data.scopes.join('\n') : data.scopes || "",
            responsibilities: Array.isArray(data.responsibilities) ? data.responsibilities.join('\n') : data.responsibilities || "",
            duties: Array.isArray(data.duties) ? data.duties.join('\n') : data.duties || "",
            access_list: Array.isArray(data.access_list) ? data.access_list.join('\n') : data.access_list || "",
            asset_list: Array.isArray(data.asset_list) ? data.asset_list.join('\n') : data.asset_list || "",
            key_roles: Array.isArray(data.key_roles) ? data.key_roles.join('\n') : data.key_roles || "",
            extra_responsibilities: Array.isArray(data.extra_responsibilities) ? data.extra_responsibilities.join('\n') : data.extra_responsibilities || "",
            key_roles_detailed: Array.isArray(data.key_roles_detailed) ? data.key_roles_detailed.join('\n') : data.key_roles_detailed || "",
            reporting_manager_id: data.reporting_manager_id || ""
          };
          setFormData(processedData);
        }
        setLoading(false);
      }
    }

    fetchEmployee();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Check for duplicates if not editing
      if (!id) {
        let duplicateQuery = supabase
          .from("employees")
          .select("id");

        // Build OR conditions only for non-empty fields
        const conditions = [];
        if (formData.email) {
          conditions.push(`email.eq.${formData.email}`);
        }
        if (formData.employee_id) {
          conditions.push(`employee_id.eq.${formData.employee_id}`);
        }

        // Only check for duplicates if we have valid fields to check
        if (conditions.length > 0) {
          duplicateQuery = duplicateQuery.or(conditions.join(','));
          const { data: existing, error: checkError } = await duplicateQuery;

          if (checkError) throw checkError;

          if (existing && existing.length > 0) {
            setError("Employee with this email or employee ID already exists.");
            setLoading(false);
            return;
          }
        }
      }

      // Process JSONB fields - convert newline-separated strings to arrays
      const processJsonbField = (field) => {
        if (!field) return [];
        return field.split('\n').filter(item => item.trim() !== '');
      };

      // Prepare data for submission
      const submitData = {
        ...formData,
        scopes: processJsonbField(formData.scopes),
        responsibilities: processJsonbField(formData.responsibilities),
        duties: processJsonbField(formData.duties),
        access_list: processJsonbField(formData.access_list),
        asset_list: processJsonbField(formData.asset_list),
        key_roles: processJsonbField(formData.key_roles),
        extra_responsibilities: processJsonbField(formData.extra_responsibilities),
        key_roles_detailed: processJsonbField(formData.key_roles_detailed),
        reporting_manager_id: formData.reporting_manager_id || null,
        // Use name field if full_name is empty
        name: formData.name || formData.full_name,
        // Use photo_url if profile_picture is empty
        photo_url: formData.photo_url || formData.profile_picture
      };

      // Remove empty fields that might cause UUID errors
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === "" || submitData[key] === null) {
          delete submitData[key];
        }
      });

      let response;
      if (id) {
        // Update
        response = await supabase
          .from("employees")
          .update(submitData)
          .eq("id", id)
          .select()
          .single();
      } else {
        // Insert
        response = await supabase
          .from("employees")
          .insert([submitData])
          .select()
          .single();
      }

      if (response.error) throw response.error;

      if (!response.data) {
        setError("No data returned after employee creation.");
        setLoading(false);
        return;
      }

      setSuccess(`Employee ${id ? "updated" : "created"} successfully.`);
      setTimeout(() => navigate("/employees"), 1500);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  if (loading && id) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
        <Sidebar />
        <div className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: `${sidebarWidth}px` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <Sidebar />
      <div className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: `${sidebarWidth}px` }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/employees")}
                className="p-2 bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-800">
                  {id ? "Edit Employee" : "New Employee"}
                </h1>
                <p className="text-gray-600">
                  {id ? "Update employee information" : "Add a new employee to the system"}
                </p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          >
            <div className="p-8">
              {/* Profile Picture Section */}
              {(formData.profile_picture || formData.photo_url) && (
                <div className="mb-6 text-center">
                  <Avatar
                    name={formData.full_name || formData.name}
                    src={formData.profile_picture || formData.photo_url}
                    size="100"
                    round
                    className="mx-auto"
                  />
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name (Alternative)
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee ID *
                    </label>
                    <input
                      type="text"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designation
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reporting Manager
                    </label>
                    <select
                      name="reporting_manager_id"
                      value={formData.reporting_manager_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Manager</option>
                      {managers.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.full_name || manager.name} ({manager.employee_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reporting Manager (Text)
                    </label>
                    <input
                      type="text"
                      name="reporting_manager"
                      value={formData.reporting_manager}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auth User ID
                    </label>
                    <input
                      type="text"
                      name="auth_user_id"
                      value={formData.auth_user_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture URL
                    </label>
                    <input
                      type="url"
                      name="profile_picture"
                      value={formData.profile_picture}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Photo URL (Alternative)
                    </label>
                    <input
                      type="url"
                      name="photo_url"
                      value={formData.photo_url}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Summary
                  </label>
                  <textarea
                    name="summary"
                    value={formData.summary}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter employee summary..."
                  />
                </div>

                {/* JSONB Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scopes
                    </label>
                    <textarea
                      name="scopes"
                      value={formData.scopes}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter job scopes (one per line)..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Roles
                    </label>
                    <textarea
                      name="key_roles"
                      value={formData.key_roles}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter key roles (one per line)..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Roles Detailed
                    </label>
                    <textarea
                      name="key_roles_detailed"
                      value={formData.key_roles_detailed}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter detailed key roles (one per line)..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsibilities
                    </label>
                    <textarea
                      name="responsibilities"
                      value={formData.responsibilities}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter job responsibilities (one per line)..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Extra Duties
                    </label>
                    <textarea
                      name="duties"
                      value={formData.duties}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter extra duties (one per line)..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Extra Responsibilities
                    </label>
                    <textarea
                      name="extra_responsibilities"
                      value={formData.extra_responsibilities}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter extra responsibilities (one per line)..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      System Access
                    </label>
                    <textarea
                      name="access_list"
                      value={formData.access_list}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter system access (one per line)..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asset Assignments
                    </label>
                    <textarea
                      name="asset_list"
                      value={formData.asset_list}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter assigned assets (one per line)..."
                    />
                  </div>
                </div>

                {/* Error and Success Messages */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-green-600">{success}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? "Saving..." : (id ? "Update Employee" : "Create Employee")}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => navigate("/employees")}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


