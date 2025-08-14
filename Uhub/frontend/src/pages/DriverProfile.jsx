import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Calendar, Building, 
  Shield, Monitor, Briefcase, Edit, ArrowLeft,
  CheckCircle, AlertCircle, Clock, Star, Car,
  FileText, Download, Eye, EyeOff, CreditCard
} from "lucide-react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import UserDropdown from "../components/UserDropdown";
import DarkModeToggle from "../components/DarkModeToggle";

export default function DriverProfile() {
  const { id } = useParams();
  const [driver, setDriver] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUdrivePassword, setShowUdrivePassword] = useState(false);
  const [showZimyoPassword, setShowZimyoPassword] = useState(false);

  const toggleUdrivePassword = useCallback(() => {
    setShowUdrivePassword(prev => !prev);
  }, []);

  const toggleZimyoPassword = useCallback(() => {
    setShowZimyoPassword(prev => !prev);
  }, []);

  const fetchDriver = useCallback(async () => {
    setLoading(true);

    const { data: driverData, error: driverError } = await supabase
      .from("drivers")
      .select("*")
      .eq("id", id)
      .single();

    if (driverError) {
      console.error("Error fetching driver:", driverError.message);
      setLoading(false);
      return;
    }

    // Fetch driver documents
    const { data: docsData } = await supabase
      .from("driver_documents")
      .select("*")
      .eq("driver_id", id);

    setDriver(driverData);
    
    // Convert documents array to the expected format
    if (docsData && docsData.length > 0) {
      const docsMap = {};
      docsData.forEach(doc => {
        docsMap[doc.document_type] = doc.document_url;
        if (doc.document_type === 'passport_copy') {
          docsMap.passport_number = doc.passport_number;
        }
      });
      setDocuments(docsMap);
    } else {
      setDocuments({});
    }
    
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchDriver();
  }, [fetchDriver]);

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

  if (!driver) {
    return (
      <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 p-10">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-600 mb-2">Driver Not Found</h2>
              <p className="text-gray-500">The driver you're looking for doesn't exist.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getShiftColor = (shiftType) => {
    return shiftType === 'Day' 
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  };

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-10">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Link
                  to="/drivers"
                  className="p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Driver Profile
                  </h1>
                  <p className="text-gray-600 mt-1">
                    View and manage driver information
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <DarkModeToggle />
                <UserDropdown />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Profile Card */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-xl shadow-sm p-6 sticky top-8"
                >
                  {/* Profile Picture */}
                  <div className="text-center mb-6">
                    {driver.profile_picture ? (
                      <img
                        src={driver.profile_picture}
                        alt={driver.full_name}
                        className="w-32 h-32 rounded-full mx-auto border-4 border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full mx-auto border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                        <Car className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                    <h2 className="text-2xl font-bold text-gray-900 mt-4">
                      {driver.full_name}
                    </h2>
                    <p className="text-gray-600">{driver.designation}</p>
                    
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                        {driver.status}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getShiftColor(driver.shift_type)}`}>
                        {driver.shift_type} Shift
                      </span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <Link
                      to={`/driver/${id}/edit`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Driver
                    </Link>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-6 space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                    
                    {driver.company_mobile && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-green-600" />
                        <span>Company: {driver.company_mobile}</span>
                      </div>
                    )}
                    
                    {driver.personal_mobile && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <span>Personal: {driver.personal_mobile}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Right Column - Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                      <p className="text-gray-900 font-medium">{driver.full_name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Employee ID</label>
                      <p className="text-gray-900">{driver.employee_id || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Designation</label>
                      <p className="text-gray-900">{driver.designation}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Nationality</label>
                      <p className="text-gray-900">{driver.nationality}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Identification & Documents */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    Identification & Documents
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Emirates ID Number</label>
                      <p className="text-gray-900 font-mono">{driver.emirates_id_no}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Driving License Number</label>
                      <p className="text-gray-900 font-mono">{driver.driving_license_no}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Udrive Customer Account ID</label>
                      <p className="text-gray-900">{driver.udrive_customer_account_id || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Service Car Plate</label>
                      <p className="text-gray-900 font-mono">{driver.service_car_plate || 'N/A'}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Team Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-indigo-600" />
                    Team Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Team Type</label>
                      <p className="text-gray-900">{driver.team_type || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Team Name</label>
                      <p className="text-gray-900">{driver.team_name || 'N/A'}</p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Team Members</label>
                      <p className="text-gray-900">{driver.team_members || 'N/A'}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Access Credentials */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-600" />
                    Access Credentials
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Udrive Credentials */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <Car className="w-4 h-4 text-blue-600" />
                        Udrive Company Credentials
                      </h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Company Email</label>
                        <p className="text-gray-900 font-mono">{driver.udrive_email || 'N/A'}</p>
                      </div>
                      
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Company Password</label>
                        <div className="relative">
                          <p className="text-gray-900 font-mono pr-10">
                            {driver.udrive_password ? 
                              (showUdrivePassword ? driver.udrive_password : '••••••••') 
                              : 'N/A'
                            }
                          </p>
                          {driver.udrive_password && (
                            <button
                              type="button"
                              onClick={toggleUdrivePassword}
                              className="absolute top-0 right-0 p-1 text-gray-500 hover:text-gray-700 transition-colors"
                              title={showUdrivePassword ? "Hide password" : "Show password"}
                            >
                              {showUdrivePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Zimyo Credentials */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-green-600" />
                        Zimyo Platform Credentials
                      </h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Zimyo Email</label>
                        <p className="text-gray-900 font-mono">{driver.zimyo_email || 'N/A'}</p>
                      </div>
                      
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Zimyo Password</label>
                        <div className="relative">
                          <p className="text-gray-900 font-mono pr-10">
                            {driver.zimyo_password ? 
                              (showZimyoPassword ? driver.zimyo_password : '••••••••') 
                              : 'N/A'
                            }
                          </p>
                          {driver.zimyo_password && (
                            <button
                              type="button"
                              onClick={toggleZimyoPassword}
                              className="absolute top-0 right-0 p-1 text-gray-500 hover:text-gray-700 transition-colors"
                              title={showZimyoPassword ? "Hide password" : "Show password"}
                            >
                              {showZimyoPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Document Uploads */}
                {documents && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-white rounded-xl shadow-sm p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      Documents
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Emirates ID */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          Emirates ID
                        </h4>
                        
                        <div className="space-y-2">
                          {documents.emirates_id_front && (
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-blue-600" />
                              <a 
                                href={documents.emirates_id_front} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Front Side
                              </a>
                              <a 
                                href={documents.emirates_id_front} 
                                download
                                className="text-sm text-green-600 hover:underline"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                          
                          {documents.emirates_id_back && (
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-blue-600" />
                              <a 
                                href={documents.emirates_id_back} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Back Side
                              </a>
                              <a 
                                href={documents.emirates_id_back} 
                                download
                                className="text-sm text-green-600 hover:underline"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Driving License */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <Car className="w-4 h-4 text-green-600" />
                          Driving License
                        </h4>
                        
                        <div className="space-y-2">
                          {documents.driving_license_front && (
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-blue-600" />
                              <a 
                                href={documents.driving_license_front} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Front Side
                              </a>
                              <a 
                                href={documents.driving_license_front} 
                                download
                                className="text-sm text-green-600 hover:underline"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                          
                          {documents.driving_license_back && (
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-blue-600" />
                              <a 
                                href={documents.driving_license_back} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Back Side
                              </a>
                              <a 
                                href={documents.driving_license_back} 
                                download
                                className="text-sm text-green-600 hover:underline"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Passport */}
                      <div className="md:col-span-2 space-y-3">
                        <h4 className="font-medium text-gray-900">
                          Passport Information
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Passport Number</label>
                            <p className="text-gray-900 font-mono">{documents.passport_number || 'N/A'}</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">Passport Copy</label>
                            {documents.passport_copy ? (
                              <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-blue-600" />
                                <a 
                                  href={documents.passport_copy} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  View Document
                                </a>
                                <a 
                                  href={documents.passport_copy} 
                                  download
                                  className="text-sm text-green-600 hover:underline"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No document uploaded</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Status & Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    Status & Activity
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Current Status</label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(driver.status)}`}>
                        {driver.status}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Shift Type</label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getShiftColor(driver.shift_type)}`}>
                        {driver.shift_type} Shift
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
