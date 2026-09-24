import { Link } from 'react-router-dom';
import RegMark from '../components/brand/RegMark';

export default function NotFound() {
  return (
    <main className="notfound">
      <RegMark size={64} />
      <h1 className="h1">This page is off the sheet</h1>
      <p className="muted">The link may be old or mistyped. Head back and try again from the menu.</p>
      <div className="notfound__actions">
        <Link to="/" className="btn btn--ink">
          Go to the home page
        </Link>
        <Link to="/app" className="btn btn--ghost">
          Go to my dashboard
        </Link>
      </div>
    </main>
  );
}
