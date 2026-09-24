import { Link } from 'react-router-dom';
import RegMark from './RegMark';

export default function Logo({ to = '/', tone = 'ink', compact = false }) {
  return (
    <Link to={to} className={`logo logo--${tone}`} aria-label="Guhit Arts Center home">
      <span className="logo__mark">
        <RegMark size={30} />
      </span>
      <span className="logo__text">
        <span className="logo__word">Guhit</span>
        {!compact && <span className="logo__sub">Arts Center</span>}
      </span>
    </Link>
  );
}
