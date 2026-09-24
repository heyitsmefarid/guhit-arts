// Numbers for the admin Reports page. Each report takes the admin data
// ({ orders, projects, customers, products, team }) and a period from
// resolvePeriod(), and returns plain values and rows that the page renders
// and exports as CSV. A real backend would compute these server-side.
import { categories } from '../data/products';
import { digitalServices } from '../data/digitalServices';
import { STATUS_FLOW, statusLabel } from '../data/statuses';
import { LOW_STOCK_AT, stockLevel } from '../data/inventory';
import { SERIES, projectValue } from './admin';
import { formatPeso } from './format';

const DAY = 864e5;
const HOUR = 36e5;
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const monthName = (d) => d.toLocaleDateString('en-PH', { month: 'long' });
const within = (iso, a, b) => {
  const t = new Date(iso);
  return t >= a && t < b;
};
const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0);
const median = (values) => {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const plural = (n, one, many = `${one}s`) => `${n.toLocaleString('en-PH')} ${n === 1 ? one : many}`;
export const pct = (v) => `${Math.round(v * 100)}%`;

// Relative change, or null when there is nothing to compare with.
export const change = (cur, prev) => (prev ? (cur - prev) / prev : null);

const changeWords = (cur, prev, against) => {
  if (!against) return '';
  const c = change(cur, prev);
  if (c === null) return '';
  if (Math.abs(c) < 0.005) return `, the same as ${against}`;
  return `, ${c > 0 ? 'up' : 'down'} ${pct(Math.abs(c))} from ${against}`;
};

// ------------------------------------------------------------------
// Periods
// ------------------------------------------------------------------
export const PERIODS = [
  { id: 'month', label: 'This month' },
  { id: 'last-month', label: 'Last month' },
  { id: 'quarter', label: 'Last 3 months' },
  { id: 'year', label: 'Last 12 months' },
];

export function rangeText(start, end) {
  const last = addDays(end, -1);
  const y = (d) => d.getFullYear();
  const md = (d) => d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric' });
  if (y(start) !== y(last)) return `${md(start)}, ${y(start)} to ${md(last)}, ${y(last)}`;
  if (start.getMonth() === last.getMonth()) return `${md(start)} to ${last.getDate()}, ${y(last)}`;
  return `${md(start)} to ${md(last)}, ${y(last)}`;
}

export function resolvePeriod(id, now = new Date()) {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const make = (start, end, prevStart, prevEnd, unit, against) => ({
    id,
    label: PERIODS.find((p) => p.id === id)?.label ?? PERIODS[0].label,
    start,
    end,
    prevStart,
    prevEnd,
    unit,
    against,
    days: Math.round((end - start) / DAY),
    title: rangeText(start, end),
    prevTitle: rangeText(prevStart, prevEnd),
  });
  if (id === 'last-month') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    return make(start, monthStart, prevStart, start, 'day', monthName(prevStart));
  }
  if (id === 'quarter') {
    const start = addDays(tomorrow, -91);
    return make(start, tomorrow, addDays(start, -91), start, 'week', 'the 13 weeks before');
  }
  if (id === 'year') {
    const start = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    // Online orders start inside this window, so there is no earlier year to compare with.
    return make(start, tomorrow, new Date(start.getFullYear() - 1, start.getMonth(), 1), start, 'month', null);
  }
  // This month so far, against the same days of last month.
  const prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevLength = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  const prevEnd = addDays(prevStart, Math.min(today.getDate(), prevLength));
  return make(monthStart, tomorrow, prevStart, prevEnd, 'day', `the same days of ${monthName(prevStart)}`);
}

// Chart columns for the period: days, weeks, or months.
export function buckets(period) {
  const out = [];
  const short = (d) => d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  if (period.unit === 'month') {
    for (let d = period.start; d < period.end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      out.push({
        start: d,
        end: next < period.end ? next : period.end,
        label: d.toLocaleDateString('en-PH', { month: 'short' }),
        tip: `${d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}${next > period.end ? ' (so far)' : ''}`,
      });
    }
  } else if (period.unit === 'week') {
    for (let d = period.start; d < period.end; d = addDays(d, 7)) {
      const next = addDays(d, 7) < period.end ? addDays(d, 7) : period.end;
      out.push({ start: d, end: next, label: short(d), tip: `Week of ${short(d)} to ${short(addDays(next, -1))}` });
    }
  } else {
    for (let d = period.start; d < period.end; d = addDays(d, 1)) {
      out.push({
        start: d,
        end: addDays(d, 1),
        label: short(d),
        tip: d.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' }),
      });
    }
  }
  return out;
}

const slice = (data, a, b) => ({
  orders: data.orders.filter((o) => within(o.createdAt, a, b)),
  projects: data.projects.filter((p) => within(p.createdAt, a, b)),
});

const doneAt = (item) => item.history.find((h) => h.status === 'completed')?.at ?? null;
const stepAt = (item, status) => item.history.find((h) => h.status === status)?.at ?? null;

// ------------------------------------------------------------------
// Sales
// ------------------------------------------------------------------
const CATEGORY_OF = (products) => Object.fromEntries(products.map((p) => [p.id, p.category]));

function salesTotals({ orders, projects }) {
  const shop = sum(orders, (o) => o.total);
  const digital = sum(projects, projectValue);
  return {
    shop,
    digital,
    revenue: shop + digital,
    orders: orders.length,
    avgOrder: orders.length ? Math.round(shop / orders.length) : 0,
    units: sum(orders, (o) => sum(o.items, (i) => i.qty)),
    deliveryFees: sum(orders, (o) => o.deliveryFee ?? 0),
    jobs: projects.filter((p) => projectValue(p) > 0).length,
  };
}

function categoryTotals({ orders, projects }, categoryOf) {
  const totals = Object.fromEntries(categories.map((c) => [c.id, 0]));
  orders.forEach((o) =>
    o.items.forEach((i) => {
      const cat = categoryOf[i.productId] ?? 'custom';
      totals[cat] = (totals[cat] ?? 0) + i.price * i.qty;
    })
  );
  totals.digital = sum(projects, projectValue);
  totals.delivery = sum(orders, (o) => o.deliveryFee ?? 0);
  return totals;
}

export function salesReport(data, period) {
  const cur = slice(data, period.start, period.end);
  const prev = slice(data, period.prevStart, period.prevEnd);
  const t = salesTotals(cur);
  const p = salesTotals(prev);
  const categoryOf = CATEGORY_OF(data.products);

  const series = buckets(period).map((b) => {
    const s = salesTotals(slice(data, b.start, b.end));
    return { label: b.label, tip: b.tip, values: { shop: s.shop, digital: s.digital }, meta: `${plural(s.orders, 'order')}, ${plural(s.jobs, 'digital job')}` };
  });

  const ct = categoryTotals(cur, categoryOf);
  const cp = categoryTotals(prev, categoryOf);
  const catRows = [
    ...categories.map((c) => ({ id: c.id, label: c.name, value: ct[c.id], prev: cp[c.id] })),
    { id: 'digital', label: 'Digital services', value: ct.digital, prev: cp.digital },
  ]
    .sort((a, b) => b.value - a.value)
    .concat({ id: 'delivery', label: 'Delivery fees', value: ct.delivery, prev: cp.delivery, muted: true })
    .map((r) => ({ ...r, share: t.revenue ? r.value / t.revenue : 0 }));

  const productMap = new Map();
  cur.orders.forEach((o) =>
    o.items.forEach((i) => {
      const row = productMap.get(i.productId) ?? { id: i.productId, label: i.name, units: 0, revenue: 0, orders: 0 };
      row.units += i.qty;
      row.revenue += i.qty * i.price;
      row.orders += 1;
      productMap.set(i.productId, row);
    })
  );
  const itemSales = t.shop - t.deliveryFees;
  const topProducts = [...productMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((r) => ({ ...r, share: itemSales ? r.revenue / itemSales : 0 }));

  const count = (list, fn) => list.filter(fn).length;
  const payment = [
    { id: 'gcash', label: 'GCash', value: count(cur.orders, (o) => o.payment === 'gcash'), color: SERIES.digital },
    { id: 'cash', label: 'Cash at the counter', value: count(cur.orders, (o) => o.payment === 'cash'), color: SERIES.shop },
    { id: 'maya', label: 'Maya', value: count(cur.orders, (o) => o.payment === 'maya'), color: SERIES.third },
  ];
  const handoff = [
    { id: 'pickup', label: 'Pickup at the shop', value: count(cur.orders, (o) => o.fulfillment === 'pickup'), color: SERIES.shop },
    { id: 'delivery', label: 'Delivery', value: count(cur.orders, (o) => o.fulfillment === 'delivery'), color: SERIES.digital },
  ];

  const findings = [];
  if (t.revenue) {
    findings.push(`Revenue was ${formatPeso(t.revenue)}${changeWords(t.revenue, p.revenue, period.against)}.`);
    const lead = catRows[0];
    findings.push(`${lead.label} brought in the most: ${formatPeso(lead.value)}, or ${pct(lead.share)} of revenue.`);
    const grower = catRows
      .filter((r) => !r.muted && r.prev > 0 && r.value > 0)
      .map((r) => ({ ...r, c: change(r.value, r.prev) }))
      .sort((a, b) => b.c - a.c)[0];
    if (period.against && grower && grower.c > 0.05) findings.push(`${grower.label} grew the fastest, up ${pct(grower.c)} from ${period.against}.`);
    const best = series.reduce((a, b) => (b.values.shop + b.values.digital > a.values.shop + a.values.digital ? b : a), series[0]);
    if (period.unit !== 'day' && best)
      findings.push(`The best ${period.unit} was ${best.tip.replace(' (so far)', '')}, with ${formatPeso(best.values.shop + best.values.digital)}.`);
    if (topProducts[0]) findings.push(`The best seller was ${topProducts[0].label}: ${plural(topProducts[0].units, 'pc', 'pcs')} for ${formatPeso(topProducts[0].revenue)}.`);
    const online = payment[0].value + payment[2].value;
    if (t.orders) findings.push(`${pct(online / t.orders)} of orders were paid by GCash or Maya; the rest paid cash at the counter.`);
  } else {
    findings.push('No sales in this period yet.');
  }

  return {
    totals: t,
    prev: p,
    series,
    categories: catRows,
    topProducts,
    payment,
    handoff,
    findings,
    orders: cur.orders,
    projects: cur.projects.filter((x) => projectValue(x) > 0),
  };
}

// ------------------------------------------------------------------
// Products and stock
// ------------------------------------------------------------------
function unitsByProduct(orders) {
  const map = new Map();
  orders.forEach((o) =>
    o.items.forEach((i) => {
      const row = map.get(i.productId) ?? { units: 0, revenue: 0, orders: 0, lastSold: null };
      row.units += i.qty;
      row.revenue += i.qty * i.price;
      row.orders += 1;
      if (!row.lastSold || o.createdAt > row.lastSold) row.lastSold = o.createdAt;
      map.set(i.productId, row);
    })
  );
  return map;
}

export function productsReport(data, period) {
  const cur = unitsByProduct(slice(data, period.start, period.end).orders);
  const prev = unitsByProduct(slice(data, period.prevStart, period.prevEnd).orders);
  const lastEver = unitsByProduct(data.orders);
  const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const rows = data.products.map((p) => {
    const u = cur.get(p.id) ?? { units: 0, revenue: 0, orders: 0 };
    const stocked = p.stock !== null && p.stock !== undefined;
    const perDay = u.units / period.days;
    return {
      id: p.id,
      name: p.name,
      product: p,
      category: p.category,
      categoryLabel: catName[p.category],
      price: p.price,
      active: p.active !== false,
      stocked,
      stock: stocked ? p.stock : null,
      level: stockLevel(p.stock),
      units: u.units,
      revenue: u.revenue,
      orders: u.orders,
      prevUnits: prev.get(p.id)?.units ?? 0,
      lastSold: lastEver.get(p.id)?.lastSold ?? null,
      perDay,
      daysLeft: stocked ? (p.stock === 0 ? 0 : perDay > 0 ? p.stock / perDay : Infinity) : null,
      reorder: stocked ? Math.max(0, Math.ceil(perDay * 30 - p.stock)) : null,
    };
  });

  const stocked = rows.filter((r) => r.stocked && r.active);
  const coverage = [...stocked].sort((a, b) => a.daysLeft - b.daysLeft || b.units - a.units);
  const slow = rows.filter((r) => r.active && r.units === 0).sort((a, b) => (a.lastSold ?? '').localeCompare(b.lastSold ?? ''));
  const madeToOrder = rows.filter((r) => !r.stocked && r.units > 0).sort((a, b) => b.revenue - a.revenue);

  const byCategory = categories
    .map((c) => ({ id: c.id, label: c.name, value: sum(rows.filter((r) => r.category === c.id), (r) => r.units) }))
    .sort((a, b) => b.value - a.value);

  const totals = {
    units: sum(rows, (r) => r.units),
    prevUnits: sum(rows, (r) => r.prevUnits),
    sold: rows.filter((r) => r.units > 0).length,
    active: rows.filter((r) => r.active).length,
    stockValue: sum(stocked, (r) => r.stock * r.price),
    stockUnits: sum(stocked, (r) => r.stock),
    low: stocked.filter((r) => r.level === 'low').length,
    out: stocked.filter((r) => r.level === 'out').length,
    slow: slow.length,
    runningOut: coverage.filter((r) => r.daysLeft <= 14).length,
  };

  const findings = [];
  findings.push(`${plural(totals.units, 'item')} sold${changeWords(totals.units, totals.prevUnits, period.against)}.`);
  const soon = coverage.filter((r) => r.daysLeft > 0 && r.daysLeft <= 14);
  const out = coverage.filter((r) => r.daysLeft === 0);
  if (out.length) findings.push(`Out of stock now: ${out.map((r) => r.name).join(', ')}.`);
  if (soon.length)
    findings.push(
      `At this period's pace, ${plural(soon.length, 'item')} run out within two weeks: ${soon
        .slice(0, 3)
        .map((r) => `${r.name} (${Math.max(1, Math.round(r.daysLeft))} days)`)
        .join(', ')}.`
    );
  if (byCategory[0]?.value) findings.push(`${byCategory[0].label} moved the most units: ${plural(byCategory[0].value, 'pc', 'pcs')}.`);
  if (slow.length) findings.push(`${plural(slow.length, 'product')} did not sell in this period. See the list of slow movers.`);
  findings.push(`Stock on the shelves is worth ${formatPeso(totals.stockValue)} at selling price.`);

  return { rows, coverage, slow, madeToOrder, byCategory, totals, findings, lowAt: LOW_STOCK_AT };
}

// ------------------------------------------------------------------
// Digital Help Hub
// ------------------------------------------------------------------
function hubTotals(created, completed) {
  const priced = created.filter((p) => projectValue(p) > 0);
  const onTime = completed.filter((p) => doneAt(p).slice(0, 10) <= p.deadline);
  const withBudget = priced.filter((p) => p.budget);
  return {
    requests: created.length,
    completed: completed.length,
    value: sum(priced, projectValue),
    avgPrice: priced.length ? Math.round(sum(priced, projectValue) / priced.length) : 0,
    onTime: completed.length ? onTime.length / completed.length : null,
    turnaround: completed.length ? sum(completed, (p) => (new Date(doneAt(p)) - new Date(p.createdAt)) / DAY) / completed.length : null,
    rush: created.filter((p) => p.rush).length,
    withinBudget: withBudget.length ? withBudget.filter((p) => p.price <= p.budget).length / withBudget.length : null,
  };
}

export function digitalReport(data, period) {
  const completedIn = (a, b) => data.projects.filter((p) => doneAt(p) && within(doneAt(p), a, b));
  const created = slice(data, period.start, period.end).projects;
  const completed = completedIn(period.start, period.end);
  const t = hubTotals(created, completed);
  const p = hubTotals(slice(data, period.prevStart, period.prevEnd).projects, completedIn(period.prevStart, period.prevEnd));

  const series = buckets(period).map((b) => ({
    label: b.label,
    tip: b.tip,
    values: { requests: data.projects.filter((x) => within(x.createdAt, b.start, b.end)).length },
  }));

  const services = digitalServices
    .filter((s) => s.id !== 'rush')
    .map((s) => {
      const c = created.filter((x) => x.serviceId === s.id);
      const d = completed.filter((x) => x.serviceId === s.id);
      const h = hubTotals(c, d);
      return { id: s.id, label: s.short, name: s.name, ...h };
    })
    .filter((r) => r.requests || r.completed)
    .sort((a, b) => b.requests - a.requests || b.value - a.value);

  const open = data.projects.filter((x) => x.status !== 'completed');
  const pipeline = STATUS_FLOW.filter((s) => s !== 'completed').map((s) => ({
    id: s,
    label: statusLabel(s, 'project'),
    value: open.filter((x) => x.status === s).length,
  }));

  const withRounds = completed.filter((x) => typeof x.revisions === 'number');
  const rounds = [
    { id: 'r0', label: 'Approved on the first draft', value: withRounds.filter((x) => x.revisions === 0).length, color: SERIES.shop },
    { id: 'r1', label: 'One round of changes', value: withRounds.filter((x) => x.revisions === 1).length, color: SERIES.digital },
    { id: 'r2', label: 'Two or more rounds', value: withRounds.filter((x) => x.revisions >= 2).length, color: SERIES.third },
  ];

  const findings = [];
  if (t.requests) {
    findings.push(`${plural(t.requests, 'request')} came in${changeWords(t.requests, p.requests, period.against)}, worth ${formatPeso(t.value)} in confirmed prices.`);
    if (services[0]) findings.push(`${services[0].name} was the most requested service (${services[0].requests}).`);
  } else {
    findings.push('No digital requests came in during this period.');
  }
  if (t.completed) {
    findings.push(`${pct(t.onTime)} of the ${plural(t.completed, 'finished job')} were delivered by the customer's deadline, in ${t.turnaround.toFixed(1)} days on average.`);
  }
  if (t.withinBudget !== null) findings.push(`${pct(t.withinBudget)} of quotes were within the customer's stated budget.`);
  const waiting = open.filter((x) => x.status === 'pending' && !x.price).length;
  if (waiting) findings.push(`${plural(waiting, 'request')} ${waiting === 1 ? 'is' : 'are'} still waiting for a quotation.`);

  return { totals: t, prev: p, series, services, pipeline, rounds, findings, created, completed };
}

// ------------------------------------------------------------------
// Customers
// ------------------------------------------------------------------
// "Lalud, Calapan" for city barangays, the town name for everywhere else.
export function locality(address = '') {
  const parts = address.split(',').map((s) => s.trim());
  if (/calapan/i.test(address)) return { id: parts[0], label: parts[0].replace(/^Brgy\.\s*/, ''), calapan: true };
  const town = parts[1] ?? parts[0] ?? 'Unknown';
  return { id: town, label: town, calapan: false };
}

export function customersReport(data, period) {
  const byId = Object.fromEntries(data.customers.map((c) => [c.id, c]));
  const purchases = [...data.orders.map((o) => ({ id: o.customer.id, at: o.createdAt, value: o.total, kind: 'order' })), ...data.projects.map((p) => ({ id: p.customer.id, at: p.createdAt, value: projectValue(p), kind: 'project' }))];
  const first = {};
  purchases.forEach((x) => {
    if (!first[x.id] || x.at < first[x.id]) first[x.id] = x.at;
  });

  const summarize = (a, b) => {
    const inRange = purchases.filter((x) => within(x.at, a, b));
    const buyers = new Map();
    inRange.forEach((x) => {
      const row = buyers.get(x.id) ?? { id: x.id, orders: 0, projects: 0, spent: 0, last: x.at, months: new Set() };
      row.months.add(x.at.slice(0, 7));
      row[x.kind === 'order' ? 'orders' : 'projects'] += 1;
      row.spent += x.value;
      if (x.at > row.last) row.last = x.at;
      buyers.set(x.id, row);
    });
    const list = [...buyers.values()];
    const fresh = list.filter((r) => within(first[r.id], a, b));
    const revenue = sum(list, (r) => r.spent);
    return {
      list,
      buyers: list.length,
      newBuyers: fresh.length,
      returning: list.length - fresh.length,
      repeat: list.filter((r) => r.orders + r.projects >= 2).length,
      cameBack: list.filter((r) => r.months.size >= 2).length,
      revenue,
      avgSpend: list.length ? Math.round(revenue / list.length) : 0,
      signups: data.customers.filter((c) => within(c.createdAt, a, b)).length,
    };
  };
  const t = summarize(period.start, period.end);
  const p = summarize(period.prevStart, period.prevEnd);

  const series = buckets(period).map((b) => {
    const s = summarize(b.start, b.end);
    return { label: b.label, tip: b.tip, values: { newBuyers: s.newBuyers, returning: s.returning } };
  });

  const ranked = [...t.list]
    .sort((a, b) => b.spent - a.spent)
    .map((r) => ({ ...r, name: byId[r.id]?.fullName ?? 'Unknown', since: first[r.id], place: locality(byId[r.id]?.address).label, share: t.revenue ? r.spent / t.revenue : 0 }));
  const top = ranked.slice(0, 10);

  const places = new Map();
  t.list.forEach((r) => {
    const loc = locality(byId[r.id]?.address);
    const row = places.get(loc.id) ?? { id: loc.id, label: loc.calapan ? `${loc.label}, Calapan` : loc.label, value: 0, revenue: 0, calapan: loc.calapan };
    row.value += 1;
    row.revenue += r.spent;
    places.set(loc.id, row);
  });
  const placeRows = [...places.values()].sort((a, b) => b.value - a.value || b.revenue - a.revenue);
  const inCity = placeRows.filter((r) => r.calapan);
  const cityShare = [
    { id: 'city', label: 'Calapan City', value: sum(inCity, (r) => r.value), color: SERIES.shop },
    { id: 'province', label: 'Other towns in Oriental Mindoro', value: sum(placeRows.filter((r) => !r.calapan), (r) => r.value), color: SERIES.digital },
  ];

  const findings = [];
  if (t.buyers) {
    if (period.against) {
      findings.push(`${plural(t.buyers, 'customer')} bought something${changeWords(t.buyers, p.buyers, period.against)}. ${t.newBuyers} of them ${t.newBuyers === 1 ? 'was' : 'were'} buying for the first time.`);
      findings.push(`${pct(t.returning / t.buyers)} were returning customers, and ${pct(t.repeat / t.buyers)} bought more than once in this period.`);
    } else {
      // Every customer's first online purchase falls inside the 12 months.
      findings.push(`${plural(t.buyers, 'customer')} bought something since online orders began.`);
      findings.push(`${pct(t.cameBack / t.buyers)} came back to buy again in a later month.`);
    }
    const top3 = sum(top.slice(0, 3), (r) => r.spent);
    if (t.revenue) findings.push(`The top 3 customers made up ${pct(top3 / t.revenue)} of sales. ${top[0].name} spent the most (${formatPeso(top[0].spent)}).`);
    const outside = `${pct(cityShare[1].value / t.buyers)} came from outside Calapan City.`;
    if (placeRows[0]?.value >= 2) findings.push(`Most customers came from ${placeRows[0].label} (${placeRows[0].value}). ${outside}`);
    else findings.push(`Customers came from ${plural(placeRows.length, 'different barangay or town', 'different barangays and towns')}. ${outside}`);
  } else {
    findings.push('No customers bought anything in this period yet.');
  }

  return { totals: t, prev: p, series, top, ranked, places: placeRows, cityShare, findings };
}

// ------------------------------------------------------------------
// Operations: speed, busy hours, team workload, and aging open work
// ------------------------------------------------------------------
export const HOUR_BLOCKS = [
  { from: 6, label: '6 AM' },
  { from: 8, label: '8 AM' },
  { from: 10, label: '10 AM' },
  { from: 12, label: '12 NN' },
  { from: 14, label: '2 PM' },
  { from: 16, label: '4 PM' },
  { from: 18, label: '6 PM' },
  { from: 20, label: '8 PM' },
  { from: 22, label: '10 PM' },
];
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const blockOf = (h) => {
  if (h < 6) return HOUR_BLOCKS.length - 1; // after midnight counts as late night
  return Math.min(HOUR_BLOCKS.length - 1, Math.floor((h - 6) / 2));
};
const blockText = (i) => {
  const end = i + 1 < HOUR_BLOCKS.length ? HOUR_BLOCKS[i + 1].label : '12 MN';
  return `${HOUR_BLOCKS[i].label} to ${end}`;
};
export const hoursText = (h) => (h < 1 ? `${Math.round(h * 60)} minutes` : `${h.toFixed(1)} hours`);

export function operationsReport(data, period, now = new Date()) {
  const cur = slice(data, period.start, period.end);
  const isCustom = (o) => o.items.some((i) => i.productId.startsWith('cus-') || i.productId.startsWith('new-'));

  const approveHours = (list) =>
    median(list.map((x) => stepAt(x, 'approved') && (new Date(stepAt(x, 'approved')) - new Date(x.createdAt)) / HOUR).filter((v) => v !== null && v > 0));
  const finishDays = (list) => median(list.filter(doneAt).map((x) => (new Date(doneAt(x)) - new Date(x.createdAt)) / DAY));
  const prevSlice = slice(data, period.prevStart, period.prevEnd);

  const speed = {
    approve: approveHours(cur.orders),
    prevApprove: approveHours(prevSlice.orders),
    stockDays: finishDays(cur.orders.filter((o) => !isCustom(o))),
    customDays: finishDays(cur.orders.filter(isCustom)),
    quoteHours: approveHours(cur.projects),
    prevQuoteHours: approveHours(prevSlice.projects),
  };

  // Weekday × two-hour block, orders and requests together.
  const grid = WEEKDAYS.map(() => HOUR_BLOCKS.map(() => 0));
  [...cur.orders, ...cur.projects].forEach((x) => {
    const d = new Date(x.createdAt);
    grid[(d.getDay() + 6) % 7][blockOf(d.getHours())] += 1;
  });
  let peak = { day: 0, block: 0, value: 0 };
  grid.forEach((row, day) => row.forEach((value, block) => value > peak.value && (peak = { day, block, value })));

  // Status changes each team member made in the period.
  const work = new Map();
  [...data.orders, ...data.projects].forEach((item) =>
    item.history.forEach((h) => {
      if (!h.by || !within(h.at, period.start, period.end)) return;
      const row = work.get(h.by) ?? { name: h.by, orders: new Set(), projects: new Set(), updates: 0 };
      row[item.kind === 'order' ? 'orders' : 'projects'].add(item.ref);
      row.updates += 1;
      work.set(h.by, row);
    })
  );
  const teamByName = Object.fromEntries((data.team ?? []).map((m) => [m.fullName, m]));
  const team = [...work.values()]
    .map((r) => ({ name: r.name, title: teamByName[r.name]?.title ?? '', active: teamByName[r.name]?.active !== false, orders: r.orders.size, projects: r.projects.size, updates: r.updates }))
    .sort((a, b) => b.updates - a.updates);

  // Open work by how long it has been waiting.
  const ages = [
    { label: 'Under 1 day', max: 1 },
    { label: '1 to 3 days', max: 3 },
    { label: '4 to 7 days', max: 7 },
    { label: 'Over a week', max: Infinity },
  ];
  const ageOf = (x) => (now - new Date(x.createdAt)) / DAY;
  const bucketOf = (x) => ages.findIndex((a) => ageOf(x) < a.max);
  const openOrders = data.orders.filter((o) => o.status !== 'completed');
  const openProjects = data.projects.filter((p) => p.status !== 'completed');
  const aging = ages.map((a, i) => ({
    label: a.label,
    tip: `Open for ${a.label.toLowerCase()}`,
    values: { orders: openOrders.filter((x) => bucketOf(x) === i).length, projects: openProjects.filter((x) => bucketOf(x) === i).length },
  }));

  const findings = [];
  if (speed.approve !== null) findings.push(`New orders were approved in a median of ${hoursText(speed.approve)}${speed.prevApprove && period.against ? ` (${hoursText(speed.prevApprove)} in ${period.against})` : ''}.`);
  if (speed.stockDays !== null && speed.customDays !== null)
    findings.push(`Orders for items on the shelf were finished in a median of ${speed.stockDays.toFixed(1)} days; custom orders took ${speed.customDays.toFixed(1)} days, including proof approval.`);
  if (peak.value) findings.push(`The busiest time was ${WEEKDAYS[peak.day]}s, ${blockText(peak.block)}, with ${plural(peak.value, 'order or request', 'orders and requests')}.`);
  if (team[0]) findings.push(`${team[0].name} made the most updates (${team[0].updates}), across ${plural(team[0].orders, 'order')} and ${plural(team[0].projects, 'digital request')}.`);
  const stale = aging[3].values.orders + aging[3].values.projects;
  if (stale) findings.push(`${plural(stale, 'open item')} ${stale === 1 ? 'has' : 'have'} been waiting for over a week.`);

  return { speed, grid, peak, blockText, team, aging, findings };
}

// ------------------------------------------------------------------
// CSV
// ------------------------------------------------------------------
const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// columns: [{ label, value: (row) => any }]
export function toCsv(rows, columns) {
  return [columns.map((c) => csvCell(c.label)).join(','), ...rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(','))].join('\r\n');
}

export function downloadCsv(filename, csv) {
  // The BOM makes Excel read the peso sign and accents correctly.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
