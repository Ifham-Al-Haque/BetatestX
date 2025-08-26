import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Calendar, Building, 
  Shield, Monitor, Briefcase, Edit, ArrowLeft,
  CheckCircle, AlertCircle, Clock, Star, Car,
  FileText, Download, Eye, EyeOff, CreditCard, TrendingUp
} from "lucide-react";
import { supabase } from "../supabaseClient";

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
                      Edit Profile
                    </Link>
                    
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      <FileText className="w-4 h-4" />
                      View Documents
                    </button>
                  </div>

                  {/* Contact Information */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">U Drive Email</p>
                          <p className="text-sm text-gray-600">{driver.udrive_email || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Company Mobile</p>
                          <p className="text-sm text-gray-600">{driver.company_mobile || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Personal Mobile</p>
                          <p className="text-sm text-gray-600">{driver.personal_mobile || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Credentials */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Credentials</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">U Drive Password</p>
                        <div className="flex items-center gap-2">
                          <input
                            type={showUdrivePassword ? "text" : "password"}
                            value={driver.udrive_password || ''}
                            readOnly
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50"
                          />
                          <button
                            onClick={toggleUdrivePassword}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            {showUdrivePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Zimyo Password</p>
                        <div className="flex items-center gap-2">
                          <input
                            type={showZimyoPassword ? "text" : "password"}
                            value={driver.zimyo_password || ''}
                            readOnly
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50"
                          />
                          <button
                            onClick={toggleZimyoPassword}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            {showZimyoPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Column - Detailed Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <p className="text-gray-900 font-medium">{driver.full_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                      <p className="text-gray-900">{driver.designation || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                      <p className="text-gray-900">{driver.nationality || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                      <p className="text-gray-900">{driver.employee_id || 'Not assigned'}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Professional Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-green-600" />
                    Professional Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Team Type</label>
                      <p className="text-gray-900">{driver.team_type || 'Not assigned'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
                      <p className="text-gray-900">{driver.team_name || 'Not assigned'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Shift Type</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getShiftColor(driver.shift_type)}`}>
                        {driver.shift_type} Shift
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                        {driver.status}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Vehicle & Service Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Car className="w-5 h-5 text-purple-600" />
                    Vehicle & Service Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Car Plate</label>
                      <p className="text-gray-900 font-mono text-lg">{driver.service_car_plate || 'Not assigned'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">U Drive Customer ID</label>
                      <p className="text-gray-900">{driver.udrive_customer_account_id || 'Not assigned'}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Performance Metrics */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    Performance Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">98%</div>
                      <div className="text-sm text-blue-700">On-Time Delivery</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">4.8</div>
                      <div className="text-sm text-green-700">Customer Rating</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">156</div>
                      <div className="text-sm text-purple-700">Trips Completed</div>
                    </div>
                  </div>
                </motion.div>

                {/* Documents Section */}
                {documents && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-xl shadow-sm p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      Documents & Identification
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
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
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
                                className="text-sm text-green-600 hover:underline ml-auto"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                          
                          {documents.emirates_id_back && (
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
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
                                className="text-sm text-green-600 hover:underline ml-auto"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                          
                          {!documents.emirates_id_front && !documents.emirates_id_back && (
                            <p className="text-gray-500 text-sm">No Emirates ID documents uploaded</p>
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
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
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
                                className="text-sm text-green-600 hover:underline ml-auto"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                          
                          {documents.driving_license_back && (
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
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
                                className="text-sm text-green-600 hover:underline ml-auto"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                          
                          {!documents.driving_license_front && !documents.driving_license_back && (
                            <p className="text-gray-500 text-sm">No driving license documents uploaded</p>
                          )}
                        </div>
                      </div>

                      {/* Passport */}
                      <div className="md:col-span-2 space-y-3">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-600" />
                          Passport Information
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label>
                            <p className="text-gray-900 font-mono bg-gray-50 p-2 rounded">
                              {documents.passport_number || 'Not provided'}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Passport Copy</label>
                            {documents.passport_copy ? (
                              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
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
                                  className="text-sm text-green-600 hover:underline ml-auto"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No passport document uploaded</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Recent Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    Recent Activity
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Profile Updated</p>
                        <p className="text-xs text-gray-600">Driver information was updated 2 hours ago</p>
                      </div>
                      <span className="text-xs text-gray-500">2h ago</span>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Status Changed</p>
                        <p className="text-xs text-gray-600">Driver status changed to Active</p>
                      </div>
                      <span className="text-xs text-gray-500">1 day ago</span>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Document Uploaded</p>
                        <p className="text-xs text-gray-600">New driving license document was uploaded</p>
                      </div>
                      <span className="text-xs text-gray-500">3 days ago</span>
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
