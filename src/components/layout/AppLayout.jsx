import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Route,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
  X,
} from 'lucide-react';
import Logo from '../brand/Logo';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/shop', label: 'Shop', icon: Store },
  { to: '/app/services', label: 'Digital Services', icon: Sparkles },
  { to: '/app/orders', label: 'My Orders', icon: Package },
  { to: '/app/projects', label: 'My Projects', icon: FolderKanban },
  { to: '/app/track', label: 'Track Order', icon: Route },
  { to: '/app/notifications', label: 'Notifications', icon: Bell, badge: 'unread' },
  { to: '/app/profile', label: 'Profile', icon: UserRound },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useAccount();
  const { count } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => setDrawer(false), [pathname]);

  const onLogout = async () => {
    // Leave the protected area first so the auth guard doesn't redirect to the login page.
    navigate('/');
    await logout();
    toast('You are logged out. See you again soon.', { tone: 'info' });
  };

  const onSearch = (e) => {
    e.preventDefault();
    navigate(`/app/shop${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  };

  return (
    <div className={`app ${drawer ? 'drawer-open' : ''}`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar" aria-label="Account navigation">
        <div className="sidebar__top">
          <Logo to="/" />
          <button type="button" className="icon-btn sidebar__close" onClick={() => setDrawer(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar__nav">
          {NAV.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end} className="side-link">
              <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
              <span>{label}</span>
              {badge === 'unread' && unreadCount > 0 && (
                <span className="side-link__count num" aria-label={`${unreadCount} unread`}>
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
          <button type="button" className="side-link side-link--logout" onClick={onLogout}>
            <LogOut size={19} strokeWidth={1.9} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </nav>
        <Link to="/app/profile" className="sidebar__user">
          <Avatar user={user} size={40} />
          <span>
            <strong>{user.fullName}</strong>
            <span className="tiny muted">{user.email}</span>
          </span>
        </Link>
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
              placeholder="Search art supplies, bond paper, jerseys…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
          </form>
          <div className="topbar__actions">
            {/* Keys restart the wiggle and pop animations whenever the counts change. */}
            <Link to="/app/notifications" className="icon-btn" aria-label={`Notifications, ${unreadCount} unread`}>
              <Bell key={unreadCount} size={21} className={unreadCount ? 'bell-ring' : ''} />
              {unreadCount > 0 && (
                <span key={`n${unreadCount}`} className="count num count--pop">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link to="/app/cart" className="icon-btn" aria-label={`Cart, ${count} items`} data-cart-target>
              <ShoppingBag size={21} />
              {count > 0 && (
                <span key={`c${count}`} className="count num count--pop">
                  {count}
                </span>
              )}
            </Link>
            <Link to="/app/profile" className="topbar__avatar" aria-label="Profile">
              <Avatar user={user} size={36} />
            </Link>
          </div>
        </header>
        <main id="main" className="app__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
