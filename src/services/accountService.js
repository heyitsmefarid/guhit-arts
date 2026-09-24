// Orders, digital projects, and notifications for the signed-in customer.
// Each function mirrors an endpoint a real backend would expose:
//   GET  /api/account            -> getAccount
//   POST /api/orders             -> placeOrder
//   POST /api/projects           -> submitProject
//   POST /api/track/:ref/advance -> advanceStatus (staff action, simulated here)
//   PATCH /api/notifications     -> markNotificationsRead
import { storage, delay } from './storage';
import { deductStock } from './inventoryStore';
import { nextStatus, statusLabel, statusDescription } from '../data/statuses';
import { initialCounters } from '../data/seed';

const key = (userId) => `account.${userId}`;
const empty = { orders: [], projects: [], notifications: [] };

export const readAccount = (userId) => storage.get(key(userId), empty);
export const writeAccount = (userId, data) => storage.set(key(userId), data);

function nextRef(type) {
  const counters = storage.get('counters', initialCounters);
  const n = counters[type] + 1;
  storage.set('counters', { ...counters, [type]: n });
  return type === 'order' ? `GAC-ORD-${String(n).padStart(5, '0')}` : `GAC-DIG-${String(n).padStart(5, '0')}`;
}

export const makeNotification = (title, body, link, kind) => ({
  id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  createdAt: new Date().toISOString(),
  title,
  body,
  link,
  kind,
  read: false,
});

// Moves an order or project in a customer's account to `status`, records it
// in the history, and notifies the customer. Used by the customer-side demo
// control and by the admin panel.
export function applyStatus(userId, ref, status, { note = '', patch = {}, by = '' } = {}) {
  const data = readAccount(userId);
  const listKey = ref.startsWith('GAC-ORD') ? 'orders' : 'projects';
  const kind = listKey === 'orders' ? 'order' : 'project';
  let updated = null;
  const list = data[listKey].map((item) => {
    if (item.ref !== ref) return item;
    const changed = status && status !== item.status;
    updated = {
      ...item,
      ...patch,
      status: status ?? item.status,
      history: changed ? [...item.history, { status, at: new Date().toISOString(), note, by }] : item.history,
    };
    return updated;
  });
  if (!updated) return null;
  const statusChanged = status && status !== data[listKey].find((i) => i.ref === ref).status;
  const notes = [...data.notifications];
  if (statusChanged) {
    notes.unshift(
      makeNotification(
        `${ref} is now ${statusLabel(status, kind)}`,
        note || statusDescription(status, kind),
        `/app/track/${ref}`,
        kind
      )
    );
  }
  writeAccount(userId, { ...data, [listKey]: list, notifications: notes });
  return updated;
}

export async function getAccount(userId) {
  await delay(250);
  return readAccount(userId);
}

export async function placeOrder(userId, { items, fulfillment, payment, contact, deliveryFee }) {
  await delay(1100);
  const data = readAccount(userId);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const now = new Date().toISOString();
  const order = {
    ref: nextRef('order'),
    kind: 'order',
    createdAt: now,
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    fulfillment,
    payment,
    contact,
    status: 'pending',
    history: [{ status: 'pending', at: now, note: 'Order placed online.' }],
  };
  const note = makeNotification(
    `Order ${order.ref} placed`,
    'We received your order and will confirm it shortly.',
    `/app/track/${order.ref}`,
    'order'
  );
  writeAccount(userId, { ...data, orders: [order, ...data.orders], notifications: [note, ...data.notifications] });
  deductStock(items);
  return order;
}

export async function submitProject(userId, payload) {
  await delay(1100);
  const data = readAccount(userId);
  const now = new Date().toISOString();
  const project = {
    ref: nextRef('project'),
    kind: 'project',
    createdAt: now,
    deliverables: [],
    ...payload,
    status: 'pending',
    history: [{ status: 'pending', at: now, note: 'Request submitted online.' }],
  };
  const note = makeNotification(
    `Request ${project.ref} received`,
    `We will review your ${payload.serviceName} request and confirm the price.`,
    `/app/track/${project.ref}`,
    'project'
  );
  writeAccount(userId, { ...data, projects: [project, ...data.projects], notifications: [note, ...data.notifications] });
  return project;
}

// Customer-side demo control: moves a request to its next status.
export async function advanceStatus(userId, ref) {
  await delay(500);
  const current = [...readAccount(userId).orders, ...readAccount(userId).projects].find((i) => i.ref === ref);
  const to = current && nextStatus(current.status);
  return to ? applyStatus(userId, ref, to) : null;
}

export async function markNotificationsRead(userId, ids = null) {
  const data = readAccount(userId);
  const notifications = data.notifications.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n));
  writeAccount(userId, { ...data, notifications });
  return notifications;
}
