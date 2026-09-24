import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Mail, MapPin, Phone, SearchX, Wand2 } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import StatusTimeline from '../../components/ui/StatusTimeline';
import EmptyState from '../../components/ui/EmptyState';
import ProductImage from '../../components/shop/ProductImage';
import StatusControl from '../../components/admin/StatusControl';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../utils/permissions';
import { useToast } from '../../context/ToastContext';
import { products } from '../../data/products';
import { statusLabel } from '../../data/statuses';
import { formatDateTime, formatPeso } from '../../utils/format';

const PAYMENT = { cash: 'Cash', gcash: 'GCash', maya: 'Maya' };

export default function AdminOrderDetail() {
  const { ref } = useParams();
  const { findOrder, updateOrderStatus, loading } = useAdmin();
  const { user } = useAuth();
  const { toast } = useToast();
  const order = findOrder(ref);

  if (loading) return <div className="page"><div className="sk-block" style={{ height: 360 }} aria-busy="true" /></div>;
  if (!order) {
    return (
      <div className="page">
        <EmptyState icon={SearchX} title={`Order ${ref} was not found`} body="Check the order number, or find it from the orders list.">
          <Link to="/admin/orders" className="btn btn--ink">
            Back to orders
          </Link>
        </EmptyState>
      </div>
    );
  }

  const custom = order.items.filter((i) => i.note);
  const onUpdate = async (status, note) => {
    await updateOrderStatus(order.ref, status, note);
    toast(`${order.ref} is now ${statusLabel(status, 'order')}. ${order.customer.name} was notified.`);
  };

  return (
    <div className="page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/admin/orders">
          <ChevronLeft size={16} aria-hidden="true" /> Orders
        </Link>
      </nav>

      <header className="track-head">
        <div>
          <p className="track-head__kind">Shop order</p>
          <h1 className="h1 num">{order.ref}</h1>
          <p className="muted">
            Placed {formatDateTime(order.createdAt)} by {order.customer.name}
          </p>
        </div>
        <StatusBadge status={order.status} kind="order" />
      </header>

      <div className="track-progress">
        <StatusTimeline item={order} compact labels />
      </div>

      <div className="admin-detail">
        <div className="admin-detail__main">
          <section className="panel" aria-labelledby="items-h">
            <h2 id="items-h" className="h3 panel__title">
              Items
            </h2>
            {custom.length > 0 && (
              <p className="alert alert--info admin-note">
                <Wand2 size={18} aria-hidden="true" />
                {custom.length === 1 ? 'One item is' : `${custom.length} items are`} customized. Send the print proof before
                producing it.
              </p>
            )}
            <ul className="track-items" role="list">
              {order.items.map((l) => {
                const product = products.find((p) => p.id === l.productId) ?? { ...l, category: 'custom' };
                return (
                  <li key={`${l.productId}-${l.note}`}>
                    <span className="track-items__img">
                      <ProductImage product={product} />
                    </span>
                    <span className="track-items__info">
                      <strong>{l.name}</strong>
                      <span className="small muted num">
                        {l.qty} × {formatPeso(l.price)}
                      </span>
                      {l.note && <span className="small track-items__note">{l.note}</span>}
                    </span>
                    <span className="num">{formatPeso(l.qty * l.price)}</span>
                  </li>
                );
              })}
            </ul>
            <dl className="kv">
              <div>
                <dt>Subtotal</dt>
                <dd className="num">{formatPeso(order.subtotal)}</dd>
              </div>
              <div>
                <dt>{order.fulfillment === 'pickup' ? 'Pickup at shop' : 'Delivery fee'}</dt>
                <dd className="num">{order.deliveryFee ? formatPeso(order.deliveryFee) : 'Free'}</dd>
              </div>
              <div className="kv__total">
                <dt>Total</dt>
                <dd className="num">{formatPeso(order.total)}</dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>{PAYMENT[order.payment]}</dd>
              </div>
            </dl>
          </section>

          <section className="panel" aria-labelledby="hist-h">
            <h2 id="hist-h" className="h3 panel__title">
              History
            </h2>
            <StatusTimeline item={order} />
          </section>
        </div>

        <div className="admin-detail__side">
          <StatusControl item={order} onUpdate={onUpdate} />

          <section className="panel" aria-labelledby="cust-h">
            <h2 id="cust-h" className="h3 panel__title">
              Customer
            </h2>
            <p className="admin-customer__name">
              {can(user, 'view-customers') ? <Link to={`/admin/customers/${order.customer.id}`}>{order.customer.name}</Link> : order.customer.name}
            </p>
            <ul className="contact__list admin-contact" role="list">
              <li>
                <Phone size={17} aria-hidden="true" />
                <span className="num">{order.contact.phone || order.customer.phone}</span>
              </li>
              <li>
                <Mail size={17} aria-hidden="true" />
                <span>{order.customer.email}</span>
              </li>
              <li>
                <MapPin size={17} aria-hidden="true" />
                <span>{order.fulfillment === 'delivery' ? `Deliver to ${order.contact.address}` : 'Picks up at the Leuterio shop'}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
