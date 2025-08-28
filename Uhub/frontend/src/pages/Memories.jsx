import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, MapPin, Users, Camera, Star, Share2, Download, Trash, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Memories = () => {
  const { userProfile } = useAuth();
  
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

  // Debug logging
  console.log('🔍 Memories Page - User Role:', userProfile?.role);
  console.log('🔍 Memories Page - Permissions:', {
    canView: canViewMemory(),
    canEdit: canEditMemory(),
    canDelete: canDeleteMemory()
  });

  const [memories, setMemories] = useState([
    {
      id: 1,
      title: 'Team Building Workshop 2024',
      description: 'Amazing day filled with laughter, challenges, and team bonding activities. Everyone worked together to solve puzzles and build stronger relationships.',
      date: '2024-01-15',
      location: 'Conference Room A',
      attendees: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'],
      image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500&h=400&fit=crop',
      likes: 24,
      tags: ['Team Building', 'Workshop', 'Fun'],
      isFavorite: true,
      category: 'Workshop'
    },
    {
      id: 2,
      title: 'Company Anniversary Celebration',
      description: 'Celebrating 5 years of success! The evening was filled with joy, recognition, and looking forward to many more years of growth.',
      date: '2024-01-20',
      location: 'Grand Hall',
      attendees: ['All Staff', 'Partners', 'Clients'],
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&h=400&fit=crop',
      likes: 45,
      tags: ['Anniversary', 'Celebration', 'Success'],
      isFavorite: false,
      category: 'Celebration'
    },
    {
      id: 3,
      title: 'Tech Innovation Day',
      description: 'Showcasing the latest technological innovations and projects. Great to see the creativity and technical expertise of our team.',
      date: '2024-01-25',
      location: 'Innovation Center',
      attendees: ['Tech Team', 'Management', 'External Partners'],
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=400&fit=crop',
      likes: 32,
      tags: ['Technology', 'Innovation', 'Projects'],
      isFavorite: true,
      category: 'Conference'
    },
    {
      id: 4,
      title: 'Holiday Party 2023',
      description: 'End of year celebration with delicious food, great music, and wonderful company. A perfect way to wrap up another successful year.',
      date: '2023-12-20',
      location: 'Office Premises',
      attendees: ['All Employees', 'Families'],
      image: 'https://images.unsplash.com/photo-1540317580384-e5d43867caa6?w=500&h=400&fit=crop',
      likes: 67,
      tags: ['Holiday', 'Party', 'Celebration'],
      isFavorite: false,
      category: 'Party'
    }
  ]);

  const [selectedMemory, setSelectedMemory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'timeline'

  const filteredMemories = memories.filter(memory => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return memory.isFavorite;
    if (filter === 'recent') {
      const memoryDate = new Date(memory.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return memoryDate >= thirtyDaysAgo;
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

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Memories
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

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                viewMode === 'timeline'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Timeline View
            </button>
          </div>
        </div>

        {/* Memories Display */}
        {viewMode === 'grid' ? (
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
                    src={memory.image}
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
                        memory.isFavorite
                          ? 'bg-pink-500 text-white shadow-lg'
                          : 'bg-white text-gray-400 hover:text-pink-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${memory.isFavorite ? 'fill-current' : ''}`} />
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
                      <span>{new Date(memory.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>{memory.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{memory.attendees.length} people</span>
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
                        <span>{memory.likes}</span>
                      </button>
                    </div>
                    <div className="flex gap-1">
                      {memory.tags.slice(0, 2).map((tag, index) => (
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
                          memory.isFavorite
                            ? 'bg-pink-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-400 hover:text-pink-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${memory.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    
                    <img
                      src={memory.image}
                      alt={memory.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{new Date(memory.date).toLocaleDateString()}</span>
                        <span>{memory.location}</span>
                        <span>{memory.attendees.length} people</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors duration-200">
                          <Heart className="w-4 h-4" />
                          <span>{memory.likes}</span>
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
