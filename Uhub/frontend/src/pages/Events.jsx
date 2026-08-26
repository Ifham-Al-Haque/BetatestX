import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Plus, Edit, Trash, Eye, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { sliceOfLifeApi } from '../services/sliceOfLifeApi';

const EVENT_CATEGORIES = ['Workshop', 'Celebration', 'Conference', 'Social', 'Training', 'Other'];

const EMPTY_FORM = {
  title: '',
  description: '',
  event_date: '',
  event_time: '',
  location: '',
  attendees_count: 0,
  category: 'Workshop',
  status: 'upcoming',
  image_url: '',
};

const eventImage = (event) => event?.image_url || event?.image || '';
const eventDateValue = (event) => event?.event_date || event?.date || '';
const eventTimeValue = (event) => {
  const raw = event?.event_time || event?.time || '';
  return raw ? String(raw).slice(0, 5) : '';
};
const eventAttendees = (event) => event?.attendees_count ?? event?.attendees ?? 0;

const formatEventDate = (value) => {
  if (!value) return 'Date TBD';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date TBD' : date.toLocaleDateString();
};

const Events = () => {
  const { userProfile } = useAuth();
  const { success, error: showError } = useToast();

  const canAddEvent = () => ['admin', 'hr_manager', 'manager'].includes(userProfile?.role);
  const canEditEvent = () => ['admin', 'hr_manager', 'manager'].includes(userProfile?.role);
  const canDeleteEvent = () => ['admin', 'hr_manager'].includes(userProfile?.role);

  const [events, setEvents] = useState([]);
  const [eventPhotos, setEventPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingEvent, setEditingEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (userProfile) {
      fetchData();
    }
  }, [userProfile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsData, photosData] = await Promise.all([
        sliceOfLifeApi.getEvents(),
        sliceOfLifeApi.getPhotosForEvents(),
      ]);
      setEvents(eventsData || []);
      setEventPhotos(photosData || []);
    } catch (error) {
      console.error('Error fetching events data:', error);
      showError('Failed to load events data');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (filter === 'all') return true;
    return (event.status || 'upcoming') === filter;
  });

  const openCreateForm = () => {
    setEditingEvent(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
    setShowModal(false);
  };

  const openEditForm = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      event_date: eventDateValue(event)?.slice?.(0, 10) || eventDateValue(event) || '',
      event_time: eventTimeValue(event),
      location: event.location || '',
      attendees_count: eventAttendees(event) || 0,
      category: event.category || 'Workshop',
      status: event.status || 'upcoming',
      image_url: eventImage(event),
    });
    setShowForm(true);
    setShowModal(false);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEvent(null);
    setFormData(EMPTY_FORM);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.event_date || !formData.event_time || !formData.location.trim()) {
      showError('Please fill in title, date, time, and location');
      return;
    }

    setSaving(true);
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || formData.title.trim(),
      event_date: formData.event_date,
      event_time: formData.event_time,
      location: formData.location.trim(),
      attendees_count: Number(formData.attendees_count) || 0,
      category: formData.category,
      status: formData.status,
      image_url: formData.image_url.trim() || null,
    };

    try {
      if (editingEvent?.id) {
        await sliceOfLifeApi.updateEvent(editingEvent.id, payload);
        success('Event updated');
      } else {
        await sliceOfLifeApi.createEvent(payload);
        success('Event created');
      }
      closeForm();
      await fetchData();
    } catch (err) {
      console.error('Error saving event:', err);
      showError(err?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (event) => {
    if (!event?.id) return;
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    try {
      await sliceOfLifeApi.deleteEvent(event.id);
      success('Event deleted');
      setShowModal(false);
      setSelectedEvent(null);
      await fetchData();
    } catch (err) {
      console.error('Error deleting event:', err);
      showError(err?.message || 'Failed to delete event');
    }
  };

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
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  const statusClass = (status) =>
    status === 'upcoming'
      ? 'bg-green-100 text-green-800'
      : status === 'cancelled'
        ? 'bg-gray-100 text-gray-800'
        : 'bg-purple-100 text-purple-800';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Events</h1>
          <p className="text-lg text-gray-600">Discover and manage company events</p>
        </div>

        <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Events', active: 'bg-blue-600' },
              { id: 'upcoming', label: 'Upcoming', active: 'bg-green-600' },
              { id: 'completed', label: 'Completed', active: 'bg-purple-600' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === option.id ? `${option.active} text-white shadow-lg` : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {canAddEvent() && (
            <button
              type="button"
              onClick={openCreateForm}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          )}
        </div>

        {eventPhotos.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Event Photos ({eventPhotos.length})</h2>
              <Link to="/event-picture-upload" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                Upload photos
              </Link>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
            >
              {eventPhotos.slice(0, 12).map((photo) => (
                <motion.div key={photo.id} variants={itemVariants} className="relative">
                  <img
                    src={photo.image_url}
                    alt={photo.image_name}
                    className="w-full h-24 object-cover rounded-lg shadow-md"
                  />
                </motion.div>
              ))}
            </motion.div>
            {eventPhotos.length > 12 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Showing 12 of {eventPhotos.length} event photos
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center shadow-sm">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No events yet</h3>
            <p className="text-gray-500 mb-4">
              {filter === 'all' ? 'Create the first company event to get started.' : `No ${filter} events found.`}
            </p>
            {canAddEvent() && filter === 'all' && (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </button>
            )}
          </div>
        ) : (
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
                className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-200 hover:shadow-2xl"
                onClick={() => handleEventClick(event)}
              >
                <div className="relative h-48 bg-slate-200">
                  {eventImage(event) ? (
                    <img src={eventImage(event)} alt={event.title} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-indigo-100 text-indigo-400">
                      <Calendar className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClass(event.status)}`}>
                      {event.status === 'upcoming' ? 'Upcoming' : event.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                    </span>
                  </div>
                  {event.category && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {event.category}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{formatEventDate(eventDateValue(event))}</span>
                    </div>
                    {eventTimeValue(event) && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{eventTimeValue(event)}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{eventAttendees(event)} attendees</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

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
                <div className="relative h-64 bg-slate-200">
                  {eventImage(selectedEvent) ? (
                    <img
                      src={eventImage(selectedEvent)}
                      alt={selectedEvent.title}
                      className="w-full h-64 object-cover rounded-t-xl"
                    />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center bg-indigo-100 text-indigo-400 rounded-t-xl">
                      <Calendar className="w-16 h-16" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={closeModal}
                    className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50"
                  >
                    ×
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClass(selectedEvent.status)}`}>
                      {selectedEvent.status === 'upcoming' ? 'Upcoming' : selectedEvent.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                    </span>
                    {selectedEvent.category && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {selectedEvent.category}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedEvent.title}</h2>
                  <p className="text-gray-600 mb-6">{selectedEvent.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Date</p>
                        <p className="text-sm text-gray-600">{formatEventDate(eventDateValue(selectedEvent))}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Time</p>
                        <p className="text-sm text-gray-600">{eventTimeValue(selectedEvent) || 'TBD'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-600">{selectedEvent.location || 'TBD'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Attendees</p>
                        <p className="text-sm text-gray-600">{eventAttendees(selectedEvent)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {canEditEvent() && (
                      <button
                        type="button"
                        onClick={() => openEditForm(selectedEvent)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Event
                      </button>
                    )}
                    {canDeleteEvent() && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(selectedEvent)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200"
                      >
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

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={closeForm}
            >
              <motion.form
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSaveEvent}
                className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingEvent ? 'Edit Event' : 'Create Event'}
                  </h2>
                  <button type="button" onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={formData.event_date}
                        onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      <input
                        type="time"
                        required
                        value={formData.event_time}
                        onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {EVENT_CATEGORIES.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected attendees</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.attendees_count}
                      onChange={(e) => setFormData({ ...formData, attendees_count: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                    <input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={closeForm} className="px-4 py-2 text-gray-600 hover:text-gray-900">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingEvent ? 'Save changes' : 'Create event'}
                  </button>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Events;
