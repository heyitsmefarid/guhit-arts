// Who can do what in the admin panel.
//   admin: the owner. Everything, including money, prices, customers, and the team.
//   staff: counter and production staff. Runs orders, requests, and stock.
export const STAFF_ROLES = ['admin', 'staff'];

export const ROLE_LABELS = {
  admin: 'Administrator',
  staff: 'Staff',
  customer: 'Customer',
};

const ADMIN_ONLY = new Set([
  'view-sales', // revenue figures and sales charts
  'edit-prices', // product prices and digital quotations
  'manage-products', // add products, hide or show them in the shop
  'view-customers', // customer list and spending
  'manage-team', // staff accounts and roles
  'view-reports', // the Reports page and its CSV downloads
]);

export const isStaffRole = (role) => STAFF_ROLES.includes(role);

export function can(user, permission) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.role === 'staff' && !ADMIN_ONLY.has(permission);
}
