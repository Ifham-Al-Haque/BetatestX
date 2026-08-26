import notificationService from './notificationService';
import { collectExpiryReminders, formatShortDate } from '../utils/mulkiyaExpiryUtils';

const STORAGE_KEY = 'uhub.mulkiyaReminders.sent.v1';
const NOTIFY_ROLES = ['admin', 'operation_management'];
const MAX_NOTIFY_PER_VISIT = 6;

function readSent() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeSent(map) {
  try {
    const cutoff = Date.now() - 45 * 86400000;
    const pruned = {};
    Object.entries(map).forEach(([key, ts]) => {
      if (Number(ts) >= cutoff) pruned[key] = ts;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * In-app + push reminders for Mulkiya and insurance that are expired or due
 * within 7 days. Deduped once per vehicle / document / expiry date / day so
 * opening the page does not spam the bell.
 */
export async function dispatchMulkiyaReminders(vehicles, { daysBefore = 30 } = {}) {
  const items = collectExpiryReminders(vehicles, { daysBefore })
    .filter((item) => item.days < 0 || item.days <= 7)
    .slice(0, MAX_NOTIFY_PER_VISIT);

  if (items.length === 0) return 0;

  const sent = readSent();
  const today = new Date().toISOString().slice(0, 10);
  let dispatched = 0;

  for (const item of items) {
    const key = `${item.id}:${item.kind}:${item.date}:${item.bucket}:${today}`;
    if (sent[key]) continue;

    const plate = item.license_plate || item.vehicle_number || 'Vehicle';
    const model = [item.make, item.model].filter(Boolean).join(' ');
    const expired = item.days < 0;
    const title = expired
      ? `${item.label} expired`
      : `${item.label} expires in ${item.days} day${item.days === 1 ? '' : 's'}`;
    const message = [
      plate,
      model,
      expired ? `expired ${formatShortDate(item.date)}` : `due ${formatShortDate(item.date)}`,
    ].filter(Boolean).join(' · ');

    try {
      await Promise.all(
        NOTIFY_ROLES.map((role) =>
          notificationService.createNotificationsForRole({
            role,
            type: 'fleet_expiry_reminder',
            title,
            message,
            priority: expired || item.days <= 7 ? 'high' : 'medium',
            actionUrl: '/operation/fleetio/mulkiya',
            actionLabel: 'Open Mulkiya',
            data: {
              vehicle_id: item.id,
              kind: item.kind,
              expiry: item.date,
            },
          })
        )
      );
      sent[key] = Date.now();
      dispatched += 1;
    } catch (err) {
      console.warn('Mulkiya reminder notify failed:', err?.message || err);
    }
  }

  writeSent(sent);
  return dispatched;
}

export { collectExpiryReminders };
