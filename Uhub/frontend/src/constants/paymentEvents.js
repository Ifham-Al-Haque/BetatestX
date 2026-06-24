export const PAYMENT_EVENT_SELECT =
  'id, user_id, amount, currency, status, description, due_date, is_recurring, recurrence_frequency, recurrence_end_date, reminder_days_before, created_at, updated_at';

export const PAYMENT_STATUSES = ['pending', 'paid', 'overdue', 'cancelled'];

export const PAYMENT_CURRENCIES = ['AED', 'USD', 'EUR', 'GBP'];

export const DEFAULT_PAYMENT_FORM = {
  description: '',
  amount: '',
  currency: 'AED',
  status: 'pending',
  due_date: '',
  is_recurring: false,
  recurrence_frequency: 'monthly',
  recurrence_end_date: '',
  reminder_days_before: 3,
};
