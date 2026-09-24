import { Link, useSearchParams } from 'react-router-dom';
import { Package } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useAccount } from '../../context/AccountContext';
import { isActive } from '../../data/statuses';
import { formatDate, formatPeso } from '../../utils/format';

const FILTERS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'active', label: 'Active', test: (o) => isActive(o.status) },
  { id: 'completed', label: 'Completed', test: (o) => o.status === 'completed' },
];

const productsText = (o) => {
  const first = `${o.items[0].name} × ${o.items[0].qty}`;
  return o.items.length > 1 ? `${first}, and ${o.items.length - 1} more` : first;
};

export default function MyOrders() {
  const { orders, loading } = useAccount();
  const [params, setParams] = useSearchParams();
  const filter = FILTERS.find((f) => f.id === params.get('filter')) ?? FILTERS[0];
  const shown = orders.filter(filter.test);

  return (
    <div className="page">
      <PageHeader
        title="My Orders"
        description="Physical products from the shop. Tap an order to see where it is."
        actions={
          <Link to="/app/shop" className="btn btn--ink">
            Shop again
          </Link>
        }
      />

      <div className="chip-row" role="group" aria-label="Filter orders">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="chip"
            aria-pressed={filter.id === f.id}
            onClick={() => setParams(f.id === 'all' ? {} : { filter: f.id }, { replace: true })}
          >
            {f.label} <span className="chip__count num">{orders.filter(f.test).length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="table-card sk-block" style={{ height: 240 }} aria-busy="true" />
      ) : shown.length ? (
        <div className="table-card">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Order number</th>
                <th scope="col">Products</th>
                <th scope="col" className="t-right">
                  Total
                </th>
                <th scope="col">Date</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => (
                <tr key={o.ref}>
                  <td data-label="Order number">
                    <Link to={`/app/track/${o.ref}`} className="t-ref num">
                      {o.ref}
                    </Link>
                  </td>
                  <td data-label="Products" className="t-products">
                    {productsText(o)}
                  </td>
                  <td data-label="Total" className="t-right num t-strong">
                    {formatPeso(o.total)}
                  </td>
                  <td data-label="Date" className="num">
                    {formatDate(o.createdAt)}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={o.status} kind="order" />
                  </td>
                  <td className="t-action">
                    <Link to={`/app/track/${o.ref}`} className="btn btn--ghost btn--sm">
                      Track
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={filter.id === 'all' ? 'No orders yet' : `No ${filter.label.toLowerCase()} orders`}
          body={filter.id === 'all' ? 'When you check out from the shop, your orders show up here with their status.' : 'Try the All filter to see every order.'}
        >
          <Link to="/app/shop" className="btn btn--primary">
            Browse the shop
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
