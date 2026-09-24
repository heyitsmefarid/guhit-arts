// Admin panel data: every customer's orders and digital projects, the
// customer list, and inventory. Staff actions write back into the customer's
// account, so the customer sees the change and gets a notification.
// Real endpoints would be /api/admin/orders, /api/admin/projects, etc.
import { storage, delay } from './storage';
import { applyStatus, readAccount } from './accountService';
import { addProduct as addToInventory, allProducts, updateProduct as updateInventory } from './inventoryStore';

const users = () => storage.get('users', []);
const customers = () => users().filter((u) => u.role === 'customer');
const team = () => users().filter((u) => u.role === 'admin' || u.role === 'staff');
const stripPassword = ({ password: _pw, ...rest }) => rest;

const withCustomer = (item, user) => ({
  ...item,
  customer: { id: user.id, name: user.fullName, email: user.email, phone: user.contactNumber, address: user.address },
});

const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

// Everything the admin screens need, in one read.
export async function getAdminData() {
  await delay(250);
  const orders = [];
  const projects = [];
  const customerList = customers().map((u) => {
    const acct = readAccount(u.id);
    acct.orders.forEach((o) => orders.push(withCustomer(o, u)));
    acct.projects.forEach((p) => projects.push(withCustomer(p, u)));
    const all = [...acct.orders, ...acct.projects].sort(byNewest);
    return {
      ...stripPassword(u),
      orderCount: acct.orders.length,
      projectCount: acct.projects.length,
      spent:
        acct.orders.reduce((s, o) => s + o.total, 0) +
        acct.projects.filter((p) => p.status === 'completed').reduce((s, p) => s + (p.price ?? 0), 0),
      lastActivity: all[0]?.createdAt ?? u.createdAt,
    };
  });
  return {
    orders: orders.sort(byNewest),
    projects: projects.sort(byNewest),
    customers: customerList.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity)),
    products: allProducts(),
    team: team().map(stripPassword),
  };
}

const ownerOf = (ref) => {
  const list = ref.startsWith('GAC-ORD') ? 'orders' : 'projects';
  return customers().find((u) => readAccount(u.id)[list].some((i) => i.ref === ref)) ?? null;
};

export async function updateOrderStatus(ref, status, note = '', by = '') {
  await delay(400);
  const owner = ownerOf(ref);
  if (!owner) throw new Error(`Order ${ref} was not found.`);
  return applyStatus(owner.id, ref, status, { note, by });
}

// Status change, price quote, and/or a delivered file for a digital project.
export async function updateProject(ref, { status, price, note = '', deliverable, by = '' } = {}) {
  await delay(400);
  const owner = ownerOf(ref);
  if (!owner) throw new Error(`Project ${ref} was not found.`);
  const current = readAccount(owner.id).projects.find((p) => p.ref === ref);
  const patch = {};
  if (price !== undefined) patch.price = price;
  if (deliverable) patch.deliverables = [...(current.deliverables ?? []), { ...deliverable, at: new Date().toISOString() }];
  return applyStatus(owner.id, ref, status, { note, patch, by });
}

export async function updateProduct(id, patch) {
  await delay(250);
  return updateInventory(id, patch);
}

export async function addProduct(fields) {
  await delay(350);
  const id = `new-${Date.now().toString(36)}`;
  return addToInventory({
    id,
    image: 'none',
    details: [],
    featured: false,
    ...fields,
    leadTime: fields.customizable ? '2–3 days' : undefined,
  });
}

// ------------------------------------------------------------------
// Team (administrator only)
// ------------------------------------------------------------------
export async function addTeamMember({ fullName, email, role, title, password }) {
  await delay(400);
  const all = users();
  const clean = email.trim().toLowerCase();
  if (all.some((u) => u.email === clean)) throw new Error('Someone already uses this email. Use a different one.');
  const member = {
    id: `t-${Date.now().toString(36)}`,
    role,
    active: true,
    fullName: fullName.trim(),
    title: title.trim() || (role === 'admin' ? 'Administrator' : 'Staff'),
    email: clean,
    contactNumber: '',
    address: '',
    avatar: null,
    password, // Mock only. A real backend hashes passwords server-side.
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  };
  storage.set('users', [...all, member]);
  return stripPassword(member);
}

export async function updateTeamMember(id, patch) {
  await delay(300);
  const all = users();
  const idx = all.findIndex((u) => u.id === id);
  if (idx < 0) throw new Error('That team member was not found.');
  const next = { ...all[idx], ...patch };
  const admins = all.map((u, i) => (i === idx ? next : u)).filter((u) => u.role === 'admin' && u.active !== false);
  if (admins.length === 0) throw new Error('The shop needs at least one active administrator.');
  all[idx] = next;
  storage.set('users', all);
  return stripPassword(next);
}
