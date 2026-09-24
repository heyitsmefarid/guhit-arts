import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '../brand/Logo';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  { href: '#services', label: 'Services' },
  { href: '#studio', label: 'Try a design' },
  { href: '#products', label: 'Products' },
  { href: '#digital-hub', label: 'Digital Help Hub' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
];

export default function PublicHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const onLanding = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Section links work from any public page by routing back to the landing page first.
  const hrefFor = (hash) => (onLanding ? hash : `/${hash}`);

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container site-header__inner">
        <Logo />
        <nav className="site-nav" aria-label="Main">
          {LINKS.map((l) => (
            <a key={l.href} href={hrefFor(l.href)} className="site-nav__link">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="site-header__actions">
          {user ? (
            <Link to={user.role === 'customer' ? '/app' : '/admin'} className="btn btn--ink btn--sm">
              {user.role === 'customer' ? 'Go to dashboard' : 'Go to admin panel'}
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn--text site-header__signin">
                Log in
              </Link>
              <Link to="/signup" className="btn btn--primary btn--sm">
                Sign up
              </Link>
            </>
          )}
          <button
            type="button"
            className="icon-btn site-header__menu"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <div id="mobile-nav" className={`mobile-nav ${open ? 'is-open' : ''}`} hidden={!open}>
        <nav aria-label="Mobile">
          {LINKS.map((l) => (
            <a key={l.href} href={hrefFor(l.href)} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>
        {!user && (
          <div className="mobile-nav__actions">
            <Link to="/login" className="btn btn--ghost btn--block" onClick={() => setOpen(false)}>
              Log in
            </Link>
            <Link to="/signup" className="btn btn--primary btn--block" onClick={() => setOpen(false)}>
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
