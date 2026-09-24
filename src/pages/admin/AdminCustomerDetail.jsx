import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Mail, MapPin, Phone, SearchX } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useAdmin } from '../../context/AdminContext';
import { itemsSummary } from '../../utils/admin';
import { formatDate, formatPeso } from '../../utils/format';

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const { customers, orders, projects, loading } = useAdmin();
  const customer = customers.find((c) => c.id === id);

  if (loading) return <div className="page"><div className="sk-block" style={{ height: 320 }} aria-busy="true" /></div>;
  if (!customer) {
    return (
      <div className="page">
        <EmptyState icon={SearchX} title="Customer not found" body="They may have been removed, or the link is out of date.">
          <Link to="/admin/customers" className="btn btn--ink">
            Back to customers
          </Link>
        </EmptyState>
      </div>
    );
  }

  const theirOrders = orders.filter((o) => o.customer.id === id);
  const theirProjects = projects.filter((p) => p.customer.id === id);

  return (
    <div className="page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/admin/customers">
          <ChevronLeft size={16} aria-hidden="true" /> Customers
        </Link>
      </nav>

      <div className="admin-detail">
        <div className="admin-detail__main">
          <section className="panel" aria-labelledby="co-h">
            <div className="panel__head">
              <h2 id="co-h" className="h3">
                Orders
              </h2>
              <span className="tag num">{theirOrders.length}</span>
            </div>
            {theirOrders.length ? (
              <ul className="mini-list" role="list">
                {theirOrders.map((o) => (
                  <li key={o.ref}>
                    <Link to={`/admin/orders/${o.ref}`} className="mini-row">
                      <span>
                        <span className="t-ref num">{o.ref}</span>
                        <span className="t-sub">
                          {formatDate(o.createdAt)}, {itemsSummary(o)}
                        </span>
                      </span>
                      <span className="num t-strong">{formatPeso(o.total)}</span>
                      <StatusBadge status={o.status} kind="order" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">No shop orders yet.</p>
            )}
          </section>

          <section className="panel" aria-labelledby="cp-h">
            <div className="panel__head">
              <h2 id="cp-h" className="h3">
                Digital requests
              </h2>
              <span className="tag num">{theirProjects.length}</span>
            </div>
            {theirProjects.length ? (
              <ul className="mini-list" role="list">
                {theirProjects.map((p) => (
                  <li key={p.ref}>
                    <Link to={`/admin/projects/${p.ref}`} className="mini-row">
                      <span>
                        <span className="t-title">{p.title}</span>
                        <span className="t-sub num">
                          {p.ref}, {p.serviceName}
                        </span>
                      </span>
                      <span className="num t-strong">{p.price ? formatPeso(p.price) : 'Quote'}</span>
                      <StatusBadge status={p.status} kind="project" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">No digital requests yet.</p>
            )}
          </section>
        </div>

        <div className="admin-detail__side">
          <section className="panel admin-profile">
            <Avatar user={customer} size={72} />
            <h1 className="h3">{customer.fullName}</h1>
            <p className="small muted">Customer since {formatDate(customer.createdAt, { month: 'long', year: 'numeric' })}</p>
            <dl className="admin-profile__stats">
              <div>
                <dt>Total spent</dt>
                <dd className="num">{formatPeso(customer.spent)}</dd>
              </div>
              <div>
                <dt>Orders</dt>
                <dd className="num">{customer.orderCount}</dd>
              </div>
              <div>
                <dt>Digital</dt>
                <dd className="num">{customer.projectCount}</dd>
              </div>
            </dl>
            <ul className="contact__list admin-contact" role="list">
              <li>
                <Phone size={17} aria-hidden="true" />
                <span className="num">{customer.contactNumber}</span>
              </li>
              <li>
                <Mail size={17} aria-hidden="true" />
                <span>{customer.email}</span>
              </li>
              <li>
                <MapPin size={17} aria-hidden="true" />
                <span>{customer.address || 'No address on file'}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
