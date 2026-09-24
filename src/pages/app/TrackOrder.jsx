import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Route, Search } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import StatusTimeline from '../../components/ui/StatusTimeline';
import EmptyState from '../../components/ui/EmptyState';
import { useAccount } from '../../context/AccountContext';
import { isActive } from '../../data/statuses';

export default function TrackOrder() {
  const { orders, projects, findByRef, loading } = useAccount();
  const navigate = useNavigate();
  const [ref, setRef] = useState('');
  const [error, setError] = useState('');

  const active = [...orders, ...projects]
    .filter((i) => isActive(i.status))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const submit = (e) => {
    e.preventDefault();
    const clean = ref.trim().toUpperCase();
    if (!clean) {
      setError('Enter a reference number, like GAC-ORD-01047 or GAC-DIG-00125.');
      return;
    }
    if (!findByRef(clean)) {
      setError(`We couldn't find ${clean} in your account. Check the number on your receipt or confirmation screen.`);
      return;
    }
    navigate(`/app/track/${clean}`);
  };

  return (
    <div className="page">
      <PageHeader title="Track Order" description="Follow any order or digital project from Pending to Completed." />

      <form className="track-search" onSubmit={submit} noValidate>
        <label htmlFor="ref" className="h4">
          Reference number
        </label>
        <div className="track-search__row">
          <div className="input-wrap">
            <Search size={18} aria-hidden="true" />
            <input
              id="ref"
              className="input num"
              value={ref}
              onChange={(e) => {
                setRef(e.target.value);
                setError('');
              }}
              placeholder="GAC-ORD-01047"
              autoComplete="off"
              aria-invalid={!!error}
              aria-describedby={error ? 'ref-err' : 'ref-hint'}
            />
          </div>
          <button type="submit" className="btn btn--primary btn--lg" disabled={loading}>
            Track
          </button>
        </div>
        {error ? (
          <p id="ref-err" className="error">
            {error}
          </p>
        ) : (
          <p id="ref-hint" className="hint">
            Orders start with GAC-ORD. Digital projects start with GAC-DIG.
          </p>
        )}
      </form>

      <section aria-labelledby="active-title" className="track-active">
        <h2 id="active-title" className="h3">
          Active right now
        </h2>
        {active.length ? (
          <ul className="track-list" role="list">
            {active.map((i) => (
              <li key={i.ref}>
                <Link to={`/app/track/${i.ref}`} className="track-item">
                  <span className="track-item__main">
                    <span className="track-item__ref num">{i.ref}</span>
                    <span className="track-item__title">{i.kind === 'order' ? `${i.items.length} item${i.items.length > 1 ? 's' : ''} from the shop` : i.title}</span>
                  </span>
                  <StatusBadge status={i.status} kind={i.kind} />
                  <span className="track-item__rail">
                    <StatusTimeline item={i} compact />
                  </span>
                  <ChevronRight size={18} aria-hidden="true" className="track-item__chev" />
                </Link>
              </li>
            ))}
          </ul>
        ) : loading ? null : (
          <EmptyState icon={Route} title="Nothing to track right now" body="Orders and projects you place show up here until they are completed.">
            <Link to="/app/shop" className="btn btn--ink">
              Go to the shop
            </Link>
          </EmptyState>
        )}
      </section>
    </div>
  );
}
