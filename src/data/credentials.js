// Hard-coded login accounts for the prototype.
//
// These always work: after "Reset demo data", in a new browser, or with cleared
// storage. To change a login, edit the email or password here. Emails are
// matched without regard to capital letters; passwords must match exactly.
//
// Roles:
//   customer: the customer platform at /app
//   admin:    the owner; full admin panel at /admin (sales, prices, customers, team)
//   staff:    shop staff; admin panel for orders, requests, and stock only
//
// Prototype only. A real system keeps accounts on a server and never ships
// passwords in front-end code.
import { adminUser, demoUser, staffUser, studentUser } from './seed';

export const HARDCODED_ACCOUNTS = [
  {
    email: 'demo@guhitarts.ph',
    password: 'guhit1979',
    role: 'customer',
    label: 'Customer with orders and digital projects',
    user: demoUser,
  },
  {
    email: 'student@guhitarts.ph',
    password: 'student123',
    role: 'customer',
    label: 'Student customer with a few orders',
    user: studentUser,
  },
  {
    email: 'admin@guhitarts.ph',
    password: 'admin1979',
    role: 'admin',
    label: 'Administrator: full access, including sales, prices, and team',
    user: adminUser,
  },
  {
    email: 'staff@guhitarts.ph',
    password: 'staff1979',
    role: 'staff',
    label: 'Staff: orders, digital requests, and stock',
    user: staffUser,
  },
];

export const findHardcodedByEmail = (email) =>
  HARDCODED_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());

export const findHardcodedById = (id) => HARDCODED_ACCOUNTS.find((a) => a.user.id === id);

export const customerAccounts = HARDCODED_ACCOUNTS.filter((a) => a.role === 'customer');
export const staffAccounts = HARDCODED_ACCOUNTS.filter((a) => a.role !== 'customer');
