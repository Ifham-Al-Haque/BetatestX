import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import Sidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Calendar, Building, 
  Shield, Monitor, Briefcase, Edit, ArrowLeft,
  CheckCircle, AlertCircle, Clock, Star, Save, X,
  Car, Upload, FileText, Camera, BookOpen, CreditCard
} from "lucide-react";

export default function DriverForm() {
  const { sidebarWidth } = useSidebar();
  const [formData, setFormData] = useState({
    full_name: "",
    designation: "",
    nationality: "",
    company_mobile: "",
    personal_mobile: "",
    emirates_id_no: "",
    driving_license_no: "",
    udrive_customer_account_id: "",
    service_car_plate: "",
    team_type: "",
    team_name: "",
    team_members: "",
    shift_type: "Day",
    profile_picture: "",
    status: "active",
    employee_id: "",
    udrive_email: "",
    udrive_password: "",
    zimyo_email: "",
    zimyo_password: "",
  });

  const [documents, setDocuments] = useState({
    emirates_id_front: "",
    emirates_id_back: "",
    driving_license_front: "",
    driving_license_back: "",
    passport_copy: "",
    passport_number: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch driver data for editing
  useEffect(() => {
    async function fetchDriver() {
      if (id) {
        setLoading(true);
        const { data, error } = await supabase
          .from("drivers")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          setError("Failed to load driver data.");
          setLoading(false);
          return;
        }

        if (data) {
          setFormData(data);
          
          // Fetch documents if they exist
          if (data.id) {
            const { data: docsData } = await supabase
              .from("driver_documents")
              .select("*")
              .eq("driver_id", data.id);
            
            if (docsData && docsData.length > 0) {
              // Convert array of documents to the expected format
              const docsMap = {};
              docsData.forEach(doc => {
                docsMap[doc.document_type] = doc.document_url;
                if (doc.document_type === 'passport_copy') {
                  docsMap.passport_number = doc.passport_number;
                }
              });
              setDocuments(docsMap);
            }
          }
        }
        setLoading(false);
      }
    }
    fetchDriver();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDocumentChange = (e) => {
    const { name, value } = e.target;
    setDocuments(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `drivers/${id || 'new'}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('driver-profiles')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('driver-profiles')
        .getPublicUrl(filePath);

      // Update form data
      setFormData(prev => ({
        ...prev,
        [field]: publicUrl
      }));

    } catch (error) {
      setError(`Failed to upload image: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `drivers/${id || 'new'}/documents/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('driver-documents')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('driver-documents')
        .getPublicUrl(filePath);

      // Update documents
      setDocuments(prev => ({
        ...prev,
        [field]: publicUrl
      }));

    } catch (error) {
      setError(`Failed to upload document: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let driverId = id;

      if (id) {
        // Update existing driver
        const { error } = await supabase
          .from("drivers")
          .update(formData)
          .eq("id", id);

        if (error) throw error;
      } else {
        // Create new driver
        const { data, error } = await supabase
          .from("drivers")
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        driverId = data.id;
      }

      // Save documents
      if (driverId) {
        // Delete existing documents first
        await supabase
          .from("driver_documents")
          .delete()
          .eq("driver_id", driverId);

        // Insert new documents
        const documentsToInsert = [];
        
        if (documents.emirates_id_front) {
          documentsToInsert.push({
            driver_id: driverId,
            document_type: 'emirates_id_front',
            document_url: documents.emirates_id_front,
            passport_number: documents.passport_number
          });
        }
        
        if (documents.emirates_id_back) {
          documentsToInsert.push({
            driver_id: driverId,
            document_type: 'emirates_id_back',
            document_url: documents.emirates_id_back,
            passport_number: documents.passport_number
          });
        }
        
        if (documents.driving_license_front) {
          documentsToInsert.push({
            driver_id: driverId,
            document_type: 'driving_license_front',
            document_url: documents.driving_license_front,
            passport_number: documents.passport_number
          });
        }
        
        if (documents.driving_license_back) {
          documentsToInsert.push({
            driver_id: driverId,
            document_type: 'driving_license_back',
            document_url: documents.driving_license_back,
            passport_number: documents.passport_number
          });
        }
        
        if (documents.passport_copy) {
          documentsToInsert.push({
            driver_id: driverId,
            document_type: 'passport_copy',
            document_url: documents.passport_copy,
            passport_number: documents.passport_number
          });
        }

        if (documentsToInsert.length > 0) {
          const { error: docError } = await supabase
            .from("driver_documents")
            .insert(documentsToInsert);

          if (docError) throw docError;
        }
      }

      setSuccess("Driver saved successfully!");
      setTimeout(() => {
        navigate("/drivers");
      }, 1500);

    } catch (error) {
      setError(`Failed to save driver: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen font-sans bg-gray-50 dark:bg-gray-900">
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

  return (
    <div className="min-h-screen font-sans bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-10">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/drivers")}
                  className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {id ? "Edit Driver" : "Add New Driver"}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {id ? "Update driver information and documents" : "Create a new driver record"}
                  </p>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-800">{success}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Basic Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Designation *
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nationality *
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  Contact Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Mobile Number *
                    </label>
                    <input
                      type="tel"
                      name="company_mobile"
                      value={formData.company_mobile}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Personal Mobile Number
                    </label>
                    <input
                      type="tel"
                      name="personal_mobile"
                      value={formData.personal_mobile}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Identification Documents */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  Identification Documents
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Emirates ID Number *
                    </label>
                    <input
                      type="text"
                      name="emirates_id_no"
                      value={formData.emirates_id_no}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Driving License Number *
                    </label>
                    <input
                      type="text"
                      name="driving_license_no"
                      value={formData.driving_license_no}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Udrive Customer Account ID
                    </label>
                    <input
                      type="text"
                      name="udrive_customer_account_id"
                      value={formData.udrive_customer_account_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Service Car Plate Number
                    </label>
                    <input
                      type="text"
                      name="service_car_plate"
                      value={formData.service_car_plate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Team Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-600" />
                  Team Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Team Type
                    </label>
                    <input
                      type="text"
                      name="team_type"
                      value={formData.team_type}
                      onChange={handleInputChange}
                      placeholder="e.g., Delivery, Transport, etc."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Team Name
                    </label>
                    <input
                      type="text"
                      name="team_name"
                      value={formData.team_name}
                      onChange={handleInputChange}
                      placeholder="e.g., Team Alpha, Team Beta"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Team Members
                    </label>
                    <textarea
                      name="team_members"
                      value={formData.team_members}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="List team members or describe team structure..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Shift Type *
                    </label>
                    <select
                      name="shift_type"
                      value={formData.shift_type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Day">Day</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Access Credentials */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600" />
                  Access Credentials
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Udrive Credentials */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Car className="w-5 h-5 text-blue-600" />
                      Udrive Company Credentials
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company Email
                      </label>
                      <input
                        type="email"
                        name="udrive_email"
                        value={formData.udrive_email}
                        onChange={handleInputChange}
                        placeholder="driver@udrive.com"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company Password
                      </label>
                      <input
                        type="password"
                        name="udrive_password"
                        value={formData.udrive_password}
                        onChange={handleInputChange}
                        placeholder="Enter Udrive password"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Zimyo Credentials */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-green-600" />
                      Zimyo Platform Credentials
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Zimyo Email
                      </label>
                      <input
                        type="email"
                        name="zimyo_email"
                        value={formData.zimyo_email}
                        onChange={handleInputChange}
                        placeholder="driver@zimyo.com"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Zimyo Password
                      </label>
                      <input
                        type="password"
                        name="zimyo_password"
                        value={formData.zimyo_password}
                        onChange={handleInputChange}
                        placeholder="Enter Zimyo password"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Profile Picture */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-pink-600" />
                  Profile Picture
                </h2>
                
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    {formData.profile_picture ? (
                      <img
                        src={formData.profile_picture}
                        alt="Profile"
                        className="h-24 w-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload Profile Picture
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'profile_picture')}
                      disabled={uploading}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                  </div>
                </div>
              </motion.div>

              {/* Document Uploads */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  Document Uploads
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Emirates ID */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      Emirates ID
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Front Side
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleDocumentUpload(e, 'emirates_id_front')}
                        disabled={uploading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                      {documents.emirates_id_front && (
                        <a href={documents.emirates_id_front} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                          View uploaded document
                        </a>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Back Side
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleDocumentUpload(e, 'emirates_id_back')}
                        disabled={uploading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                      {documents.emirates_id_back && (
                        <a href={documents.emirates_id_back} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                          View uploaded document
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Driving License */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Car className="w-5 h-5 text-green-600" />
                      Driving License
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Front Side
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleDocumentUpload(e, 'driving_license_front')}
                        disabled={uploading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                      {documents.driving_license_front && (
                        <a href={documents.driving_license_front} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                          View uploaded document
                        </a>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Back Side
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleDocumentUpload(e, 'driving_license_back')}
                        disabled={uploading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                      {documents.driving_license_back && (
                        <a href={documents.driving_license_back} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                          View uploaded document
                        </a>
                      )}
                    </div>
                  </div>

                                     {/* Passport */}
                   <div className="md:col-span-2 space-y-4">
                     <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                       Passport Information
                     </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Passport Number
                        </label>
                        <input
                          type="text"
                          name="passport_number"
                          value={documents.passport_number}
                          onChange={handleDocumentChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Passport Copy
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleDocumentUpload(e, 'passport_copy')}
                          disabled={uploading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                        {documents.passport_copy && (
                          <a href={documents.passport_copy} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                            View uploaded document
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="flex justify-end gap-4"
              >
                <button
                  type="button"
                  onClick={() => navigate("/drivers")}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {id ? "Update Driver" : "Create Driver"}
                    </>
                  )}
                </button>
              </motion.div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
