import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Plus, Edit, Trash, Eye, Image, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { sliceOfLifeApi } from '../services/sliceOfLifeApi';

const Events = () => {
  const { userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  // Role-based permission functions
  const canViewEvent = () => {
    return ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'].includes(userProfile?.role);
  };
  
  const canAddEvent = () => {
    return ['admin', 'hr_manager', 'manager'].includes(userProfile?.role);
  };
  
  const canEditEvent = () => {
    return ['admin', 'hr_manager', 'manager'].includes(userProfile?.role);
  };
  
  const canDeleteEvent = () => {
    return ['admin', 'hr_manager'].includes(userProfile?.role);
  };

  // State management
  const [events, setEvents] = useState([]);
  const [eventPhotos, setEventPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  // Load data on component mount
  useEffect(() => {
    if (userProfile) {
      fetchData();
    }
  }, [userProfile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching Events data...');
      
      const [eventsData, photosData] = await Promise.all([
        sliceOfLifeApi.getEvents(),
        sliceOfLifeApi.getPhotosForEvents()
      ]);
      
      console.log('📊 Events data loaded:', eventsData);
      console.log('📸 Event photos loaded:', photosData);
      console.log('📊 Event photos count:', photosData.length);
      
      setEvents(eventsData);
      setEventPhotos(photosData);
      
      // Additional debugging
      if (photosData.length === 0) {
        console.log('⚠️ No event photos found. Checking all photos...');
        const allPhotos = await sliceOfLifeApi.getImages();
        console.log('📸 All photos in database:', allPhotos);
        console.log('📊 All photos count:', allPhotos.length);
      }
    } catch (error) {
      console.error('❌ Error fetching events data:', error);
      showError('Failed to load events data');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return event.status === 'upcoming';
    if (filter === 'completed') return event.status === 'completed';
    return true;
  });

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Events</h1>
          <p className="text-lg text-gray-600">Discover and manage company events</p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === 'upcoming'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === 'completed'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Completed
            </button>
          </div>

          {canAddEvent() && (
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl">
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          )}
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-yellow-100 rounded-lg">
          <h3 className="font-semibold text-yellow-800">Debug Info:</h3>
          <p className="text-sm text-yellow-700">
            Event Photos Count: {eventPhotos.length} | 
            Events Count: {events.length} | 
            Loading: {loading ? 'Yes' : 'No'}
          </p>
        </div>

        {/* Event Photos Section */}
        {eventPhotos.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Photos ({eventPhotos.length})</h2>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
            >
              {eventPhotos.slice(0, 12).map((photo) => (
                <motion.div
                  key={photo.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="relative group cursor-pointer"
                >
                  <img
                    src={photo.image_url}
                    alt={photo.image_name}
                    className="w-full h-24 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-200"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <button className="p-1 bg-white rounded-full text-gray-600 hover:text-red-500">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            {eventPhotos.length > 12 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Showing 12 of {eventPhotos.length} event photos
              </p>
            )}
          </div>
        ) : (
          <div className="mb-8 p-6 bg-gray-100 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Event Photos Found</h3>
            <p className="text-gray-500">
              Upload photos with "Event" category to see them here.
            </p>
          </div>
        )}

        {/* Events Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredEvents.map((event) => (
            <motion.div
              key={event.id}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:shadow-2xl"
              onClick={() => handleEventClick(event)}
            >
              <div className="relative">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    event.status === 'upcoming' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {event.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                  </span>
                </div>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {event.category}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{event.attendees} attendees</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors duration-200">
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Event Details Modal */}
        <AnimatePresence>
          {showModal && selectedEvent && (
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
                className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <img
                    src={selectedEvent.image}
                    alt={selectedEvent.title}
                    className="w-full h-64 object-cover rounded-t-xl"
                  />
                  <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    ×
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedEvent.status === 'upcoming' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedEvent.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {selectedEvent.category}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedEvent.title}</h2>
                  <p className="text-gray-600 mb-6">{selectedEvent.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Date</p>
                        <p className="text-sm text-gray-600">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Time</p>
                        <p className="text-sm text-gray-600">{selectedEvent.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-600">{selectedEvent.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Attendees</p>
                        <p className="text-sm text-gray-600">{selectedEvent.attendees}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {canEditEvent() && (
                      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200">
                        <Edit className="w-4 h-4" />
                        Edit Event
                      </button>
                    )}
                    {canDeleteEvent() && (
                      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors duration-200">
                        <Trash className="w-4 h-4" />
                        Delete Event
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

export default Events;
