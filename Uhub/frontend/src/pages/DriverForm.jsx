import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { motion } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Calendar, Building, 
  Shield, Monitor, Briefcase, Edit, ArrowLeft,
  CheckCircle, AlertCircle, Clock, Star, Save, X,
  Car, Upload, FileText, Camera, BookOpen, CreditCard
} from "lucide-react";

export default function DriverForm() {
  console.log('🔍 DriverForm component rendered');
  
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
    location: "",
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
  const queryClient = useQueryClient();

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError("");
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // For existing drivers, use their ID. For new drivers, use 'temp' folder
      // We'll move/update the file path after driver creation if needed
      const folderId = id || 'temp';
      const filePath = `drivers/${folderId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('driver-profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // Check if bucket doesn't exist
        if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
          throw new Error('Storage bucket "driver-profiles" does not exist. Please create it in Supabase Storage.');
        }
        // Check if file already exists (shouldn't happen with timestamp + random)
        if (uploadError.message.includes('already exists')) {
          // Retry with a new filename
          const retryFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const retryPath = `drivers/${folderId}/${retryFileName}`;
          const { data: retryData, error: retryError } = await supabase.storage
            .from('driver-profiles')
            .upload(retryPath, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (retryError) throw retryError;
          
          // Get public URL for retry
          const { data: { publicUrl: retryUrl } } = supabase.storage
            .from('driver-profiles')
            .getPublicUrl(retryPath);
          
          setFormData(prev => ({
            ...prev,
            [field]: retryUrl
          }));
          
          setSuccess('Image uploaded successfully!');
          return;
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('driver-profiles')
        .getPublicUrl(uploadData.path);

      // Update form data with the public URL
      setFormData(prev => ({
        ...prev,
        [field]: publicUrl
      }));

      setSuccess('Image uploaded successfully!');

    } catch (error) {
      console.error('Image upload error:', error);
      setError(`Failed to upload image: ${error.message || 'Unknown error. Please check if the storage bucket exists.'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB for documents)
    if (file.size > 10 * 1024 * 1024) {
      setError('Document size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      setError("");
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const folderId = id || 'temp';
      const filePath = `drivers/${folderId}/documents/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // Check if bucket doesn't exist
        if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
          throw new Error('Storage bucket "driver-documents" does not exist. Please create it in Supabase Storage.');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('driver-documents')
        .getPublicUrl(uploadData.path);

      // Update documents
      setDocuments(prev => ({
        ...prev,
        [field]: publicUrl
      }));

      setSuccess('Document uploaded successfully!');

    } catch (error) {
      console.error('Document upload error:', error);
      setError(`Failed to upload document: ${error.message || 'Unknown error. Please check if the storage bucket exists.'}`);
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

      // Log what we're about to save
      console.log('Submitting driver form:', {
        isUpdate: !!id,
        profile_picture: formData.profile_picture,
        formDataKeys: Object.keys(formData)
      });

      if (id) {
        // Update existing driver
        const { error } = await supabase
          .from("drivers")
          .update(formData)
          .eq("id", id);

        if (error) {
          console.error('Error updating driver:', error);
          throw error;
        }
        
        console.log('Driver updated successfully');
      } else {
        // Create new driver
        console.log('Creating new driver with profile_picture:', formData.profile_picture);
        
        const { data, error } = await supabase
          .from("drivers")
          .insert([formData])
          .select()
          .single();

        if (error) {
          console.error('Error creating driver:', error);
          throw error;
        }
        
        driverId = data.id;
        console.log('Driver created successfully with ID:', driverId, 'Profile picture:', data.profile_picture);

        // If profile picture was uploaded to temp folder, move it to the driver's folder
        if (formData.profile_picture && formData.profile_picture.includes('/drivers/temp/')) {
          try {
            // Extract the filename from the URL (handle both full URLs and paths)
            let fileName = '';
            if (formData.profile_picture.includes('drivers/temp/')) {
              // Extract from URL like: https://...supabase.co/.../driver-profiles/drivers/temp/filename.jpg
              const tempPathIndex = formData.profile_picture.indexOf('drivers/temp/');
              const pathAfterTemp = formData.profile_picture.substring(tempPathIndex + 'drivers/temp/'.length);
              // Remove query parameters if any
              fileName = pathAfterTemp.split('?')[0].split('/')[0];
            }
            
            if (fileName) {
              const oldPath = `drivers/temp/${fileName}`;
              const newPath = `drivers/${driverId}/${fileName}`;

              console.log('Moving profile picture:', { oldPath, newPath, fileName });

              // Download the file from temp location
              const { data: fileData, error: downloadError } = await supabase.storage
                .from('driver-profiles')
                .download(oldPath);

              if (downloadError) {
                console.error('Error downloading temp file:', downloadError);
                throw downloadError;
              }

              if (fileData) {
                // Re-upload to the correct location
                const { error: uploadError } = await supabase.storage
                  .from('driver-profiles')
                  .upload(newPath, fileData, {
                    cacheControl: '3600',
                    upsert: false
                  });

                if (uploadError) {
                  console.error('Error uploading to new location:', uploadError);
                  throw uploadError;
                }

                // Get new public URL
                const { data: { publicUrl: newUrl } } = supabase.storage
                  .from('driver-profiles')
                  .getPublicUrl(newPath);

                console.log('Profile picture moved successfully. New URL:', newUrl);

                // Update driver record with new URL
                const { error: updateError } = await supabase
                  .from("drivers")
                  .update({ profile_picture: newUrl })
                  .eq("id", driverId);

                if (updateError) {
                  console.error('Error updating driver record with new URL:', updateError);
                  throw updateError;
                }

                // Delete the old temp file (best effort - don't fail if this doesn't work)
                await supabase.storage
                  .from('driver-profiles')
                  .remove([oldPath]);
              }
            } else {
              console.warn('Could not extract filename from profile picture URL:', formData.profile_picture);
            }
          } catch (moveError) {
            // If move fails, log the error but don't fail the entire save
            // The image is still accessible at the temp location
            console.error('Could not move profile picture to driver folder:', moveError);
            // Optionally show a warning to the user
            setSuccess("Driver saved! Note: Profile picture may be in temporary location.");
          }
        }
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

      // Invalidate and refetch drivers query to show new/updated driver in the list
      queryClient.invalidateQueries(['drivers']);
      if (driverId) {
        queryClient.invalidateQueries(['driver', driverId]);
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                      placeholder="Enter driver's full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="designation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Designation *
                    </label>
                    <input
                      type="text"
                      id="designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                      placeholder="e.g., Delivery Driver, Fleet Driver"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nationality
                    </label>
                    <input
                      type="text"
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., UAE, India, Pakistan"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      id="employee_id"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., EMP001"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company_mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Mobile *
                    </label>
                    <input
                      type="tel"
                      id="company_mobile"
                      value={formData.company_mobile}
                      onChange={(e) => setFormData({ ...formData, company_mobile: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                      placeholder="+971 XX XXX XXXX"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="personal_mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Personal Mobile
                    </label>
                    <input
                      type="tel"
                      id="personal_mobile"
                      value={formData.personal_mobile}
                      onChange={(e) => setFormData({ ...formData, personal_mobile: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="+971 XX XXX XXXX"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="udrive_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      U Drive Email *
                    </label>
                    <input
                      type="email"
                      id="udrive_email"
                      value={formData.udrive_email}
                      onChange={(e) => setFormData({ ...formData, udrive_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                      placeholder="driver@udrive.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="zimyo_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Zimyo Email
                    </label>
                    <input
                      type="email"
                      id="zimyo_email"
                      value={formData.zimyo_email}
                      onChange={(e) => setFormData({ ...formData, zimyo_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="driver@zimyo.com"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Details Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  Professional Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="team_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Team Type
                    </label>
                    <select
                      id="team_type"
                      value={formData.team_type}
                      onChange={(e) => setFormData({ ...formData, team_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Team Type</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Fleet">Fleet</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Transport">Transport</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="team_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Team Name
                    </label>
                    <input
                      type="text"
                      id="team_name"
                      value={formData.team_name}
                      onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Team Alpha, Night Shift"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="shift_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Shift Type *
                    </label>
                    <select
                      id="shift_type"
                      value={formData.shift_type}
                      onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="Day">Day Shift</option>
                      <option value="Night">Night Shift</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <select
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Location</option>
                      <option value="Dubai">Dubai</option>
                      <option value="Abu Dhabi">Abu Dhabi</option>
                      <option value="Sharjah">Sharjah</option>
                      <option value="Ajman">Ajman</option>
                      <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                      <option value="Fujairah">Fujairah</option>
                      <option value="Umm Al Quwain">Umm Al Quwain</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status *
                    </label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Identification Documents */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Identification Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="emirates_id_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Emirates ID Number
                    </label>
                    <input
                      type="text"
                      id="emirates_id_no"
                      value={formData.emirates_id_no}
                      onChange={(e) => setFormData({ ...formData, emirates_id_no: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="XXX-XXXX-XXXXXXX-X"
                    />
                  </div>
                    
                  <div>
                    <label htmlFor="driving_license_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Driving License Number
                    </label>
                    <input
                      type="text"
                      id="driving_license_no"
                      value={formData.driving_license_no}
                      onChange={(e) => setFormData({ ...formData, driving_license_no: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="License number"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle & Service Information */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-purple-600" />
                  Vehicle & Service Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="service_car_plate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Service Car Plate
                    </label>
                    <input
                      type="text"
                      id="service_car_plate"
                      value={formData.service_car_plate}
                      onChange={(e) => setFormData({ ...formData, service_car_plate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., ABC-1234"
                    />
                  </div>
                    
                  <div>
                    <label htmlFor="udrive_customer_account_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      U Drive Customer Account ID
                    </label>
                    <input
                      type="text"
                      id="udrive_customer_account_id"
                      value={formData.udrive_customer_account_id}
                      onChange={(e) => setFormData({ ...formData, udrive_customer_account_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Customer account ID"
                    />
                  </div>
                </div>
              </div>

              {/* Account Credentials */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-amber-600" />
                  Account Credentials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="udrive_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      U Drive Password
                    </label>
                    <input
                      type="password"
                      id="udrive_password"
                      value={formData.udrive_password}
                      onChange={(e) => setFormData({ ...formData, udrive_password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter password"
                    />
                  </div>
                    
                  <div>
                    <label htmlFor="zimyo_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Zimyo Password
                    </label>
                    <input
                      type="password"
                      id="zimyo_password"
                      value={formData.zimyo_password}
                      onChange={(e) => setFormData({ ...formData, zimyo_password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter password"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Picture Upload */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-pink-600" />
                  Profile Picture
                </h3>
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    {formData.profile_picture ? (
                      <img
                        src={formData.profile_picture}
                        alt="Profile preview"
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label htmlFor="profile_picture" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload Profile Picture
                    </label>
                    <input
                      type="file"
                      id="profile_picture"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'profile_picture')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Recommended: Square image, 400x400 pixels or larger
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Uploads */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  Document Uploads
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Emirates ID */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      Emirates ID
                    </h4>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Front Side
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleDocumentUpload(e, 'emirates_id_front')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Back Side
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleDocumentUpload(e, 'emirates_id_back')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Driving License */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Car className="w-4 h-4 text-green-600" />
                      Driving License
                    </h4>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Front Side
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleDocumentUpload(e, 'driving_license_front')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Back Side
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleDocumentUpload(e, 'driving_license_back')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Passport */}
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      Passport Information
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="passport_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Passport Number
                        </label>
                        <input
                          type="text"
                          id="passport_number"
                          value={documents.passport_number}
                          onChange={(e) => setDocuments({ ...documents, passport_number: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Passport number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Passport Copy
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleDocumentUpload(e, 'passport_copy')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {id ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {id ? 'Update Driver' : 'Create Driver'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
