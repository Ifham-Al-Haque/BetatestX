import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";


import { motion } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Calendar, Building, 
  Shield, Monitor, Briefcase, Edit, ArrowLeft,
  CheckCircle, AlertCircle, Clock, Star, Save, X
} from "lucide-react";
import { clearImageCache, forceRefreshEmployeeImages } from "../utils/imageUtils";

export default function EmployeeForm() {
  
  const [formData, setFormData] = useState({
    full_name: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    designation: "",
    employee_id: "",
    role: "",
    reporting_manager_id: "",
    reporting_manager: "",
    hire_date: "",
    location: "",
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
          console.error("Error fetching employee:", error);
          if (error.code === 'PGRST116') {
            setError("Employee not found. Please check the URL and try again.");
          } else if (error.message) {
            setError(`Failed to load employee data: ${error.message}`);
          } else {
            setError("Failed to load employee data. Please try again.");
          }
          setLoading(false);
          return;
        }

        if (data) {
          // Convert JSONB fields to strings for form display
          const processedData = {
            ...data,
            phone: data.phone || "",
            hire_date: data.hire_date || "",
            location: data.location || "",
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
    let value = e.target.value;
    
    // Format phone number as user types
    if (e.target.name === 'phone') {
      // Remove all non-digit characters except +
      value = value.replace(/[^\d+]/g, '');
      
      // Ensure it starts with +971 for UAE format
      if (value && !value.startsWith('+971')) {
        if (value.startsWith('971')) {
          value = '+' + value;
        } else if (value.startsWith('0')) {
          value = '+971' + value.substring(1);
        } else if (!value.startsWith('+')) {
          value = '+971' + value;
        }
      }
    }
    
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Basic validation
    if (!formData.full_name?.trim()) {
      setError("Full Name is required.");
      return;
    }
    
    if (!formData.email?.trim()) {
      setError("Email is required.");
      return;
    }
    
    if (!formData.employee_id?.trim()) {
      setError("Employee ID is required.");
      return;
    }
    
    // Phone number validation (if provided)
    if (formData.phone && !formData.phone.match(/^\+971\d{9}$/)) {
      setError("Phone number must be in UAE format: +971XXXXXXXXX");
      return;
    }
    
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

          if (checkError) {
            console.error("Duplicate check error:", checkError);
            throw new Error(`Failed to check for duplicates: ${checkError.message}`);
          }

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
        phone: formData.phone || null,
        hire_date: formData.hire_date || null,
        location: formData.location || null,
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
        // Handle profile picture fields properly
        profile_picture: formData.profile_picture || null,
        photo_url: formData.photo_url || null
      };

      // Remove empty fields that might cause UUID errors
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === "" || submitData[key] === null) {
          delete submitData[key];
        }
      });

      // Store old values for cache clearing
      let oldProfilePicture = null;
      let oldPhotoUrl = null;
      
      // Explicitly handle profile picture fields - set to null if empty
      if (formData.profile_picture === "") {
        oldProfilePicture = formData.profile_picture;
        submitData.profile_picture = null;
      }
      if (formData.photo_url === "") {
        oldPhotoUrl = formData.photo_url;
        submitData.photo_url = null;
      }

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

      if (response.error) {
        console.error("Database response error:", response.error);
        throw response.error;
      }

      if (!response.data) {
        setError("No data returned after employee creation.");
        setLoading(false);
        return;
      }

      setSuccess(`Employee ${id ? "updated" : "created"} successfully.`);
      
      // Force refresh the employee data to clear any cached images
      if (id) {
        // Clear any cached profile pictures
        if (oldProfilePicture || oldPhotoUrl) {
          // Force refresh all images for this employee
          forceRefreshEmployeeImages(id, oldProfilePicture || oldPhotoUrl);
        } else {
          setTimeout(() => navigate("/employees"), 1500);
        }
      } else {
        setTimeout(() => navigate("/employees"), 1500);
      }
    } catch (err) {
      console.error("Employee form error:", err);
      
      // Provide more specific error messages
      if (err.code === '23505') {
        setError("Duplicate entry: An employee with this email or employee ID already exists.");
      } else if (err.code === '23503') {
        setError("Reference error: The selected reporting manager does not exist.");
      } else if (err.code === '23514') {
        setError("Validation error: Please check that all required fields are filled correctly.");
      } else if (err.message) {
        setError(`Error: ${err.message}`);
      } else if (err.details) {
        setError(`Error: ${err.details}`);
      } else {
        setError("Something went wrong. Please check your input and try again.");
      }
    }
    setLoading(false);
  };

  if (loading && id) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
        
        <div className="flex-1 transition-all duration-300 ease-in-out" >
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
      
      <div className="flex-1 transition-all duration-300 ease-in-out" >
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
                  {(formData.profile_picture || formData.photo_url) ? (
                    <img
                      key={`preview-${formData.profile_picture || formData.photo_url}`}
                      src={formData.profile_picture || formData.photo_url}
                      alt={formData.full_name || formData.name}
                      className="w-24 h-24 rounded-full object-cover mx-auto"
                      data-employee-id={id || 'new'}
                      onError={(e) => {
                        console.log(`Failed to load preview image: ${formData.profile_picture || formData.photo_url}`);
                        // Fallback to Avatar with initials
                        e.target.style.display = 'none';
                        const container = e.target.parentElement;
                        if (container) {
                          container.innerHTML = `
                            <div class="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                              <span class="text-2xl font-medium text-blue-600">
                                ${(formData.full_name || formData.name || 'U')?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                          `;
                        }
                      }}
                      onLoad={() => {
                        console.log(`Successfully loaded preview image: ${formData.profile_picture || formData.photo_url}`);
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                      <span className="text-2xl font-medium text-blue-600">
                        {(formData.full_name || formData.name || 'U')?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
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
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+971 XX XXX XXXX"
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
                      Hire Date
                    </label>
                    <input
                      type="date"
                      name="hire_date"
                      value={formData.hire_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Location</option>
                      <option value="In House">In House</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
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
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {id ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {id ? "Update Employee" : "Create Employee"}
                      </>
                    )}
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


