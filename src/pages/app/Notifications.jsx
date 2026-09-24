import { Link } from 'react-router-dom';
import { BellOff, CheckCheck, FolderKanban, Package, PartyPopper } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { useAccount } from '../../context/AccountContext';
import { timeAgo } from '../../utils/format';

const ICONS = { order: Package, project: FolderKanban, account: PartyPopper };

const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString();

export default function Notifications() {
  const { notifications, unreadCount, markRead } = useAccount();
  const groups = [
    { label: 'Today', items: notifications.filter((n) => isToday(n.createdAt)) },
    { label: 'Earlier', items: notifications.filter((n) => !isToday(n.createdAt)) },
  ].filter((g) => g.items.length);

  return (
    <div className="page notifications">
      <PageHeader
        title="Notifications"
        description={unreadCount ? `${unreadCount} unread` : 'You are all caught up.'}
        actions={
          unreadCount > 0 && (
            <button type="button" className="btn btn--ghost" onClick={() => markRead()}>
              <CheckCheck size={18} aria-hidden="true" /> Mark all as read
            </button>
          )
        }
      />

      {notifications.length === 0 ? (
        <EmptyState icon={BellOff} title="No notifications yet" body="Updates on your orders and projects will appear here." />
      ) : (
        groups.map((g) => (
          <section key={g.label} className="notif-group" aria-label={g.label}>
            <h2 className="notif-group__label">{g.label}</h2>
            <ul className="notif-list" role="list">
              {g.items.map((n) => {
                const Icon = ICONS[n.kind] ?? Package;
                return (
                  <li key={n.id}>
                    <Link to={n.link} className={`notif ${n.read ? '' : 'is-unread'}`} onClick={() => !n.read && markRead([n.id])}>
                      <span className="notif__icon" data-kind={n.kind} aria-hidden="true">
                        <Icon size={18} />
                      </span>
                      <span className="notif__text">
                        <span className="notif__title">
                          {!n.read && <span className="sr-only">Unread: </span>}
                          {n.title}
                        </span>
                        <span className="notif__body">{n.body}</span>
                      </span>
                      <span className="notif__time tiny">{timeAgo(n.createdAt)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
