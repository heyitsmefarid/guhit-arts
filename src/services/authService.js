// Mock authentication backed by localStorage.
// To connect a real backend, keep these function signatures and replace the
// bodies with API calls (e.g. POST /api/auth/login), returning the same shapes.
import { storage, tabStorage, delay } from './storage';
import { SEED_VERSION, buildNewAccount, buildSampleAccounts, initialCounters, sampleCustomers, sampleTeam } from '../data/seed';
import { HARDCODED_ACCOUNTS, findHardcodedByEmail, findHardcodedById } from '../data/credentials';

const USERS = 'users';
const SESSION = 'session';

// Each tab keeps its own session; the shared copy lets a newly opened tab start
// signed in as whoever logged in most recently.
const readSession = () => tabStorage.get(SESSION) ?? storage.get(SESSION);
const writeSession = (userId) => {
  const s = { userId, at: new Date().toISOString() };
  tabStorage.set(SESSION, s);
  storage.set(SESSION, s);
};
const clearSession = () => {
  tabStorage.remove(SESSION);
  storage.remove(SESSION);
};

const profileFor = (account) => ({ ...account.user, role: account.role, email: account.email.trim().toLowerCase() });

// Makes sure the built-in accounts and sample customers exist with their
// sample history, so the logins and the admin panel always have data, even
// after storage is cleared or reset. Browsers holding an older version of the
// sample data are reset to the current one.
export function ensureSeeded() {
  if (storage.get('seedVersion') !== SEED_VERSION) {
    storage.clearAll();
    storage.set('seedVersion', SEED_VERSION);
  }
  const all = storage.get(USERS, []);
  const profiles = [...HARDCODED_ACCOUNTS.map(profileFor), ...sampleCustomers, ...sampleTeam];
  const missing = profiles.filter((p) => !all.some((u) => u.id === p.id));
  if (missing.length) storage.set(USERS, [...all, ...missing]);

  const samples = buildSampleAccounts();
  for (const p of profiles) {
    if (p.role !== 'customer' || storage.get(`account.${p.id}`)) continue;
    storage.set(`account.${p.id}`, samples[p.id] ?? buildNewAccount(p.fullName.split(' ')[0]));
  }
  if (!storage.get('counters')) storage.set('counters', initialCounters);
}

const publicUser = (u) => {
  if (!u) return null;
  const { password: _password, ...rest } = u;
  return rest;
};

const normalizeEmail = (email) => email.trim().toLowerCase();
const users = () => storage.get(USERS, []);

export function getSessionUser() {
  ensureSeeded();
  const session = readSession();
  if (!session) return null;
  const user = users().find((u) => u.id === session.userId);
  if (user) tabStorage.set(SESSION, session);
  return publicUser(user);
}

export async function login({ email, password }) {
  await delay(500);
  ensureSeeded();
  const clean = normalizeEmail(email);
  // Hard-coded accounts are checked against data/credentials.js, never storage.
  // If one of them changed its email in Profile, the new email also works.
  const hard = findHardcodedByEmail(clean);
  const user = hard
    ? (users().find((u) => u.id === hard.user.id) ?? profileFor(hard))
    : users().find((u) => u.email === clean);
  const expected = hard ? hard.password : user && (findHardcodedById(user.id)?.password ?? user.password);
  if (!user || expected !== password) {
    throw new Error("That email and password don't match an account. Check both and try again.");
  }
  if (user.active === false) {
    throw new Error('This account has been deactivated. Ask the shop administrator to turn it back on.');
  }
  const all = users();
  const idx = all.findIndex((u) => u.id === user.id);
  const signedIn = { ...user, lastLoginAt: new Date().toISOString() };
  if (idx >= 0) {
    all[idx] = signedIn;
    storage.set(USERS, all);
  }
  writeSession(user.id);
  return publicUser(signedIn);
}

export async function signup({ fullName, email, contactNumber, password }) {
  await delay(600);
  ensureSeeded();
  const all = users();
  const cleanEmail = normalizeEmail(email);
  if (all.some((u) => u.email === cleanEmail)) {
    throw new Error('An account with this email already exists. Log in instead, or use a different email.');
  }
  const user = {
    id: `u-${Date.now().toString(36)}`,
    role: 'customer',
    fullName: fullName.trim(),
    email: cleanEmail,
    contactNumber: contactNumber.trim(),
    password, // Mock only. A real backend hashes passwords server-side.
    address: '',
    avatar: null,
    createdAt: new Date().toISOString(),
  };
  storage.set(USERS, [...all, user]);
  storage.set(`account.${user.id}`, buildNewAccount(user.fullName.split(' ')[0]));
  writeSession(user.id);
  return publicUser(user);
}

export async function logout() {
  // Clear the session first so a reload right after logging out stays logged out.
  clearSession();
  await delay(150);
}

export async function requestPasswordReset(email) {
  await delay(700);
  // A real backend would email a reset link. The response is the same whether
  // or not the email exists, so the form cannot be used to discover accounts.
  return { sent: true, email: normalizeEmail(email) };
}

export async function updateProfile(userId, patch) {
  await delay(450);
  const all = users();
  const idx = all.findIndex((u) => u.id === userId);
  if (idx < 0) throw new Error('Your session has expired. Log in again to save changes.');
  if (patch.email) {
    const cleanEmail = normalizeEmail(patch.email);
    if (all.some((u) => u.email === cleanEmail && u.id !== userId)) {
      throw new Error('Another account already uses this email.');
    }
    patch = { ...patch, email: cleanEmail };
  }
  const updated = { ...all[idx], ...patch };
  all[idx] = updated;
  if (!storage.set(USERS, all)) {
    throw new Error('The browser storage is full, so the profile could not be saved. Try a smaller photo.');
  }
  return publicUser(updated);
}

// Restores the prototype to its original demo state.
export function resetDemoData() {
  clearSession();
  storage.clearAll();
  ensureSeeded();
}
