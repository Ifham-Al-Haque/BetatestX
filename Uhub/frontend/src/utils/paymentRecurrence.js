const FREQUENCY_MONTHS = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

export const RECURRENCE_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const toDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addRecurrenceInterval = (date, frequency) => {
  const next = new Date(date);
  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
    return next;
  }
  const months = FREQUENCY_MONTHS[frequency] || 1;
  next.setMonth(next.getMonth() + months);
  return next;
};

export { toDateOnly, formatDateOnly, addRecurrenceInterval };

/**
 * Returns DB update payload after marking a payment paid.
 * Recurring payments roll forward to the next due date instead of staying paid.
 */
export function buildMarkPaidUpdate(event) {
  if (!event.is_recurring || !event.recurrence_frequency) {
    return { status: 'paid' };
  }

  const paidOn = toDateOnly(event.due_date);
  let nextDue = addRecurrenceInterval(paidOn, event.recurrence_frequency);
  const recurrenceEnd = event.recurrence_end_date
    ? toDateOnly(event.recurrence_end_date)
    : null;

  if (recurrenceEnd && nextDue > recurrenceEnd) {
    return { status: 'paid' };
  }

  return {
    status: 'pending',
    due_date: formatDateOnly(nextDue),
  };
}

export function getNextDueDate(dueDate, frequency) {
  if (!dueDate || !frequency) return null;
  return formatDateOnly(addRecurrenceInterval(toDateOnly(dueDate), frequency));
}

/**
 * Expands recurring payment_events into virtual occurrences for calendar/list display.
 * Stored rows are returned as-is; recurring templates also generate future instances.
 */
export function expandRecurringPaymentEvents(events = [], rangeStart, rangeEnd, options = {}) {
  const { includePastOccurrences = false } = options;
  const start = toDateOnly(rangeStart);
  const end = toDateOnly(rangeEnd);
  if (!start || !end) return events.map((event) => ({ ...event, isVirtual: false }));

  const expanded = [];

  events.forEach((event) => {
    expanded.push({ ...event, isVirtual: false });

    if (!event.is_recurring || !event.recurrence_frequency) return;

    const baseDue = toDateOnly(event.due_date);
    const recurrenceEnd = event.recurrence_end_date
      ? toDateOnly(event.recurrence_end_date)
      : end;

    if (!baseDue) return;

    let cursor = addRecurrenceInterval(baseDue, event.recurrence_frequency);
    let guard = 0;

    while (cursor <= end && cursor <= recurrenceEnd && guard < 240) {
      guard += 1;
      const inRange = cursor >= start && cursor <= end;
      const include = includePastOccurrences || cursor >= toDateOnly(new Date());

      if (inRange && include) {
        expanded.push({
          ...event,
          id: `${event.id}__${formatDateOnly(cursor)}`,
          due_date: formatDateOnly(cursor),
          isVirtual: true,
          parentEventId: event.id,
          status: event.status === 'paid' ? 'pending' : event.status,
        });
      }

      cursor = addRecurrenceInterval(cursor, event.recurrence_frequency);
    }
  });

  return expanded.sort(
    (a, b) => toDateOnly(a.due_date) - toDateOnly(b.due_date)
  );
}

export function getRecurrenceLabel(frequency) {
  return RECURRENCE_FREQUENCIES.find((item) => item.value === frequency)?.label || frequency;
}
