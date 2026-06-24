import { supabase } from '../supabaseClient';
import { PAYMENT_EVENT_SELECT } from '../constants/paymentEvents';
import { buildMarkPaidUpdate } from '../utils/paymentRecurrence';

export function buildPaymentPayload(formData, userId) {
  return {
    user_id: userId,
    description: formData.description.trim(),
    amount: parseFloat(formData.amount),
    currency: formData.currency || 'AED',
    status: formData.status || 'pending',
    due_date: formData.due_date,
    is_recurring: Boolean(formData.is_recurring),
    recurrence_frequency: formData.is_recurring ? formData.recurrence_frequency : null,
    recurrence_end_date:
      formData.is_recurring && formData.recurrence_end_date
        ? formData.recurrence_end_date
        : null,
    reminder_days_before: Number(formData.reminder_days_before) || 3,
  };
}

export function eventToFormData(event) {
  return {
    description: event.description || '',
    amount: event.amount?.toString() || '',
    currency: event.currency || 'AED',
    status: event.status || 'pending',
    due_date: event.due_date || '',
    is_recurring: Boolean(event.is_recurring),
    recurrence_frequency: event.recurrence_frequency || 'monthly',
    recurrence_end_date: event.recurrence_end_date || '',
    reminder_days_before: event.reminder_days_before ?? 3,
  };
}

export async function fetchPaymentEvents() {
  const { data, error } = await supabase
    .from('payment_events')
    .select(PAYMENT_EVENT_SELECT)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createPaymentEvent(payload) {
  const { data, error } = await supabase
    .from('payment_events')
    .insert(payload)
    .select(PAYMENT_EVENT_SELECT)
    .single();

  if (error) throw error;
  return data;
}

export async function updatePaymentEvent(id, payload) {
  const { data, error } = await supabase
    .from('payment_events')
    .update(payload)
    .eq('id', id)
    .select(PAYMENT_EVENT_SELECT)
    .single();

  if (error) throw error;
  return data;
}

export async function deletePaymentEvent(id) {
  const { error } = await supabase.from('payment_events').delete().eq('id', id);
  if (error) throw error;
}

export async function markPaymentPaid(event) {
  const parentId = event.parentEventId || event.id;
  const sourceEvent = event.isVirtual
    ? { ...event, id: parentId, due_date: event.due_date }
    : event;

  const updatePayload = buildMarkPaidUpdate(sourceEvent);
  return updatePaymentEvent(parentId, updatePayload);
}

export function subscribePaymentEvents(onChange) {
  const channel = supabase
    .channel(`payment_events_${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_events' }, onChange)
    .subscribe();

  return () => channel.unsubscribe();
}
