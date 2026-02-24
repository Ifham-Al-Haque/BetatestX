import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, MapPin, Users, Camera, Star, Share2, Download, Trash, Edit, Image, Filter, Search, Grid, List } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { sliceOfLifeApi } from '../services/sliceOfLifeApi';

const Memories = () => {
  const { userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  // Role-based permission functions
  const canViewMemory = () => {
    return ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'].includes(userProfile?.role);
  };
  
  const canEditMemory = () => {
    return ['admin', 'hr_manager', 'manager'].includes(userProfile?.role);
  };
  
  const canDeleteMemory = () => {
    return ['admin', 'hr_manager'].includes(userProfile?.role);
  };

  // State management
  const [memories, setMemories] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [monthlyPhotos, setMonthlyPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showPhotos, setShowPhotos] = useState(false); // Toggle between memories and photos

  // Load data on component mount
  useEffect(() => {
    if (userProfile) {
      fetchData();
    }
  }, [userProfile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [memoriesData, photosData, monthlyData] = await Promise.all([
        sliceOfLifeApi.getMemories(),
        sliceOfLifeApi.getPhotosForMemories(),
        sliceOfLifeApi.getMonthlyPhotos()
      ]);
      
      setMemories(memoriesData);
      setPhotos(photosData);
      setMonthlyPhotos(monthlyData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search functionality
  const filteredMemories = memories.filter(memory => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return memory.is_favorite;
    if (filter === 'recent') {
      const memoryDate = new Date(memory.memory_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return memoryDate >= thirtyDaysAgo;
    }
    return true;
  });

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = searchTerm === '' || 
      photo.image_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMonth = selectedMonth === '' || photo.month_year === selectedMonth;
    
    if (!matchesSearch || !matchesMonth) return false;
    
    if (filter === 'all') return true;
    if (filter === 'favorites') return photo.is_favorite;
    if (filter === 'recent') {
      const photoDate = new Date(photo.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return photoDate >= thirtyDaysAgo;
    }
    
    return true;
  });

  const handleMemoryClick = (memory) => {
    setSelectedMemory(memory);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMemory(null);
  };

  const toggleFavorite = (memoryId) => {
    setMemories(prev => prev.map(memory => 
      memory.id === memoryId 
        ? { ...memory, isFavorite: !memory.isFavorite }
        : memory
    ));
  };

  const handleLike = (memoryId) => {
    setMemories(prev => prev.map(memory => 
      memory.id === memoryId 
        ? { ...memory, likes: memory.likes + 1 }
        : memory
    ));
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

  const timelineVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Memories</h1>
          <p className="text-lg text-gray-600">Relive and cherish the special moments</p>
        </div>

        {/* Toggle between Memories and Photos */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowPhotos(false)}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                !showPhotos
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Memories
            </button>
            <button
              onClick={() => setShowPhotos(true)}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                showPhotos
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Photos
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              All
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
          </div>

          {/* Monthly Filter for Photos */}
          {showPhotos && monthlyPhotos.length > 0 && (
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Photos Display */}
        {showPhotos ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={viewMode === 'grid' 
              ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
              : "space-y-4"
            }
          >
            {filteredPhotos.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No photos found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'Upload some photos to get started'}
                </p>
              </div>
            ) : (
              filteredPhotos.map((photo) => (
                <motion.div
                  key={photo.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className={`relative group cursor-pointer ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  <img
                    src={photo.image_url}
                    alt={photo.image_name}
                    className={`${viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'w-full h-32'} object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-200`}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <button className="p-1 bg-white rounded-full text-gray-600 hover:text-red-500">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {viewMode === 'list' && (
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-gray-900">{photo.image_name}</h3>
                      <p className="text-sm text-gray-600">
                        {photo.picture_category === 'normal' ? 'Normal' : 'Event'} Photo
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(photo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          /* Memories Display */
          viewMode === 'grid' ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredMemories.map((memory) => (
                <motion.div
                  key={memory.id}
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:shadow-2xl"
                  onClick={() => handleMemoryClick(memory)}
                >
                  <div className="relative">
                    <img
                      src={memory.image_url || 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&h=400&fit=crop'}
                      alt={memory.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(memory.id);
                        }}
                        className={`p-2 rounded-full transition-all duration-200 ${
                          memory.is_favorite
                            ? 'bg-pink-500 text-white shadow-lg'
                            : 'bg-white text-gray-400 hover:text-pink-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${memory.is_favorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {memory.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{memory.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{memory.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(memory.memory_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span>{memory.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{memory.attendees?.length || 0} people</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(memory.id);
                          }}
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors duration-200"
                        >
                          <Heart className="w-4 h-4" />
                          <span>{memory.likes || 0}</span>
                        </button>
                      </div>
                      <div className="flex gap-1">
                        {memory.tags?.slice(0, 2).map((tag, index) => (
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
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {filteredMemories.map((memory, index) => (
                <motion.div
                  key={memory.id}
                  variants={timelineVariants}
                  className="relative"
                >
                  <div className="flex gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-purple-600" />
                      </div>
                      {index < filteredMemories.length - 1 && (
                        <div className="w-0.5 h-16 bg-purple-200 mx-auto mt-2"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{memory.title}</h3>
                          <p className="text-gray-600">{memory.description}</p>
                        </div>
                        <button
                          onClick={() => toggleFavorite(memory.id)}
                          className={`p-2 rounded-full transition-all duration-200 ${
                            memory.is_favorite
                              ? 'bg-pink-500 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-400 hover:text-pink-500'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${memory.is_favorite ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      
                      <img
                        src={memory.image_url || 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&h=400&fit=crop'}
                        alt={memory.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{new Date(memory.memory_date).toLocaleDateString()}</span>
                          <span>{memory.location}</span>
                          <span>{memory.attendees?.length || 0} people</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors duration-200">
                            <Heart className="w-4 h-4" />
                            <span>{memory.likes || 0}</span>
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )
        )}

        {/* Memory Details Modal */}
        <AnimatePresence>
          {showModal && selectedMemory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={closeModal}
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
                    src={selectedMemory.image}
                    alt={selectedMemory.title}
                    className="w-full h-80 object-cover rounded-t-xl"
                  />
                  <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    ×
                  </button>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {selectedMemory.category}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedMemory.title}</h2>
                      <p className="text-gray-600 text-lg">{selectedMemory.description}</p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(selectedMemory.id)}
                      className={`p-3 rounded-full transition-all duration-200 ${
                        selectedMemory.isFavorite
                          ? 'bg-pink-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-400 hover:text-pink-500'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${selectedMemory.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Date</p>
                        <p className="text-sm text-gray-600">{new Date(selectedMemory.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-600">{selectedMemory.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Users className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Attendees</p>
                        <p className="text-sm text-gray-600">{selectedMemory.attendees.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">People Who Attended</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMemory.attendees.map((attendee, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {attendee}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMemory.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {canEditMemory() && (
                      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200">
                        <Edit className="w-4 h-4" />
                        Edit Memory
                      </button>
                    )}
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors duration-200">
                      <Download className="w-4 h-4" />
                      Download Image
                    </button>
                    {canDeleteMemory() && (
                      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors duration-200">
                        <Trash className="w-4 h-4" />
                        Delete Memory
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

export default Memories;
