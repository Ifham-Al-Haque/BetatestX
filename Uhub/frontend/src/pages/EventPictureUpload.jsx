import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, Image, X, Check, AlertCircle, Download, Share2, Heart, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EventPictureUpload = () => {
  const { userProfile } = useAuth();
  
  // Role-based permission functions
  const canViewImages = () => {
    return ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'].includes(userProfile?.role);
  };
  
  const canUploadImages = () => {
    return ['admin', 'hr_manager', 'manager'].includes(userProfile?.role);
  };
  
  const canDeleteImages = () => {
    return ['admin', 'hr_manager'].includes(userProfile?.role);
  };

  // Debug logging
  console.log('🔍 EventPictureUpload Page - User Role:', userProfile?.role);
  console.log('🔍 EventPictureUpload Page - Permissions:', {
    canView: canViewImages(),
    canUpload: canUploadImages(),
    canDelete: canDeleteImages()
  });

  const [uploadedImages, setUploadedImages] = useState([
    {
      id: 1,
      name: 'team-building-2024.jpg',
      url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&h=400&fit=crop',
      size: '2.4 MB',
      event: 'Team Building Workshop 2024',
      date: '2024-01-15',
      likes: 12,
      isFavorite: false,
      tags: ['Team Building', 'Workshop', 'Fun']
    },
    {
      id: 2,
      name: 'anniversary-celebration.jpg',
      url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&h=400&fit=crop',
      size: '3.1 MB',
      event: 'Company Anniversary Celebration',
      date: '2024-01-20',
      likes: 28,
      isFavorite: true,
      tags: ['Anniversary', 'Celebration', 'Success']
    }
  ]);
  
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = useCallback((e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, []);

  const handleFiles = (files) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    // Simulate file processing
    setTimeout(() => {
      const newImage = {
        id: Date.now(),
        name: files[0].name,
        url: URL.createObjectURL(files[0]),
        size: `${(files[0].size / (1024 * 1024)).toFixed(1)} MB`,
        event: 'New Event',
        date: new Date().toISOString().split('T')[0],
        likes: 0,
        isFavorite: false,
        tags: ['New', 'Event']
      };
      
      setUploadedImages(prev => [newImage, ...prev]);
      setIsUploading(false);
      setUploadProgress(0);
    }, 2000);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedImage(null);
  };

  const toggleFavorite = (imageId) => {
    setUploadedImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, isFavorite: !img.isFavorite }
        : img
    ));
  };

  const handleLike = (imageId) => {
    setUploadedImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, likes: img.likes + 1 }
        : img
    ));
  };

  const deleteImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    if (selectedImage && selectedImage.id === imageId) {
      closePreview();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Picture Upload</h1>
          <p className="text-lg text-gray-600">Share and preserve your event memories</p>
        </div>

        {/* Upload Area */}
        {canUploadImages() && (
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50 scale-105' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
            <input
              ref={(input) => input}
              type="file"
              multiple
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your event pictures here
                </p>
                <p className="text-gray-500 mb-4">
                  or click to browse files
                </p>
                
                <button
                  onClick={() => document.querySelector('input[type="file"]').click()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Upload className="w-5 h-5 inline mr-2" />
                  Choose Files
                </button>
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Uploading...</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
              </motion.div>
            )}
          </motion.div>
        </div>
        )}

        {/* Uploaded Images Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {uploadedImages.map((image) => (
            <motion.div
              key={image.id}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:shadow-2xl"
              onClick={() => handleImageClick(image)}
            >
              <div className="relative">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(image.id);
                    }}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      image.isFavorite
                        ? 'bg-pink-500 text-white shadow-lg'
                        : 'bg-white text-gray-400 hover:text-pink-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${image.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {image.size}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 truncate">{image.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{image.event}</p>
                <p className="text-xs text-gray-500 mb-3">{image.date}</p>
                
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(image.id);
                    }}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors duration-200"
                  >
                    <Heart className="w-4 h-4" />
                    <span>{image.likes}</span>
                  </button>
                  
                  <div className="flex gap-1">
                    {image.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Image Preview Modal */}
        <AnimatePresence>
          {showPreview && selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
              onClick={closePreview}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.name}
                    className="w-full h-96 object-cover rounded-t-xl"
                  />
                  <button
                    onClick={closePreview}
                    className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedImage.name}</h2>
                      <p className="text-lg text-gray-600">{selectedImage.event}</p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(selectedImage.id)}
                      className={`p-3 rounded-full transition-all duration-200 ${
                        selectedImage.isFavorite
                          ? 'bg-pink-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-400 hover:text-pink-500'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${selectedImage.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Image className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">File Size</p>
                        <p className="text-sm text-gray-600">{selectedImage.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Upload Date</p>
                        <p className="text-sm text-gray-600">{selectedImage.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Heart className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Likes</p>
                        <p className="text-sm text-gray-600">{selectedImage.likes}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedImage.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200">
                      <Download className="w-4 h-4" />
                      Download Image
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors duration-200">
                      <Share2 className="w-4 h-4" />
                      Share Image
                    </button>
                    {canDeleteImages() && (
                      <button 
                        onClick={() => deleteImage(selectedImage.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                        Delete Image
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default EventPictureUpload;
