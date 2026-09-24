import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SearchX, Truck, Store } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import ShowMore, { usePaged } from '../../components/admin/ShowMore';
import { useAdmin } from '../../context/AdminContext';
import { STATUS_FLOW, statusLabel } from '../../data/statuses';
import { itemsSummary } from '../../utils/admin';
import { formatDate, formatPeso } from '../../utils/format';

const PAYMENT = { cash: 'Cash', gcash: 'GCash', maya: 'Maya' };

export default function AdminOrders() {
  const { orders, loading } = useAdmin();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'all';
  const q = params.get('q') ?? '';
  const fulfillment = params.get('fulfillment') ?? 'all';

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const matchesStatus = (o, s) => s === 'all' || (s === 'open' ? o.status !== 'completed' : o.status === s);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders
      .filter((o) => matchesStatus(o, status))
      .filter((o) => fulfillment === 'all' || o.fulfillment === fulfillment)
      .filter(
        (o) =>
          !term ||
          `${o.ref} ${o.customer.name} ${o.customer.phone} ${o.items.map((i) => i.name).join(' ')}`.toLowerCase().includes(term)
      );
  }, [orders, status, q, fulfillment]);

  const paged = usePaged(shown, `${status}|${q}|${fulfillment}`);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    ...STATUS_FLOW.map((s) => ({ id: s, label: statusLabel(s, 'order') })),
  ];

  return (
    <div className="page">
      <PageHeader title="Orders" description="Shop orders placed online. Open one to approve it, send a proof, or mark it done." />

      <div className="admin-filters">
        <div className="input-wrap admin-filters__search">
          <Search size={18} aria-hidden="true" />
          <input
            className="input"
            type="search"
            placeholder="Search by order number, customer, or item"
            value={q}
            onChange={(e) => set('q', e.target.value)}
            aria-label="Search orders"
          />
        </div>
        <label className="admin-filters__select">
          <span className="sr-only">Pickup or delivery</span>
          <select className="select" value={fulfillment} onChange={(e) => set('fulfillment', e.target.value)}>
            <option value="all">Pickup and delivery</option>
            <option value="pickup">Pickup only</option>
            <option value="delivery">Delivery only</option>
          </select>
        </label>
      </div>
      <div className="chip-row" role="group" aria-label="Filter by status">
        {filters.map((f) => (
          <button key={f.id} type="button" className="chip" aria-pressed={status === f.id} onClick={() => set('status', f.id)}>
            {f.label} <span className="chip__count num">{orders.filter((o) => matchesStatus(o, f.id)).length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="table-card sk-block" style={{ height: 320 }} aria-busy="true" />
      ) : shown.length ? (
        <div className="table-card">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Customer</th>
                <th scope="col">Items</th>
                <th scope="col" className="t-right">
                  Total
                </th>
                <th scope="col">Handoff</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.visible.map((o) => (
                <tr key={o.ref} className={o.status === 'pending' ? 'is-new' : ''}>
                  <td data-label="Order">
                    <Link to={`/admin/orders/${o.ref}`} className="t-ref num">
                      {o.ref}
                    </Link>
                    <span className="t-sub num">{formatDate(o.createdAt)}</span>
                  </td>
                  <td data-label="Customer">
                    <span className="t-title">{o.customer.name}</span>
                    <span className="t-sub num">{o.customer.phone}</span>
                  </td>
                  <td data-label="Items" className="t-products">
                    {itemsSummary(o)}
                  </td>
                  <td data-label="Total" className="t-right num t-strong">
                    {formatPeso(o.total)}
                  </td>
                  <td data-label="Handoff">
                    <span className="t-handoff">
                      {o.fulfillment === 'delivery' ? <Truck size={15} aria-hidden="true" /> : <Store size={15} aria-hidden="true" />}
                      {o.fulfillment === 'delivery' ? 'Delivery' : 'Pickup'}, {PAYMENT[o.payment]}
                    </span>
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={o.status} kind="order" />
                  </td>
                  <td className="t-action">
                    <Link to={`/admin/orders/${o.ref}`} className="btn btn--ghost btn--sm">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ShowMore paged={paged} noun="orders" />
        </div>
      ) : (
        <EmptyState icon={SearchX} title="No orders match" body="Try another search or clear the filters.">
          <button type="button" className="btn btn--ink" onClick={() => setParams({}, { replace: true })}>
            Clear filters
          </button>
        </EmptyState>
      )}
    </div>
  );
}
