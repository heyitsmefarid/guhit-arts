import { useEffect } from 'react';
import { Link, Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../ui/EmptyState';
import { can, isStaffRole } from '../../utils/permissions';

// Only allow redirects back into the user's own area, never to other sites.
export const safeNext = (next, role = 'customer') => {
  const home = isStaffRole(role) ? '/admin' : '/app';
  return next && next.startsWith(home) ? next : home;
};

const nextParam = (location) => encodeURIComponent(location.pathname + location.search);

// Customer pages need a signed-in customer. Staff and admins go to the admin panel.
export function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to={`/login?next=${nextParam(location)}`} replace />;
  if (isStaffRole(user.role)) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

// The admin panel needs a staff or administrator account.
export function RequireStaff() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to={`/admin/login?next=${nextParam(location)}`} replace />;
  if (!isStaffRole(user.role)) return <Navigate to="/app" replace />;
  return <Outlet />;
}

// Wraps admin-only pages. Staff see why they can't open it instead of a blank redirect.
export function RequirePermission({ permission, children }) {
  const { user } = useAuth();
  if (can(user, permission)) return children;
  return (
    <div className="page">
      <EmptyState
        icon={ShieldAlert}
        title="Only the administrator can open this page"
        body="Your staff account handles orders, digital requests, and stock. Ask the administrator if you need access."
      >
        <Link to="/admin" className="btn btn--ink">
          Back to the dashboard
        </Link>
      </EmptyState>
    </div>
  );
}

// Login and sign-up pages skip ahead for someone already signed in to that
// area. Someone signed in to the other area still sees the form, so staff can
// sign in as a customer in another tab (and the reverse).
export function GuestOnly({ area = 'customer' }) {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const sameArea = user && isStaffRole(user.role) === (area === 'admin');
  return sameArea ? <Navigate to={safeNext(params.get('next'), user.role)} replace /> : <Outlet />;
}

export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
