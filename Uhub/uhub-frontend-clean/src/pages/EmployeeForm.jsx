import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Calendar, Building, 
  Shield, Monitor, Briefcase, Edit, ArrowLeft,
  CheckCircle, AlertCircle, Clock, Star, Save, X,
  Plus, Trash2, Eye, EyeOff, Upload, Download,
  BriefcaseIcon, Users, Target, Award, Key,
  Smartphone, Laptop, Car, Package, CreditCard,
  Globe, MapPinIcon, PhoneCall, MailOpen, Lock
} from "lucide-react";
import { clearImageCache, forceRefreshEmployeeImages } from "../utils/imageUtils";
import { useAuth } from "../context/AuthContext";
import { canEditEmployees, getPermissionDeniedMessage } from "../utils/permissions";

export default function EmployeeForm() {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role;
  
  // Check if user can edit employees
  const canEdit = canEditEmployees(userRole);
  
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
    // Additional fields from your database schema
    salary: "",
    experience_level: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    next_of_kin_name: "",
    next_of_kin_phone: "",
    next_of_kin_relationship: "",
    skills: "",
    certifications: "",
    training_records: "",
    goals: "",
    performance_rating: "",
    termination_date: "",
    data_completeness_score: "",
    manager_id: "",
    hr_data: "",
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
        try {
          console.log('Fetching employee with ID:', id);
          
          // First, check if we can access the employees table at all
          const { data: testData, error: testError } = await supabase
            .from("employees")
            .select("id")
            .limit(1);
          
          if (testError) {
            console.error("Cannot access employees table:", testError);
            setError(`Cannot access employees table: ${testError.message}. This might be a Row Level Security (RLS) issue.`);
            setLoading(false);
            return;
          }
          
          console.log('Can access employees table, test data:', testData);
          
          const { data, error } = await supabase
            .from("employees")
            .select(`
              *,
              reporting_manager:reporting_manager_id ( id, full_name, name, employee_id )
            `)
            .eq("id", id)
            .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors

          if (error) {
            console.error("Error fetching employee:", error);
            
            // Handle specific RLS errors
            if (error.code === '42501') {
              setError("Permission denied: You don't have permission to access this employee record. This might be due to Row Level Security (RLS) policies.");
            } else if (error.code === 'PGRST116') {
              setError("Employee not found: The employee record you're trying to edit doesn't exist or has been deleted.");
            } else {
              setError(`Failed to load employee data: ${error.message}`);
            }
            setLoading(false);
            return;
          }

          if (!data) {
            console.error("No employee data returned for ID:", id);
            setError("Employee not found. Please check the URL and try again.");
            setLoading(false);
            return;
          }

          console.log('Employee data fetched successfully:', data);

          // Helper function to safely convert JSONB arrays to strings
          const safeJsonbToString = (field) => {
            if (!field) return "";
            if (Array.isArray(field)) return field.join('\n');
            if (typeof field === 'string') return field;
            return "";
          };

          // Convert JSONB fields to strings for form display
          const processedData = {
            ...data,
            phone: data.phone || "",
            hire_date: data.hire_date || "",
            location: data.location || "",
            scopes: safeJsonbToString(data.scopes),
            responsibilities: safeJsonbToString(data.responsibilities),
            duties: safeJsonbToString(data.duties),
            access_list: safeJsonbToString(data.access_list),
            asset_list: safeJsonbToString(data.asset_list),
            key_roles: safeJsonbToString(data.key_roles),
            extra_responsibilities: safeJsonbToString(data.extra_responsibilities),
            key_roles_detailed: safeJsonbToString(data.key_roles_detailed),
            reporting_manager_id: data.reporting_manager_id || "",
            // Handle new fields
            salary: data.salary || "",
            experience_level: data.experience_level || "",
            emergency_contact_name: data.emergency_contact_name || "",
            emergency_contact_phone: data.emergency_contact_phone || "",
            emergency_contact_relationship: data.emergency_contact_relationship || "",
            next_of_kin_name: data.next_of_kin_name || "",
            next_of_kin_phone: data.next_of_kin_phone || "",
            next_of_kin_relationship: data.next_of_kin_relationship || "",
            skills: safeJsonbToString(data.skills),
            certifications: safeJsonbToString(data.certifications),
            training_records: safeJsonbToString(data.training_records),
            goals: safeJsonbToString(data.goals),
            performance_rating: data.performance_rating || "",
            termination_date: data.termination_date || "",
            data_completeness_score: data.data_completeness_score || "",
            manager_id: data.manager_id || "",
            hr_data: data.hr_data || ""
          };
          setFormData(processedData);
        } catch (err) {
          console.error("Unexpected error fetching employee:", err);
          setError("An unexpected error occurred while loading employee data.");
        } finally {
          setLoading(false);
        }
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
        if (!field || typeof field !== 'string') return [];
        return field.split('\n').filter(item => item.trim() !== '');
      };

      // Helper function to safely handle JSONB data
      const safeJsonbProcess = (field) => {
        if (!field) return [];
        if (Array.isArray(field)) return field;
        if (typeof field === 'string') {
          return field.split('\n').filter(item => item.trim() !== '');
        }
        return [];
      };

              // Prepare data for submission
        const submitData = {
          ...formData,
          phone: formData.phone || null,
          hire_date: formData.hire_date || null,
          location: formData.location || null,
          scopes: safeJsonbProcess(formData.scopes),
          responsibilities: safeJsonbProcess(formData.responsibilities),
          duties: safeJsonbProcess(formData.duties),
          access_list: safeJsonbProcess(formData.access_list),
          asset_list: safeJsonbProcess(formData.asset_list),
          key_roles: safeJsonbProcess(formData.key_roles),
          extra_responsibilities: safeJsonbProcess(formData.extra_responsibilities),
          key_roles_detailed: safeJsonbProcess(formData.key_roles_detailed),
          reporting_manager_id: formData.reporting_manager_id || null,
          // Use name field if full_name is empty
          name: formData.name || formData.full_name,
          // Handle profile picture fields properly
          profile_picture: formData.profile_picture || null,
          photo_url: formData.photo_url || null,
          // Handle new fields
          salary: formData.salary ? parseFloat(formData.salary) : null,
          performance_rating: formData.performance_rating ? parseFloat(formData.performance_rating) : null,
          data_completeness_score: formData.data_completeness_score ? parseInt(formData.data_completeness_score) : null,
          skills: safeJsonbProcess(formData.skills),
          certifications: safeJsonbProcess(formData.certifications),
          training_records: safeJsonbProcess(formData.training_records),
          goals: safeJsonbProcess(formData.goals)
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
        console.log('Updating employee with ID:', id);
        console.log('Update data:', submitData);
        
        response = await supabase
          .from("employees")
          .update(submitData)
          .eq("id", id)
          .select()
          .single();
      } else {
        // Insert
        console.log('Creating new employee');
        console.log('Insert data:', submitData);
        
        response = await supabase
          .from("employees")
          .insert([submitData])
          .select()
          .single();
      }

      if (response.error) {
        console.error("Database response error:", response.error);
        
        // Handle specific RLS and permission errors
        if (response.error.code === '42501') {
          throw new Error("Permission denied: You don't have permission to modify this employee record. This might be due to Row Level Security (RLS) policies.");
        } else if (response.error.code === '23505') {
          throw new Error("Duplicate entry: An employee with this email or employee ID already exists.");
        } else if (response.error.code === '23503') {
          throw new Error("Reference error: The selected reporting manager does not exist.");
        } else if (response.error.code === '23514') {
          throw new Error("Validation error: Please check that all required fields are filled correctly.");
        } else if (response.error.message) {
          throw new Error(`Database error: ${response.error.message}`);
        } else {
          throw response.error;
        }
      }

      if (!response.data) {
        console.error("No data returned from update operation");
        console.error("Response:", response);
        
        // Check if this might be an RLS issue
        if (id) {
          // Try to fetch the employee to see if it exists and we have access
          const { data: checkData, error: checkError } = await supabase
            .from("employees")
            .select("id, full_name, email")
            .eq("id", id)
            .single();
          
          if (checkError) {
            if (checkError.code === '42501') {
              throw new Error("Permission denied: You don't have permission to access this employee record. This might be due to Row Level Security (RLS) policies.");
            } else if (checkError.code === 'PGRST116') {
              throw new Error("Employee not found: The employee record you're trying to edit doesn't exist or has been deleted.");
            } else {
              throw new Error(`Cannot access employee record: ${checkError.message}`);
            }
          }
          
          if (!checkData) {
            throw new Error("Employee not found: The employee record you're trying to edit doesn't exist or has been deleted.");
          }
        }
        
        throw new Error("No data returned after employee operation. This might be due to Row Level Security (RLS) policies or the record not being found.");
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

  // Permission check - HR Managers cannot edit employees
  if (id && !canEdit) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
        <div className="flex-1 transition-all duration-300 ease-in-out">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-red-800 mb-4">
                Access Denied
              </h1>
              <p className="text-red-600 mb-6">
                {getPermissionDeniedMessage('update', userRole)}
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => navigate("/employees")}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Back to Employees
                </button>
                <button
                  onClick={() => navigate(`/employee/${id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  View Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            {/* Enhanced Profile Picture Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-b border-gray-200">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  {imagePreview || formData.profile_picture || formData.photo_url ? (
                    <img
                      key={`preview-${formData.profile_picture || formData.photo_url}`}
                      src={imagePreview || formData.profile_picture || formData.photo_url}
                      alt={formData.full_name || formData.name}
                      className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
                      data-employee-id={id || 'new'}
                      onError={(e) => {
                        console.log(`Failed to load preview image: ${formData.profile_picture || formData.photo_url}`);
                        e.target.style.display = 'none';
                        const container = e.target.parentElement;
                        if (container) {
                          container.innerHTML = `
                            <div class="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto border-4 border-white shadow-lg">
                              <span class="text-3xl font-bold text-blue-600">
                                ${(formData.full_name || formData.name || 'U')?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto border-4 border-white shadow-lg">
                      <span className="text-3xl font-bold text-blue-600">
                        {(formData.full_name || formData.name || 'U')?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                  
                  {/* Image Upload Button */}
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                    onClick={() => document.getElementById('profile-upload').click()}
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => setImagePreview(e.target.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {formData.full_name || formData.name || "New Employee"}
                </h2>
                <p className="text-gray-600">
                  {formData.position || formData.designation || "Position not specified"}
                </p>
                {formData.department && (
                  <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    <Building className="w-4 h-4" />
                    {formData.department}
                  </div>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
              <nav className="flex space-x-8 px-8" aria-label="Tabs">
                {[
                  { id: 'basic', label: 'Basic Info', icon: User },
                  { id: 'professional', label: 'Professional', icon: BriefcaseIcon },
                  { id: 'contact', label: 'Contact & Emergency', icon: PhoneCall },
                  { id: 'skills', label: 'Skills & Goals', icon: Award },
                  { id: 'access', label: 'System Access', icon: Shield },
                  { id: 'assets', label: 'Assets', icon: CreditCard },
                  { id: 'hr', label: 'HR Data', icon: Users }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
              
              {/* Progress Bar */}
              <div className="px-8 pb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${(() => {
                        const tabs = ['basic', 'professional', 'contact', 'skills', 'access', 'assets', 'hr'];
                        const currentIndex = tabs.indexOf(activeTab);
                        return ((currentIndex + 1) / tabs.length) * 100;
                      })()}%`
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Step {(() => {
                    const tabs = ['basic', 'professional', 'contact', 'skills', 'access', 'assets', 'hr'];
                    return tabs.indexOf(activeTab) + 1;
                  })()} of {7}</span>
                  <span>{Math.round((() => {
                    const tabs = ['basic', 'professional', 'contact', 'skills', 'access', 'assets', 'hr'];
                    const currentIndex = tabs.indexOf(activeTab);
                    return ((currentIndex + 1) / tabs.length) * 100;
                  })())}% Complete</span>
                </div>
              </div>
            </div>

            <div className="p-8">

              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'basic' && (
                    <motion.div
                      key="basic"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Basic Information
                        </h3>
                        <p className="text-blue-700 text-sm">Essential employee details and identification</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Full Name *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="full_name"
                              value={formData.full_name}
                              onChange={handleChange}
                              required
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              placeholder="Enter full name"
                            />
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Name (Alternative)
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Alternative name if different"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Email *
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              required
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              placeholder="employee@company.com"
                            />
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Phone
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="+971 XX XXX XXXX"
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Employee ID *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="employee_id"
                              value={formData.employee_id}
                              onChange={handleChange}
                              required
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              placeholder="EMP001"
                            />
                            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Department
                          </label>
                          <div className="relative">
                            <select
                              name="department"
                              value={formData.department}
                              onChange={handleChange}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                              <option value="">Select Department</option>
                              <option value="IT">IT</option>
                              <option value="HR">HR</option>
                              <option value="Finance">Finance</option>
                              <option value="Marketing">Marketing</option>
                              <option value="Sales">Sales</option>
                              <option value="Operations">Operations</option>
                              <option value="Customer Service">Customer Service</option>
                              <option value="Driver Management">Driver Management</option>
                            </select>
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Position
                          </label>
                          <input
                            type="text"
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="e.g., Senior Developer"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Designation
                          </label>
                          <input
                            type="text"
                            name="designation"
                            value={formData.designation}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="e.g., Team Lead"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Role
                          </label>
                          <input
                            type="text"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="e.g., Developer, Manager"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Hire Date
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              name="hire_date"
                              value={formData.hire_date}
                              onChange={handleChange}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Location
                          </label>
                          <div className="relative">
                            <select
                              name="location"
                              value={formData.location}
                              onChange={handleChange}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                              <option value="">Select Location</option>
                              <option value="In House">In House</option>
                              <option value="Remote">Remote</option>
                              <option value="Hybrid">Hybrid</option>
                            </select>
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Reporting Manager
                          </label>
                          <select
                            name="reporting_manager_id"
                            value={formData.reporting_manager_id}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="">Select Manager</option>
                            {managers.map((manager) => (
                              <option key={manager.id} value={manager.id}>
                                {manager.full_name || manager.name} ({manager.employee_id})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Auth User ID
                          </label>
                          <input
                            type="text"
                            name="auth_user_id"
                            value={formData.auth_user_id}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="UUID for authentication"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Profile Picture URL
                          </label>
                          <input
                            type="url"
                            name="profile_picture"
                            value={formData.profile_picture}
                            onChange={(e) => {
                              setFormData({ ...formData, profile_picture: e.target.value });
                              setImagePreview(null);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Photo URL (Alternative)
                          </label>
                          <input
                            type="url"
                            name="photo_url"
                            value={formData.photo_url}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Summary
                        </label>
                        <textarea
                          name="summary"
                          value={formData.summary}
                          onChange={handleChange}
                          rows="3"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Brief description of the employee's role and responsibilities..."
                        />
                      </div>
                                         </motion.div>
                   )}

                  {/* Professional Tab */}
                  {activeTab === 'professional' && (
                    <motion.div
                      key="professional"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                          <BriefcaseIcon className="w-5 h-5" />
                          Professional Information
                        </h3>
                        <p className="text-green-700 text-sm">Job-related details and responsibilities</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Salary
                          </label>
                          <input
                            type="number"
                            name="salary"
                            value={formData.salary}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Annual salary"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Experience Level
                          </label>
                          <select
                            name="experience_level"
                            value={formData.experience_level}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="">Select Experience Level</option>
                            <option value="Entry">Entry Level</option>
                            <option value="Junior">Junior</option>
                            <option value="Mid">Mid Level</option>
                            <option value="Senior">Senior</option>
                            <option value="Lead">Lead</option>
                            <option value="Principal">Principal</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Performance Rating
                          </label>
                          <input
                            type="number"
                            name="performance_rating"
                            value={formData.performance_rating}
                            onChange={handleChange}
                            min="0"
                            max="10"
                            step="0.1"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="0-10 rating"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Termination Date
                          </label>
                          <input
                            type="date"
                            name="termination_date"
                            value={formData.termination_date}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Reporting Manager (Text)
                          </label>
                          <input
                            type="text"
                            name="reporting_manager"
                            value={formData.reporting_manager}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Manager name as text"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Manager ID
                          </label>
                          <input
                            type="text"
                            name="manager_id"
                            value={formData.manager_id}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="UUID of manager"
                          />
                        </div>
                      </div>

                      {/* JSONB Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Scopes
                          </label>
                          <textarea
                            name="scopes"
                            value={formData.scopes}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter job scopes (one per line)..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Key Roles
                          </label>
                          <textarea
                            name="key_roles"
                            value={formData.key_roles}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter key roles (one per line)..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Key Roles Detailed
                          </label>
                          <textarea
                            name="key_roles_detailed"
                            value={formData.key_roles_detailed}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter detailed key roles (one per line)..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Responsibilities
                          </label>
                          <textarea
                            name="responsibilities"
                            value={formData.responsibilities}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter job responsibilities (one per line)..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Duties
                          </label>
                          <textarea
                            name="duties"
                            value={formData.duties}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter duties (one per line)..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Extra Responsibilities
                          </label>
                          <textarea
                            name="extra_responsibilities"
                            value={formData.extra_responsibilities}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter extra responsibilities (one per line)..."
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Contact & Emergency Tab */}
                  {activeTab === 'contact' && (
                    <motion.div
                      key="contact"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                          <PhoneCall className="w-5 h-5" />
                          Contact & Emergency Information
                        </h3>
                        <p className="text-purple-700 text-sm">Emergency contacts and next of kin details</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Emergency Contact Name
                          </label>
                          <input
                            type="text"
                            name="emergency_contact_name"
                            value={formData.emergency_contact_name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Emergency contact full name"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Emergency Contact Phone
                          </label>
                          <input
                            type="tel"
                            name="emergency_contact_phone"
                            value={formData.emergency_contact_phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Emergency contact phone"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Emergency Contact Relationship
                          </label>
                          <select
                            name="emergency_contact_relationship"
                            value={formData.emergency_contact_relationship}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="">Select Relationship</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Parent">Parent</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Child">Child</option>
                            <option value="Friend">Friend</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Next of Kin Name
                          </label>
                          <input
                            type="text"
                            name="next_of_kin_name"
                            value={formData.next_of_kin_name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Next of kin full name"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Next of Kin Phone
                          </label>
                          <input
                            type="tel"
                            name="next_of_kin_phone"
                            value={formData.next_of_kin_phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Next of kin phone"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Next of Kin Relationship
                          </label>
                          <select
                            name="next_of_kin_relationship"
                            value={formData.next_of_kin_relationship}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="">Select Relationship</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Parent">Parent</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Child">Child</option>
                            <option value="Friend">Friend</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Skills & Goals Tab */}
                  {activeTab === 'skills' && (
                    <motion.div
                      key="skills"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                          <Award className="w-5 h-5" />
                          Skills & Goals
                        </h3>
                        <p className="text-amber-700 text-sm">Employee skills, certifications, and career goals</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Skills
                          </label>
                          <textarea
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter skills (one per line)..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Certifications
                          </label>
                          <textarea
                            name="certifications"
                            value={formData.certifications}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter certifications (one per line)..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Training Records
                          </label>
                          <textarea
                            name="training_records"
                            value={formData.training_records}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter training records (one per line)..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Goals
                          </label>
                          <textarea
                            name="goals"
                            value={formData.goals}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter career goals (one per line)..."
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* System Access Tab */}
                  {activeTab === 'access' && (
                    <motion.div
                      key="access"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          System Access & Permissions
                        </h3>
                        <p className="text-indigo-700 text-sm">System access rights and permissions</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            System Access List
                          </label>
                          <textarea
                            name="access_list"
                            value={formData.access_list}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter system access permissions (one per line)..."
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Assets Tab */}
                  {activeTab === 'assets' && (
                    <motion.div
                      key="assets"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Asset Assignments
                        </h3>
                        <p className="text-emerald-700 text-sm">IT assets and equipment assigned to employee</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Asset List
                          </label>
                          <textarea
                            name="asset_list"
                            value={formData.asset_list}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter assigned assets (one per line)..."
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* HR Data Tab */}
                  {activeTab === 'hr' && (
                    <motion.div
                      key="hr"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-rose-900 mb-3 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          HR Data & Analytics
                        </h3>
                        <p className="text-rose-700 text-sm">HR-specific data and analytics</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Data Completeness Score
                          </label>
                          <input
                            type="number"
                            name="data_completeness_score"
                            value={formData.data_completeness_score}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="0-100 score"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            HR Data (JSON)
                          </label>
                          <textarea
                            name="hr_data"
                            value={formData.hr_data}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter HR data in JSON format..."
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                

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
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate("/employees")}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Employees
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({
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
                        salary: "",
                        experience_level: "",
                        emergency_contact_name: "",
                        emergency_contact_phone: "",
                        emergency_contact_relationship: "",
                        next_of_kin_name: "",
                        next_of_kin_phone: "",
                        next_of_kin_relationship: "",
                        skills: "",
                        certifications: "",
                        training_records: "",
                        goals: "",
                        performance_rating: "",
                        termination_date: "",
                        data_completeness_score: "",
                        manager_id: "",
                        hr_data: "",
                      })}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Reset Form
                    </button>
                    
                                         <button
                       type="submit"
                       disabled={loading || !canEdit}
                       className={`px-8 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-lg ${
                         canEdit 
                           ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                           : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                       } ${loading ? 'opacity-50' : ''}`}
                     >
                       {loading ? (
                         <>
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                           {id ? "Updating..." : "Creating..."}
                         </>
                       ) : !canEdit ? (
                         <>
                           <Lock className="w-4 h-4" />
                           {id ? "Edit Not Allowed" : "Create Not Allowed"}
                         </>
                       ) : (
                         <>
                           <Save className="w-4 h-4" />
                           {id ? "Update Employee" : "Create Employee"}
                         </>
                       )}
                     </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


