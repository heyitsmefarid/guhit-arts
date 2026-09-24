import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Boxes, ChartColumn, ExternalLink, LayoutDashboard, LogOut, Menu, Package, Search, ShieldCheck, Sparkles, UserCog, Users, X } from 'lucide-react';
import Logo from '../brand/Logo';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminProvider, useAdmin } from '../../context/AdminContext';
import { stockLevel } from '../../data/inventory';
import { ROLE_LABELS, can } from '../../utils/permissions';

function AdminShell() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { orders, projects, products } = useAdmin();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => setDrawer(false), [pathname]);

  const counts = {
    orders: orders.filter((o) => o.status === 'pending').length,
    projects: projects.filter((p) => p.status === 'pending').length,
    products: products.filter((p) => ['low', 'out'].includes(stockLevel(p.stock))).length,
  };

  const NAV = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/orders', label: 'Orders', icon: Package, count: counts.orders, hint: 'new' },
    { to: '/admin/projects', label: 'Digital Requests', icon: Sparkles, count: counts.projects, hint: 'to review' },
    { to: '/admin/products', label: 'Products & Stock', icon: Boxes, count: counts.products, hint: 'low on stock', warn: true },
    { to: '/admin/customers', label: 'Customers', icon: Users, permission: 'view-customers' },
    { to: '/admin/reports', label: 'Reports', icon: ChartColumn, permission: 'view-reports' },
    { to: '/admin/team', label: 'Team', icon: UserCog, permission: 'manage-team' },
  ].filter((item) => !item.permission || can(user, item.permission));

  const onLogout = async () => {
    // Sign out first; otherwise the staff login page sees a signed-in user and bounces back here.
    await logout();
    navigate('/admin/login', { replace: true });
    toast('You are logged out of the admin panel.', { tone: 'info' });
  };

  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(q.toUpperCase().startsWith('GAC-DIG') ? `/admin/projects?q=${encodeURIComponent(q)}` : `/admin/orders?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className={`app admin ${drawer ? 'drawer-open' : ''}`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar admin-sidebar" aria-label="Admin navigation">
        <div className="sidebar__top">
          <Logo to="/admin" tone="light" />
          <button type="button" className="icon-btn sidebar__close" onClick={() => setDrawer(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <p className={`admin-sidebar__badge admin-sidebar__badge--${user.role}`}>
          <ShieldCheck size={14} aria-hidden="true" /> {ROLE_LABELS[user.role]}
        </p>
        <nav className="sidebar__nav">
          {NAV.map(({ to, label, icon: Icon, end, count, hint, warn }) => (
            <NavLink key={to} to={to} end={end} className="side-link">
              <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
              <span>{label}</span>
              {count > 0 && (
                <span className={`side-link__count num ${warn ? 'side-link__count--warn' : ''}`} aria-label={`${count} ${hint}`}>
                  {count}
                </span>
              )}
            </NavLink>
          ))}
          <a href="/" className="side-link" target="_blank" rel="noreferrer">
            <ExternalLink size={19} strokeWidth={1.9} aria-hidden="true" />
            <span>View website</span>
          </a>
          <button type="button" className="side-link side-link--logout" onClick={onLogout}>
            <LogOut size={19} strokeWidth={1.9} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </nav>
        <div className="sidebar__user">
          <Avatar user={user} size={40} />
          <span>
            <strong>{user.fullName}</strong>
            <span className="tiny">{user.title ?? 'Staff'}</span>
          </span>
        </div>
      </aside>
      <button type="button" className="scrim" aria-label="Close menu" tabIndex={-1} onClick={() => setDrawer(false)} />

      <div className="app__main">
        <header className="topbar">
          <button type="button" className="icon-btn topbar__menu" onClick={() => setDrawer(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <form className="topbar__search" role="search" onSubmit={onSearch}>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Find an order, request, or customer…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search orders and requests"
            />
          </form>
          <div className="topbar__actions">
            <p className="admin-date small muted">
              {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            {counts.orders > 0 && (
              <Link to="/admin/orders?status=pending" className="btn btn--sm btn--primary admin-queue">
                {counts.orders} new {counts.orders === 1 ? 'order' : 'orders'}
              </Link>
            )}
          </div>
        </header>
        <main id="main" className="app__content">
          {/* Admin pages load on demand; keep the sidebar while one loads. */}
          <Suspense fallback={<div className="route-loading" aria-busy="true" aria-label="Loading" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminProvider>
      <AdminShell />
    </AdminProvider>
  );
}
