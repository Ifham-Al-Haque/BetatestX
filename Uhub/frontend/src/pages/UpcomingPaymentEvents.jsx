import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, DollarSign, Plus, Repeat, Loader2, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import PaymentEventFormModal from '../components/PaymentEventFormModal';
import { DEFAULT_PAYMENT_FORM } from '../constants/paymentEvents';
import { expandRecurringPaymentEvents, getRecurrenceLabel } from '../utils/paymentRecurrence';
import {
  buildPaymentPayload,
  createPaymentEvent,
  deletePaymentEvent,
  eventToFormData,
  fetchPaymentEvents,
  markPaymentPaid,
  subscribePaymentEvents,
  updatePaymentEvent,
} from '../services/paymentEventService';

const UpcomingPaymentEvents = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_PAYMENT_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const formatAmount = (amount, currency = 'AED') =>
    `${currency} ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

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

  const syncEvents = (next) => {
    setEvents(next);
    queryClient.setQueryData(['paymentEvents'], next);
  };

  const openAddForm = () => {
    setEditingEvent(null);
    setFormData(DEFAULT_PAYMENT_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (event) => {
    if (event.isVirtual) return;
    setEditingEvent(event);
    setFormData(eventToFormData(event));
    setFormError('');
    setShowForm(true);
  };

  const handleDelete = async (event) => {
    if (event.isVirtual) return;
    if (!window.confirm('Delete this payment reminder?')) return;
    try {
      await deletePaymentEvent(event.id);
      syncEvents(events.filter((item) => item.id !== event.id));
    } catch (error) {
      console.error('Error deleting payment event:', error);
      alert('Failed to delete payment event');
    }
  };

  const handleMarkPaid = async (event) => {
    try {
      const updated = await markPaymentPaid(event);
      syncEvents(events.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Failed to update payment status');
    }
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

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const horizonEnd = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + 3);
    return d;
  }, [today]);

  const upcomingDisplayEvents = useMemo(() => {
    const expanded = expandRecurringPaymentEvents(events, today, horizonEnd);
    return expanded.filter((event) => {
      const due = new Date(event.due_date);
      due.setHours(0, 0, 0, 0);
      return due >= today && event.status !== 'paid' && event.status !== 'cancelled';
    });
  }, [events, today, horizonEnd]);

  const stats = useMemo(() => {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return {
      totalUpcoming: upcomingDisplayEvents.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
      dueThisWeek: upcomingDisplayEvents
        .filter((e) => {
          const due = new Date(e.due_date);
          return due >= today && due <= weekEnd;
        })
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
      overdueAmount: events
        .filter((e) => e.status === 'overdue')
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
      recurringCount: events.filter((e) => e.is_recurring).length,
    };
  }, [events, upcomingDisplayEvents, today]);

  const getDaysUntilDue = (dueDate) => {
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  };

  const getPriorityFromDue = (dueDate) => {
    const days = getDaysUntilDue(dueDate);
    if (days <= 3) return 'high';
    if (days <= 7) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
  };

  const getDueStatus = (daysUntilDue) => {
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue === 0) return 'due-today';
    if (daysUntilDue <= 3) return 'due-soon';
    return 'upcoming';
  };

  const getDueStatusColor = (status) => {
    if (status === 'overdue') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
    if (status === 'due-today') return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
    if (status === 'due-soon') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
  };

  const filteredPaymentEvents = useMemo(() => {
    return upcomingDisplayEvents.filter((event) => {
      if (filter === 'all') return true;
      if (filter === 'recurring') return event.is_recurring || event.isVirtual;
      if (filter === 'due-soon') {
        const days = getDaysUntilDue(event.due_date);
        return days >= 0 && days <= 7;
      }
      if (filter === 'high') return getPriorityFromDue(event.due_date) === 'high';
      return true;
    });
  }, [upcomingDisplayEvents, filter, today]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Upcoming Payments</h1>
                  <p className="text-emerald-100 text-sm">
                    Actionable list with recurring projections for the next 3 months
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={loadEvents}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={openAddForm}
                  className="px-4 py-2 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Payment
                </button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Upcoming', value: formatAmount(stats.totalUpcoming), sub: 'Next 3 months' },
              { label: 'Due This Week', value: formatAmount(stats.dueThisWeek), sub: 'Next 7 days', color: 'text-amber-600' },
              { label: 'Overdue', value: formatAmount(stats.overdueAmount), sub: 'Needs action', color: 'text-red-600' },
              { label: 'Recurring', value: stats.recurringCount, sub: 'Active schedules', color: 'text-indigo-600' },
            ].map((card) => (
              <div
                key={card.label}
                className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <div className="text-sm font-medium text-gray-500">{card.label}</div>
                <div className={`text-2xl font-bold mt-1 ${card.color || 'text-blue-600'}`}>{card.value}</div>
                <div className="text-xs text-gray-500 mt-1">{card.sub}</div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: 'all', label: 'All Events' },
                { id: 'due-soon', label: 'Due This Week' },
                { id: 'high', label: 'High Priority' },
                { id: 'recurring', label: 'Recurring' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    filter === id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    {['Event', 'Amount', 'Due Date', 'Priority', 'Status', 'Actions'].map((col) => (
                      <th
                        key={col}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPaymentEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No upcoming payments match this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPaymentEvents.map((event) => {
                      const daysUntilDue = getDaysUntilDue(event.due_date);
                      const dueStatus = getDueStatus(daysUntilDue);
                      const priority = getPriorityFromDue(event.due_date);

                      return (
                        <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                {event.is_recurring || event.isVirtual ? (
                                  <Repeat className="w-4 h-4 text-indigo-600" />
                                ) : (
                                  <DollarSign className="w-4 h-4 text-emerald-600" />
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {event.description || 'Payment'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {event.isVirtual
                                    ? `Projected · ${getRecurrenceLabel(event.recurrence_frequency)}`
                                    : event.is_recurring
                                    ? `Recurring · ${getRecurrenceLabel(event.recurrence_frequency)}`
                                    : 'One-time payment'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold whitespace-nowrap">
                            {formatAmount(event.amount, event.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">{new Date(event.due_date).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">
                              {daysUntilDue === 0 ? 'Due today' : `${daysUntilDue} days left`}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
                              {priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getDueStatusColor(dueStatus)}`}>
                              {dueStatus.replace('-', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap">
                            <button
                              onClick={() => handleMarkPaid(event)}
                              className="text-emerald-600 hover:text-emerald-800 font-medium mr-3"
                            >
                              {event.is_recurring || event.isVirtual ? 'Mark paid & next' : 'Mark paid'}
                            </button>
                            {!event.isVirtual && (
                              <>
                                <button onClick={() => openEditForm(event)} className="text-blue-600 hover:text-blue-800 mr-3">
                                  Edit
                                </button>
                                <button onClick={() => handleDelete(event)} className="text-red-600 hover:text-red-800">
                                  Delete
                                </button>
                              </>
                            )}
                            {event.isVirtual && <span className="text-xs text-gray-400">Auto-generated</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <PaymentEventFormModal
            open={showForm}
            title={editingEvent ? 'Edit Payment' : 'Schedule New Payment'}
            subtitle="Set up one-time or recurring payment reminders"
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
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UpcomingPaymentEvents;
