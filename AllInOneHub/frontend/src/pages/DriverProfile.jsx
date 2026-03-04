import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  User, Mail, Phone, 
  Shield, Briefcase, Edit, ArrowLeft,
  CheckCircle, AlertCircle, Clock, Star, Car,
  FileText, Download, Eye, EyeOff, CreditCard, TrendingUp,
  Award, Activity, Globe, Copy, Users, Building
} from "lucide-react";
import { supabase } from "../supabaseClient";

import UserDropdown from "../components/UserDropdown";
import DarkModeToggle from "../components/DarkModeToggle";

export default function DriverProfile() {
  console.log('🔍 DriverProfile component rendered');
  const { id } = useParams();
  console.log('🔍 DriverProfile id param:', id);
  const [driver, setDriver] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showZimyoPassword, setShowZimyoPassword] = useState(false);
  const [documentUrls, setDocumentUrls] = useState({});

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleZimyoPassword = useCallback(() => {
    setShowZimyoPassword(prev => !prev);
  }, []);

  const generateSignedUrl = useCallback(async (documentType, documentUrl) => {
    if (!documentUrl) return;
    
    try {
      // Check if URL is a Supabase Storage URL
      if (documentUrl.includes('supabase.co/storage/v1/object')) {
        // Extract path from URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        // or: https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]
        const urlMatch = documentUrl.match(/\/storage\/v1\/object\/(?:public|sign\/[\w-]+\/)(.+)$/);
        if (urlMatch) {
          const fullPath = urlMatch[1];
          // Remove query parameters if any
          const cleanPath = fullPath.split('?')[0];
          const pathParts = cleanPath.split('/').filter(p => p);
          
          if (pathParts.length > 1) {
            const bucketName = pathParts[0];
            const actualPath = pathParts.slice(1).join('/');
            
            console.log(`Generating signed URL for ${documentType}:`, { bucketName, actualPath });
            
            const { data: signedData, error: signedError } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(actualPath, 3600); // 1 hour expiry
            
            if (!signedError && signedData) {
              setDocumentUrls(prev => ({
                ...prev,
                [documentType]: signedData.signedUrl
              }));
              // Open the URL in a new tab
              window.open(signedData.signedUrl, '_blank');
            } else {
              console.error('Error generating signed URL:', signedError);
              // Fallback: try to use the original URL
              window.open(documentUrl, '_blank');
            }
          } else {
            console.warn('Could not parse path from URL:', documentUrl);
            window.open(documentUrl, '_blank');
          }
        } else {
          // Try to use the URL as-is
          window.open(documentUrl, '_blank');
        }
      } else {
        // External URL - open directly
        window.open(documentUrl, '_blank');
      }
    } catch (error) {
      console.error(`Error generating signed URL for ${documentType}:`, error);
      // Fallback: try to open the original URL
      window.open(documentUrl, '_blank');
    }
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
    const { data: docsData, error: docsError } = await supabase
      .from("driver_documents")
      .select("*")
      .eq("driver_id", id);

    if (docsError) {
      console.error("Error fetching documents:", docsError.message);
    }

    setDriver(driverData);
    
    // Convert documents array to the expected format
    if (docsData && docsData.length > 0) {
      const docsMap = {};
      const urlsMap = {};
      
      // Generate signed URLs for documents if they're stored in Supabase Storage
      for (const doc of docsData) {
        docsMap[doc.document_type] = doc.document_url;
        if (doc.document_type === 'passport_copy') {
          docsMap.passport_number = doc.passport_number;
        }
        
        // Check if URL is a Supabase Storage URL
        if (doc.document_url && doc.document_url.includes('supabase.co/storage/v1/object/public')) {
          // Public URL - use as is
          urlsMap[doc.document_type] = doc.document_url;
        } else if (doc.document_url && doc.document_url.includes('supabase.co/storage/v1/object')) {
          // This might be a signed URL or private URL - try to use as is first
          // If it doesn't work, we'll generate a signed URL when clicked
          urlsMap[doc.document_type] = doc.document_url;
        } else {
          // External URL or other format - use as is
          urlsMap[doc.document_type] = doc.document_url;
        }
      }
      
      setDocuments(docsMap);
      setDocumentUrls(urlsMap);
    } else {
      setDocuments({});
      setDocumentUrls({});
    }
    
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchDriver();
  }, [fetchDriver]);

  if (loading) {
    return (
      <div className="min-h-screen font-sans bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex">
          
          <main className="flex-1 ml-64 p-10">
            <div className="flex flex-col items-center justify-center h-screen">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Car className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
                </div>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading driver profile...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen font-sans bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex">
          
          <main className="flex-1 ml-64 p-10">
            <div className="max-w-2xl mx-auto mt-20">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-200 dark:border-gray-700"
              >
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Driver Not Found</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">The driver you're looking for doesn't exist or has been removed.</p>
                <Link
                  to="/drivers"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Drivers
                </Link>
              </motion.div>
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
    <div className="min-h-screen font-sans bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex">
        
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-8"
            >
              <div className="flex items-center gap-4">
                <Link
                  to="/drivers"
                  className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </Link>
                <div className="flex flex-col">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                    Driver Profile
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1.5 flex items-center gap-2 text-sm">
                    <Car className="w-4 h-4 flex-shrink-0" />
                    Comprehensive driver information and management
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </motion.button>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Enhanced Profile Card */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-8"
                >
                  {/* Status Indicator Bar */}
                  <div className={`h-2 ${
                    driver.status === 'active' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                    driver.status === 'inactive' ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                    'bg-gradient-to-r from-red-400 to-red-500'
                  }`} />
                  
                  <div className="p-6 pr-6">
                    {/* Enhanced Profile Picture */}
                    <div className="text-center mb-8">
                      <div className="relative inline-block mb-5">
                        {driver.profile_picture ? (
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-xl opacity-50"></div>
                            <img
                              src={driver.profile_picture}
                              alt={driver.full_name}
                              className="relative w-36 h-36 rounded-full mx-auto border-4 border-white dark:border-gray-700 object-cover shadow-2xl"
                            />
                            <div className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-xl ${
                              driver.status === 'active' ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
                              driver.status === 'inactive' ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                              'bg-gradient-to-br from-red-400 to-red-500'
                            }`}>
                              {driver.status === 'active' ? (
                                <CheckCircle className="w-6 h-6 text-white" />
                              ) : driver.status === 'inactive' ? (
                                <Clock className="w-6 h-6 text-white" />
                              ) : (
                                <AlertCircle className="w-6 h-6 text-white" />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-xl opacity-50"></div>
                            <div className="relative w-36 h-36 rounded-full mx-auto border-4 border-white dark:border-gray-700 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-2xl">
                              <User className="w-20 h-20 text-white" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-xl">
                              <Car className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-5 mb-2">
                        {driver.full_name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-2 mb-1 flex items-center justify-center gap-2">
                        <Briefcase className="w-4 h-4 flex-shrink-0" />
                        <span>{driver.designation || 'Driver'}</span>
                      </p>
                      
                      {driver.employee_id && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-3 flex items-center justify-center gap-2">
                          <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>ID: {driver.employee_id}</span>
                        </p>
                      )}
                      
                      <div className="flex items-center justify-center gap-2.5 mt-5">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-md ${getStatusColor(driver.status)}`}>
                          {driver.status === 'active' && <CheckCircle className="w-3 h-3 mr-1.5" />}
                          {driver.status === 'inactive' && <Clock className="w-3 h-3 mr-1.5" />}
                          {driver.status === 'suspended' && <AlertCircle className="w-3 h-3 mr-1.5" />}
                          {driver.status}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-md ${getShiftColor(driver.shift_type)}`}>
                          <Clock className="w-3 h-3 mr-1.5" />
                          {driver.shift_type} Shift
                        </span>
                      </div>
                    </div>

                  {/* Quick Actions */}
                  <div className="space-y-3 mb-8">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        to={`/driver/${id}/edit`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Edit className="w-4 h-4 flex-shrink-0" />
                        Edit Profile
                      </Link>
                    </motion.div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const documentsSection = document.getElementById('documents-section');
                        if (documentsSection) {
                          documentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      View Documents
                    </motion.button>
                  </div>

                  {/* Contact Information */}
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span>Contact Information</span>
                    </h3>
                    <div className="space-y-3.5">
                      <div className="flex items-start gap-3.5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">U Drive Email</p>
                          <p className="text-sm text-gray-900 dark:text-white break-all leading-relaxed">{driver.udrive_email || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3.5 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Company Mobile</p>
                          <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{driver.company_mobile || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3.5 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Personal Mobile</p>
                          <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{driver.personal_mobile || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Credentials */}
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2.5">
                      <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">Account Credentials</span>
                    </h3>
                    <div className="space-y-5">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">U Drive Password</p>
                        <div className="flex items-center gap-2 pr-1">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={driver.udrive_password || ''}
                            readOnly
                            className="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono min-w-0"
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={togglePasswordVisibility}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                            aria-label="Toggle password visibility"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              navigator.clipboard.writeText(driver.udrive_password || '');
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                            title="Copy password"
                            aria-label="Copy password"
                          >
                            <Copy className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Zimyo Password</p>
                        <div className="flex items-center gap-2 pr-1">
                          <input
                            type={showZimyoPassword ? "text" : "password"}
                            value={driver.zimyo_password || ''}
                            readOnly
                            className="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono min-w-0"
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleZimyoPassword}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                            aria-label="Toggle password visibility"
                          >
                            {showZimyoPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              navigator.clipboard.writeText(driver.zimyo_password || '');
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                            title="Copy password"
                            aria-label="Copy password"
                          >
                            <Copy className="w-4 h-4" />
                          </motion.button>
                        </div>
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
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      Personal Information
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Full Name</label>
                        <p className="text-gray-900 dark:text-white font-semibold text-lg leading-relaxed">{driver.full_name}</p>
                      </div>
                      <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Designation</label>
                        <p className="text-gray-900 dark:text-white font-medium leading-relaxed">{driver.designation || 'Not specified'}</p>
                      </div>
                      <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Nationality</span>
                        </label>
                        <p className="text-gray-900 dark:text-white font-medium leading-relaxed mt-0.5">{driver.nationality || 'Not specified'}</p>
                      </div>
                      <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Employee ID</span>
                        </label>
                        <p className="text-gray-900 dark:text-white font-mono font-semibold leading-relaxed mt-0.5">{driver.employee_id || 'Not assigned'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Professional Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <Briefcase className="w-5 h-5 text-white" />
                      </div>
                      Professional Details
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Team Type</span>
                        </label>
                        <p className="text-gray-900 dark:text-white font-medium leading-relaxed mt-0.5">{driver.team_type || 'Not assigned'}</p>
                      </div>
                      <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Team Name</span>
                        </label>
                        <p className="text-gray-900 dark:text-white font-medium leading-relaxed mt-0.5">{driver.team_name || 'Not assigned'}</p>
                      </div>
                      <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Shift Type</label>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-md mt-0.5 ${getShiftColor(driver.shift_type)}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {driver.shift_type} Shift
                        </span>
                      </div>
                      <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Status</label>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-md mt-0.5 ${getStatusColor(driver.status)}`}>
                          {driver.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {driver.status === 'inactive' && <Clock className="w-3 h-3 mr-1" />}
                          {driver.status === 'suspended' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {driver.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Vehicle & Service Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                        <Car className="w-5 h-5 text-white" />
                      </div>
                      Vehicle & Service Information
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700/50">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Car className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Service Car Plate</span>
                        </label>
                        <p className="text-gray-900 dark:text-white font-mono text-xl font-bold leading-relaxed mt-0.5">{driver.service_car_plate || 'Not assigned'}</p>
                      </div>
                      <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700/50">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>U Drive Customer ID</span>
                        </label>
                        <p className="text-gray-900 dark:text-white font-mono font-semibold leading-relaxed mt-0.5">{driver.udrive_customer_account_id || 'Not assigned'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Performance Metrics */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      Performance Metrics
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <motion.div
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700/50 shadow-lg"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">98%</div>
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300">On-Time Delivery</div>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-700/50 shadow-lg"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">4.8</div>
                        <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Customer Rating</div>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700/50 shadow-lg"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">156</div>
                        <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Trips Completed</div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                {/* Documents Section */}
                {documents && (
                  <motion.div
                    id="documents-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        Documents & Identification
                      </h3>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Emirates ID */}
                        <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700/50">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                              <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            Emirates ID
                          </h4>
                          
                          <div className="space-y-2">
                            {documents.emirates_id_front && (
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all"
                              >
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                                  <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <a 
                                  href={documentUrls.emirates_id_front || documents.emirates_id_front} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex-1 text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  onClick={async (e) => {
                                    if (!documentUrls.emirates_id_front) {
                                      e.preventDefault();
                                      await generateSignedUrl('emirates_id_front', documents.emirates_id_front);
                                    }
                                  }}
                                >
                                  Front Side
                                </a>
                                <motion.a
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  href={documentUrls.emirates_id_front || documents.emirates_id_front} 
                                  download
                                  className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </motion.a>
                              </motion.div>
                            )}
                            
                            {documents.emirates_id_back && (
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all"
                              >
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                                  <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <a 
                                  href={documentUrls.emirates_id_back || documents.emirates_id_back} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex-1 text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  onClick={async (e) => {
                                    if (!documentUrls.emirates_id_back) {
                                      e.preventDefault();
                                      await generateSignedUrl('emirates_id_back', documents.emirates_id_back);
                                    }
                                  }}
                                >
                                  Back Side
                                </a>
                                <motion.a
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  href={documentUrls.emirates_id_back || documents.emirates_id_back} 
                                  download
                                  className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </motion.a>
                              </motion.div>
                            )}
                            
                            {!documents.emirates_id_front && !documents.emirates_id_back && (
                              <div className="p-4 text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No Emirates ID documents uploaded</p>
                              </div>
                            )}
                          </div>
                        </div>

                      {/* Driving License */}
                      <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700/50">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <Car className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          Driving License
                        </h4>
                        
                        <div className="space-y-2">
                          {documents.driving_license_front && (
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all"
                            >
                              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                                <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <a 
                                href={documentUrls.driving_license_front || documents.driving_license_front} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 text-sm font-medium text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                onClick={async (e) => {
                                  if (!documentUrls.driving_license_front) {
                                    e.preventDefault();
                                    await generateSignedUrl('driving_license_front', documents.driving_license_front);
                                  }
                                }}
                              >
                                Front Side
                              </a>
                              <motion.a
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                href={documentUrls.driving_license_front || documents.driving_license_front} 
                                download
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </motion.a>
                            </motion.div>
                          )}
                          
                          {documents.driving_license_back && (
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all"
                            >
                              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                                <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <a 
                                href={documentUrls.driving_license_back || documents.driving_license_back} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 text-sm font-medium text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                onClick={async (e) => {
                                  if (!documentUrls.driving_license_back) {
                                    e.preventDefault();
                                    await generateSignedUrl('driving_license_back', documents.driving_license_back);
                                  }
                                }}
                              >
                                Back Side
                              </a>
                              <motion.a
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                href={documentUrls.driving_license_back || documents.driving_license_back} 
                                download
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </motion.a>
                            </motion.div>
                          )}
                          
                          {!documents.driving_license_front && !documents.driving_license_back && (
                            <div className="p-4 text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-gray-500 dark:text-gray-400 text-sm">No driving license documents uploaded</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Passport */}
                      <div className="md:col-span-2 p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700/50">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          Passport Information
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Passport Number</label>
                            <p className="text-gray-900 dark:text-white font-mono font-semibold text-lg bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              {documents.passport_number || 'Not provided'}
                            </p>
                          </div>
                          
                          <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Passport Copy</label>
                            {documents.passport_copy ? (
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                              >
                                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                                  <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <a 
                                  href={documentUrls.passport_copy || documents.passport_copy} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex-1 text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                  onClick={async (e) => {
                                    if (!documentUrls.passport_copy) {
                                      e.preventDefault();
                                      await generateSignedUrl('passport_copy', documents.passport_copy);
                                    }
                                  }}
                                >
                                  View Document
                                </a>
                                <motion.a
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  href={documentUrls.passport_copy || documents.passport_copy} 
                                  download
                                  className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </motion.a>
                              </motion.div>
                            ) : (
                              <div className="p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No passport document uploaded</p>
                              </div>
                            )}
                          </div>
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
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center shadow-lg">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      Recent Activity
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700/50 hover:shadow-md transition-all"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Profile Updated</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Driver information was updated 2 hours ago</p>
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-3 py-1 rounded-full">2h ago</span>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700/50 hover:shadow-md transition-all"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Status Changed</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Driver status changed to Active</p>
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-3 py-1 rounded-full">1 day ago</span>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 }}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50 hover:shadow-md transition-all"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Document Uploaded</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">New driving license document was uploaded</p>
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-3 py-1 rounded-full">3 days ago</span>
                      </motion.div>
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
