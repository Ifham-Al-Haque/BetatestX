import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, Image, X, Check, AlertCircle, Download, Share2, Heart, Calendar, Plus, Filter, Search, Grid, List } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { sliceOfLifeApi } from '../services/sliceOfLifeApi';

const EventPictureUpload = () => {
  const { userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
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

  // State management
  const [uploadedImages, setUploadedImages] = useState([]);
  const [events, setEvents] = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedMemory, setSelectedMemory] = useState('');
  const [pictureCategory, setPictureCategory] = useState('normal');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [monthlyPhotos, setMonthlyPhotos] = useState([]);

  // Load data on component mount
  useEffect(() => {
    if (userProfile) {
      fetchData();
    }
  }, [userProfile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data...');
      
      const [eventsData, memoriesData, imagesData, monthlyData] = await Promise.all([
        sliceOfLifeApi.getEvents(),
        sliceOfLifeApi.getMemories(),
        sliceOfLifeApi.getImages(),
        sliceOfLifeApi.getMonthlyPhotos()
      ]);
      
      console.log('Fetched data:', {
        events: eventsData.length,
        memories: memoriesData.length,
        images: imagesData.length,
        monthly: monthlyData.length
      });
      
      setEvents(eventsData);
      setMemories(memoriesData);
      setUploadedImages(imagesData);
      setMonthlyPhotos(monthlyData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

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

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // Upload image to Supabase Storage
      const uploadResult = await sliceOfLifeApi.uploadImage(file, 'event');
      
      // Save metadata to database
      console.log('Saving image metadata to database...', {
        uploadResult,
        selectedEvent,
        selectedMemory,
        pictureCategory
      });
      
      const imageMetadata = await sliceOfLifeApi.saveImageMetadata(
        uploadResult,
        selectedEvent || null,
        selectedMemory || null,
        pictureCategory
      );
      
      console.log('Image metadata saved:', imageMetadata);
      
      // Update progress to 100%
      setUploadProgress(100);
      
      // Add to local state
      const newImage = {
        ...imageMetadata,
        image_url: uploadResult.publicUrl,
        image_name: uploadResult.fileName,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        likes: 0,
        is_favorite: false,
        created_at: new Date().toISOString()
      };
      
      console.log('Adding new image to local state:', newImage);
      setUploadedImages(prev => [newImage, ...prev]);
      success('Image uploaded successfully!');
      
      // Refresh the data to show the new image
      console.log('Refreshing data after upload...');
      await fetchData();
      console.log('Data refresh completed');
      
      // Reset form
      setSelectedEvent('');
      setSelectedMemory('');
      
    } catch (error) {
      console.error('Error uploading image:', error);
      showError(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedImage(null);
  };

  const toggleFavorite = async (imageId) => {
    try {
      const result = await sliceOfLifeApi.toggleImageFavorite(imageId);
      
      setUploadedImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, is_favorite: result.favorited }
          : img
      ));
      
      if (selectedImage && selectedImage.id === imageId) {
        setSelectedImage(prev => ({ ...prev, is_favorite: result.favorited }));
      }
      
      success(result.favorited ? 'Added to favorites!' : 'Removed from favorites!');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showError('Failed to update favorite status');
    }
  };

  const handleLike = async (imageId) => {
    try {
      const result = await sliceOfLifeApi.toggleImageLike(imageId);
      
      setUploadedImages(prev => prev.map(img => 
        img.id === imageId 
          ? { 
              ...img, 
              likes: result.liked ? (img.likes || 0) + 1 : Math.max((img.likes || 0) - 1, 0)
            }
          : img
      ));
      
      if (selectedImage && selectedImage.id === imageId) {
        setSelectedImage(prev => ({ 
          ...prev, 
          likes: result.liked ? (prev.likes || 0) + 1 : Math.max((prev.likes || 0) - 1, 0)
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      showError('Failed to update like status');
    }
  };

  const deleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    
    try {
      await sliceOfLifeApi.deleteImage(imageId);
      
      setUploadedImages(prev => prev.filter(img => img.id !== imageId));
      
      if (selectedImage && selectedImage.id === imageId) {
        closePreview();
      }
      
      success('Image deleted successfully!');
    } catch (error) {
      console.error('Error deleting image:', error);
      showError('Failed to delete image');
    }
  };

  // Filter and search functionality
  const filteredImages = uploadedImages.filter(image => {
    const matchesSearch = searchTerm === '' || 
      image.image_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMonth = selectedMonth === '' || image.month_year === selectedMonth;
    
    if (!matchesSearch || !matchesMonth) return false;
    
    if (filter === 'all') return true;
    if (filter === 'favorites') return image.is_favorite;
    if (filter === 'recent') {
      const imageDate = new Date(image.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return imageDate >= thirtyDaysAgo;
    }
    if (filter === 'normal') return image.picture_category === 'normal';
    if (filter === 'event') return image.picture_category === 'event';
    
    return true;
  });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block"
          >
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Event Gallery
            </h1>
            <p className="text-xl text-gray-600 mb-6">Share and preserve your event memories</p>
          </motion.div>
          
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === 'all'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                All Images
              </button>
              <button
                onClick={() => setFilter('favorites')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === 'favorites'
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Favorites
              </button>
              <button
                onClick={() => setFilter('recent')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === 'recent'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setFilter('normal')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === 'normal'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setFilter('event')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === 'event'
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Event
              </button>
            </div>
            
            {/* Monthly Filter */}
            {monthlyPhotos.length > 0 && (
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Months</option>
                  {monthlyPhotos.map((month) => (
                    <option key={month.month_year} value={month.month_year}>
                      {new Date(month.month_year + '-01').toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })} ({month.photo_count} photos)
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
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
                  Drop your pictures here
                </p>
                <p className="text-gray-500 mb-4">
                  or click to browse files
                </p>
                
                {/* Picture Category Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Picture Category
                  </label>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setPictureCategory('normal')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        pictureCategory === 'normal'
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Normal (Memories Only)
                    </button>
                    <button
                      onClick={() => setPictureCategory('event')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        pictureCategory === 'event'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Event (Both Events & Memories)
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {pictureCategory === 'normal' 
                      ? 'Will appear in Memories only' 
                      : 'Will appear in both Events and Memories'
                    }
                  </p>
                </div>
                
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
          className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }
        >
          {filteredImages.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No images found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms' : 'Upload some images to get started'}
              </p>
            </div>
          ) : (
            filteredImages.map((image) => (
            <motion.div
              key={image.id}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:shadow-2xl ${
                viewMode === 'list' ? 'flex' : ''
              }`}
              onClick={() => handleImageClick(image)}
            >
              <div className={`relative ${viewMode === 'list' ? 'w-48 h-32 flex-shrink-0' : ''}`}>
                <img
                  src={image.image_url}
                  alt={image.image_name}
                  className={`${viewMode === 'list' ? 'w-full h-full' : 'w-full h-48'} object-cover`}
                />
                <div className="absolute top-4 right-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(image.id);
                    }}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      image.is_favorite
                        ? 'bg-pink-500 text-white shadow-lg'
                        : 'bg-white text-gray-400 hover:text-pink-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${image.is_favorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {image.size}
                  </span>
                </div>
              </div>

              <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <h3 className="font-semibold text-gray-900 mb-1 truncate">{image.image_name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {image.event_id ? 'Event Image' : image.memory_id ? 'Memory Image' : 'General Image'}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  {new Date(image.created_at).toLocaleDateString()}
                </p>
                
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(image.id);
                    }}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors duration-200"
                  >
                    <Heart className="w-4 h-4" />
                    <span>{image.likes || 0}</span>
                  </button>
                  
                  <div className="flex gap-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      image.picture_category === 'normal' 
                        ? 'bg-purple-100 text-purple-600' 
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {image.picture_category === 'normal' ? 'Normal' : 'Event'}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                      {image.file_type.split('/')[1].toUpperCase()}
                    </span>
                    {image.is_primary && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-600 text-xs rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
            ))
          )}
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
                    src={selectedImage.image_url}
                    alt={selectedImage.image_name}
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
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedImage.image_name}</h2>
                      <p className="text-lg text-gray-600">
                        {selectedImage.event_id ? 'Event Image' : selectedImage.memory_id ? 'Memory Image' : 'General Image'}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(selectedImage.id)}
                      className={`p-3 rounded-full transition-all duration-200 ${
                        selectedImage.is_favorite
                          ? 'bg-pink-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-400 hover:text-pink-500'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${selectedImage.is_favorite ? 'fill-current' : ''}`} />
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
                        <p className="text-sm text-gray-600">{new Date(selectedImage.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Heart className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Likes</p>
                        <p className="text-sm text-gray-600">{selectedImage.likes || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">File Information</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {selectedImage.file_type.split('/')[1].toUpperCase()}
                      </span>
                      {selectedImage.is_primary && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          Primary Image
                        </span>
                      )}
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {selectedImage.image_size} bytes
                      </span>
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
