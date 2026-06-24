import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import PaymentCalendar from '../components/PaymentCalendar';
import PaymentEventFormModal from '../components/PaymentEventFormModal';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { DEFAULT_PAYMENT_FORM } from '../constants/paymentEvents';
import { formatDateOnly } from '../utils/paymentRecurrence';
import {
  buildPaymentPayload,
  createPaymentEvent,
  eventToFormData,
  fetchPaymentEvents,
  markPaymentPaid,
  subscribePaymentEvents,
  updatePaymentEvent,
} from '../services/paymentEventService';

const PaymentCalendarPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_PAYMENT_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await fetchPaymentEvents();
      setEvents(data);
      queryClient.setQueryData(['paymentEvents'], data);
    } catch (error) {
      console.error('Error fetching payment events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    return subscribePaymentEvents(() => loadEvents());
  }, []);

  const syncEvents = (updatedEvents) => {
    setEvents(updatedEvents);
    queryClient.setQueryData(['paymentEvents'], updatedEvents);
  };

  const handleAddPayment = (date) => {
    setEditingEvent(null);
    setFormData({
      ...DEFAULT_PAYMENT_FORM,
      due_date: formatDateOnly(date || new Date()),
    });
    setFormError('');
    setShowForm(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setFormData(eventToFormData(event));
    setFormError('');
    setShowForm(true);
  };

  const handleMarkPaid = async (event) => {
    const updated = await markPaymentPaid(event);
    syncEvents(events.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description || !formData.amount || !formData.due_date) {
      setFormError('Please fill Description, Amount, and Due Date.');
      return;
    }

    if (formData.is_recurring && !formData.recurrence_frequency) {
      setFormError('Please select a recurrence frequency.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      const payload = buildPaymentPayload(formData, user?.id);

      if (editingEvent) {
        const updated = await updatePaymentEvent(editingEvent.id, payload);
        syncEvents(events.map((item) => (item.id === editingEvent.id ? updated : item)));
      } else {
        const created = await createPaymentEvent(payload);
        syncEvents([...events, created]);
      }

      setShowForm(false);
      setEditingEvent(null);
      setFormData(DEFAULT_PAYMENT_FORM);
    } catch (error) {
      console.error('Error saving payment event:', error);
      setFormError(error.message || 'Failed to save payment event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading payment calendar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <PaymentCalendar
              events={events}
              onEventsUpdate={syncEvents}
              onAddPayment={handleAddPayment}
              onMarkPaid={handleMarkPaid}
              onEditEvent={handleEditEvent}
              initialSelectedDate={location.state?.selectedDate}
            />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <PaymentEventFormModal
            open={showForm}
            title={editingEvent ? 'Edit Payment' : 'Schedule New Payment'}
            subtitle="Payments appear on the calendar and upcoming list"
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onClose={() => {
              setShowForm(false);
              setEditingEvent(null);
              setFormData(DEFAULT_PAYMENT_FORM);
              setFormError('');
            }}
            saving={saving}
            error={formError}
            submitLabel={editingEvent ? 'Update Payment' : 'Schedule Payment'}
            accent="blue"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentCalendarPage;
