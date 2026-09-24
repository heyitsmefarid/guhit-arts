import { Link } from 'react-router-dom';
import Logo from '../brand/Logo';
import ColorBar from '../brand/ColorBar';
import { business } from '../../data/business';

export default function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <ColorBar />
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <Logo tone="light" />
          <p>
            {business.address.line1}
            <br />
            {business.address.line2}
          </p>
        </div>
        <nav className="site-footer__nav" aria-label="Footer">
          <div>
            <p className="site-footer__head">Visit</p>
            <a href="/#services">Services</a>
            <a href="/#products">Products</a>
            <a href="/#digital-hub">Digital Help Hub</a>
            <a href="/#contact">Contact and hours</a>
          </div>
          <div>
            <p className="site-footer__head">Account</p>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Create an account</Link>
            <Link to="/app/track">Track an order</Link>
            <Link to="/admin/login">Staff login</Link>
          </div>
        </nav>
      </div>
      <div className="container site-footer__base">
        <p>
          © {year} {business.name}. Serving Calapan since {business.founded}.
        </p>
        <p>Front-end prototype for an academic business proposal. Products, prices, and accounts are sample data.</p>
      </div>
    </footer>
  );
}
