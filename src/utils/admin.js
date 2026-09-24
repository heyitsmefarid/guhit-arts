// Numbers and wording shared by the admin screens.
import { STATUS_FLOW } from '../data/statuses';
import { categories, products } from '../data/products';
import { digitalServices } from '../data/digitalServices';
import { stockLevel } from '../data/inventory';

const DAY = 864e5;
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const todayStart = () => startOfDay(Date.now());

// Chart series colors (validated as a set: see styles/admin.css).
export const SERIES = {
  shop: 'var(--series-1)',
  digital: 'var(--series-2)',
  third: 'var(--series-3)',
};

// True when `iso` falls on one of the last `days` calendar days, today included.
export const inLastDays = (iso, days) => startOfDay(iso) > new Date(todayStart().getTime() - days * DAY);
export const isWithinDays = inLastDays;

// Value of a digital project once it has a confirmed price.
export const projectValue = (p) => (p.status !== 'pending' && p.price ? p.price : 0);

// Daily sales, oldest first: shop orders and confirmed digital work as separate series.
export function dailySeries(orders, projects, days) {
  const today = todayStart();
  const rows = Array.from({ length: days }, (_, i) => {
    const date = new Date(today.getTime() - (days - 1 - i) * DAY);
    return { date, shop: 0, digital: 0, orders: 0, projects: 0 };
  });
  const rowFor = (iso) => rows[days - 1 - Math.round((today - startOfDay(iso)) / DAY)];
  orders.forEach((o) => {
    const r = rowFor(o.createdAt);
    if (r) {
      r.shop += o.total;
      r.orders += 1;
    }
  });
  projects.forEach((p) => {
    const r = rowFor(p.createdAt);
    if (r && projectValue(p)) {
      r.digital += projectValue(p);
      r.projects += 1;
    }
  });
  return rows;
}

// Headline numbers for the selected range.
export function summarize({ orders, projects, customers, products }, days) {
  const o = orders.filter((x) => inLastDays(x.createdAt, days));
  const p = projects.filter((x) => inLastDays(x.createdAt, days));
  const shop = o.reduce((s, x) => s + x.total, 0);
  const digital = p.reduce((s, x) => s + projectValue(x), 0);
  const buyers = new Set([...o, ...p].map((x) => x.customer.id));
  return {
    revenue: shop + digital,
    shop,
    digital,
    orderCount: o.length,
    avgOrder: o.length ? Math.round(shop / o.length) : 0,
    requestCount: p.length,
    needsQuote: projects.filter((x) => x.status === 'pending' && !x.price).length,
    activeCustomers: buyers.size,
    newCustomers: customers.filter((c) => inLastDays(c.createdAt, days)).length,
    openOrders: orders.filter((x) => x.status !== 'completed').length,
    pendingOrders: orders.filter((x) => x.status === 'pending').length,
    openRequests: projects.filter((x) => x.status !== 'completed').length,
    pendingRequests: projects.filter((x) => x.status === 'pending').length,
    lowStock: products.filter((x) => ['low', 'out'].includes(stockLevel(x.stock))).length,
    outOfStock: products.filter((x) => x.stock === 0).length,
    dueSoon: projects.filter((x) => x.status !== 'completed' && daysLeft(x.deadline) <= 3).length,
  };
}

export const daysLeft = (dateStr) => Math.round((new Date(`${dateStr}T00:00:00`) - todayStart()) / DAY);

const CATEGORY_OF = Object.fromEntries(products.map((p) => [p.id, p.category]));

// Sales by shop category plus digital services, largest first.
export function salesByCategory(orders, projects, days) {
  const totals = Object.fromEntries(categories.map((c) => [c.id, 0]));
  orders
    .filter((o) => inLastDays(o.createdAt, days))
    .forEach((o) =>
      o.items.forEach((i) => {
        const cat = CATEGORY_OF[i.productId] ?? 'custom';
        totals[cat] = (totals[cat] ?? 0) + i.price * i.qty;
      })
    );
  const digital = projects.filter((p) => inLastDays(p.createdAt, days)).reduce((s, p) => s + projectValue(p), 0);
  return [
    ...categories.map((c) => ({ id: c.id, label: c.name, value: totals[c.id] })),
    { id: 'digital', label: 'Digital services', value: digital },
  ].sort((a, b) => b.value - a.value);
}

// Best sellers by units, with revenue for the tooltip.
export function topProducts(orders, days, n = 6) {
  const map = new Map();
  orders
    .filter((o) => inLastDays(o.createdAt, days))
    .forEach((o) =>
      o.items.forEach((i) => {
        const cur = map.get(i.productId) ?? { id: i.productId, label: i.name, value: 0, revenue: 0 };
        cur.value += i.qty;
        cur.revenue += i.qty * i.price;
        map.set(i.productId, cur);
      })
    );
  return [...map.values()].sort((a, b) => b.value - a.value).slice(0, n);
}

// Orders per weekday, Monday first.
export function ordersByWeekday(orders, days) {
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const full = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'];
  const counts = Array(7).fill(0);
  orders.filter((o) => inLastDays(o.createdAt, days)).forEach((o) => (counts[(new Date(o.createdAt).getDay() + 6) % 7] += 1));
  return names.map((label, i) => ({ label, tip: full[i], values: { orders: counts[i] } }));
}

export function paymentShare(orders, days) {
  const o = orders.filter((x) => inLastDays(x.createdAt, days));
  const count = (m) => o.filter((x) => x.payment === m).length;
  return [
    { id: 'gcash', label: 'GCash', value: count('gcash'), color: SERIES.digital },
    { id: 'cash', label: 'Cash', value: count('cash'), color: SERIES.shop },
    { id: 'maya', label: 'Maya', value: count('maya'), color: SERIES.third },
  ];
}

export function handoffShare(orders, days) {
  const o = orders.filter((x) => inLastDays(x.createdAt, days));
  return [
    { id: 'pickup', label: 'Pickup at the shop', value: o.filter((x) => x.fulfillment === 'pickup').length, color: SERIES.shop },
    { id: 'delivery', label: 'Delivery in Calapan', value: o.filter((x) => x.fulfillment === 'delivery').length, color: SERIES.digital },
  ];
}

export function requestsByService(projects, days) {
  const p = projects.filter((x) => inLastDays(x.createdAt, days));
  return digitalServices
    .filter((s) => s.id !== 'rush')
    .map((s) => ({ id: s.id, label: s.short, value: p.filter((x) => x.serviceId === s.id).length }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
}

export const stageCounts = (items, kind = 'order') =>
  STATUS_FLOW.map((s) => ({ id: s, kind, value: items.filter((i) => i.status === s).length }));

// Open digital work due within `withinDays`, soonest first.
export const upcomingDeadlines = (projects, withinDays = 7) =>
  projects
    .filter((p) => p.status !== 'completed' && daysLeft(p.deadline) <= withinDays)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

export const stockWatch = (products) =>
  products
    .filter((p) => ['low', 'out'].includes(stockLevel(p.stock)))
    .sort((a, b) => a.stock - b.stock);

// Latest status changes across every order and request.
export function recentActivity(orders, projects, n = 8) {
  const events = [];
  [...orders, ...projects].forEach((item) =>
    item.history.forEach((h, idx) => events.push({ ...h, first: idx === 0, item }))
  );
  return events.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, n);
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// What the staff member does next at each stage, worded as the button label.
export const NEXT_ACTION = {
  order: {
    pending: 'Approve order',
    approved: 'Start preparing',
    in_progress: 'Send proof for approval',
    for_revision: 'Mark as completed',
  },
  project: {
    pending: 'Approve request',
    approved: 'Start work',
    in_progress: 'Send draft to customer',
    for_revision: 'Deliver final files',
  },
};

export const itemsSummary = (order) => {
  const first = `${order.items[0].name} × ${order.items[0].qty}`;
  return order.items.length > 1 ? `${first} and ${order.items.length - 1} more` : first;
};

export const shortPeso = (v) => (v >= 1000 ? `₱${(v / 1000).toLocaleString('en-PH', { maximumFractionDigits: 1 })}k` : `₱${v}`);
