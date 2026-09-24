import { Link } from 'react-router-dom';
import { Bell, CheckCircle2, FolderKanban, Hourglass, Package, Route, Sparkles, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import StatusBadge from '../../components/ui/StatusBadge';
import StatusTimeline from '../../components/ui/StatusTimeline';
import CountUp from '../../components/fx/CountUp';
import { isActive } from '../../data/statuses';
import { daysUntil, firstName, formatDate, formatPeso, timeAgo } from '../../utils/format';

function StatTile({ to, icon: Icon, label, value, ink, hint }) {
  return (
    <Link to={to} className="stat" data-ink={ink}>
      <span className="stat__icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <span className="stat__value num">{typeof value === 'number' ? <CountUp to={value} duration={900} /> : value}</span>
      <span className="stat__label">{label}</span>
      <span className="stat__hint">{hint}</span>
    </Link>
  );
}

function LatestCard({ item, kind }) {
  if (!item) return null;
  const isOrder = kind === 'order';
  const due = !isOrder && item.deadline ? daysUntil(item.deadline) : null;
  return (
    <Link to={`/app/track/${item.ref}`} className="latest">
      <div className="latest__top">
        <p className="latest__kind">{isOrder ? 'Latest order' : 'Latest project'}</p>
        <StatusBadge status={item.status} kind={item.kind} />
      </div>
      <p className="latest__title">
        {isOrder ? `${item.items[0].name}${item.items.length > 1 ? ` and ${item.items.length - 1} more` : ''}` : item.title}
      </p>
      <p className="latest__meta small muted num">
        {item.ref} <span aria-hidden="true">/</span>{' '}
        {isOrder
          ? formatPeso(item.total)
          : due === null
            ? item.serviceName
            : due < 0
              ? `Deadline passed ${formatDate(item.deadline)}`
              : due === 0
                ? 'Due today'
                : `Due in ${due} day${due === 1 ? '' : 's'}`}
      </p>
      <StatusTimeline item={item} compact />
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { orders, projects, notifications, loading } = useAccount();

  const activeOrders = orders.filter((o) => isActive(o.status));
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const pending = [...orders, ...projects].filter((i) => i.status === 'pending');
  const latestOrder = activeOrders[0] ?? orders[0];
  const latestProject = projects.find((p) => isActive(p.status)) ?? projects[0];
  const recent = notifications.slice(0, 4);
  const hasHistory = orders.length + projects.length > 0;

  return (
    <div className="page dashboard">
      <header className="welcome">
        <div>
          <h1 className="h1">Welcome back!</h1>
          <p className="welcome__sub">
            {hasHistory
              ? `Here is where your orders and projects stand, ${firstName(user.fullName)}.`
              : `Your account is ready, ${firstName(user.fullName)}. Start with an order or a digital request.`}
          </p>
        </div>
        <div className="welcome__actions">
          <Link to="/app/shop" className="btn btn--light">
            <Store size={18} aria-hidden="true" /> Shop
          </Link>
          <Link to="/app/services" className="btn btn--primary">
            <Sparkles size={18} aria-hidden="true" /> Request a service
          </Link>
        </div>
      </header>

      <section className="stats" aria-label="Summary">
        <StatTile to="/app/orders?filter=active" icon={Package} label="Active Orders" value={loading ? '–' : activeOrders.length} ink="cyan" hint="Being prepared or checked" />
        <StatTile to="/app/projects" icon={FolderKanban} label="Digital Projects" value={loading ? '–' : projects.length} ink="magenta" hint={`${projects.filter((p) => isActive(p.status)).length} still in progress`} />
        <StatTile to="/app/orders?filter=completed" icon={CheckCircle2} label="Completed Orders" value={loading ? '–' : completedOrders.length} ink="ink" hint="Picked up or delivered" />
        <StatTile to="/app/projects?filter=pending" icon={Hourglass} label="Pending Requests" value={loading ? '–' : pending.length} ink="yellow" hint="Waiting for our review" />
      </section>

      <div className="dash-grid">
        <section className="panel" aria-labelledby="progress-title">
          <div className="panel__head">
            <h2 id="progress-title" className="h3">
              In progress
            </h2>
            <Link to="/app/track" className="small panel__link">
              Track by reference
            </Link>
          </div>
          {hasHistory ? (
            <div className="latest-list">
              <LatestCard item={latestOrder} kind="order" />
              <LatestCard item={latestProject} kind="project" />
            </div>
          ) : (
            <div className="starter">
              <Link to="/app/shop" className="starter__item">
                <Store size={22} aria-hidden="true" />
                <span>
                  <strong>Order supplies</strong>
                  <span className="small muted">Art, school, printing, and sporting goods</span>
                </span>
              </Link>
              <Link to="/app/services" className="starter__item">
                <Sparkles size={22} aria-hidden="true" />
                <span>
                  <strong>Request a digital service</strong>
                  <span className="small muted">Resumes, slides, pubmats, invitations</span>
                </span>
              </Link>
              <Link to="/app/track" className="starter__item">
                <Route size={22} aria-hidden="true" />
                <span>
                  <strong>Track an order</strong>
                  <span className="small muted">Use the reference number from your receipt</span>
                </span>
              </Link>
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="updates-title">
          <div className="panel__head">
            <h2 id="updates-title" className="h3">
              Recent updates
            </h2>
            <Link to="/app/notifications" className="small panel__link">
              See all
            </Link>
          </div>
          {recent.length ? (
            <ul className="updates" role="list">
              {recent.map((n) => (
                <li key={n.id}>
                  <Link to={n.link} className={`update ${n.read ? '' : 'is-unread'}`}>
                    <span className="update__icon" aria-hidden="true">
                      <Bell size={16} />
                    </span>
                    <span>
                      <span className="update__title">{n.title}</span>
                      <span className="update__time tiny muted">{timeAgo(n.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">Updates about your orders and projects will show up here.</p>
          )}
        </section>
      </div>
    </div>
  );
}
