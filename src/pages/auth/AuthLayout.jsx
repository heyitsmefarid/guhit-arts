import { Link } from 'react-router-dom';
import { ArrowLeft, FolderKanban, Route, Store } from 'lucide-react';
import Logo from '../../components/brand/Logo';
import GuhitStroke from '../../components/brand/GuhitStroke';

const PERKS = [
  { icon: Store, text: 'Order supplies and custom goods, then pick them up at the shop' },
  { icon: FolderKanban, text: 'Request resumes, slides, pubmats, and other digital work' },
  { icon: Route, text: 'Track every order and project from pending to completed' },
];

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  artTitle = 'Your account at the shop, open all day.',
  perks = PERKS,
}) {
  return (
    <div className="auth">
      <div className="auth__form-side">
        <div className="auth__top">
          <Logo />
          <Link to="/" className="btn btn--text auth__back">
            <ArrowLeft size={16} aria-hidden="true" /> Back to site
          </Link>
        </div>
        <main className="auth__main">
          <h1 className="h1">{title}</h1>
          {subtitle && <p className="auth__subtitle">{subtitle}</p>}
          {children}
          {footer && <div className="auth__footer">{footer}</div>}
        </main>
      </div>
      <aside className="auth__art" aria-hidden="true">
        <div className="auth__art-inner">
          <p className="auth__art-title">{artTitle}</p>
          <GuhitStroke className="auth__stroke" />
          <ul className="auth__perks" role="list">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span>
                  <Icon size={20} />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <p className="auth__since hand">Serving Calapan since 1979</p>
        </div>
      </aside>
    </div>
  );
}
