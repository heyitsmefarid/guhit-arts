import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  CircleAlert,
  FolderKanban,
  Hourglass,
  Package,
  PackageX,
  Receipt,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import CountUp from '../../components/fx/CountUp';
import StatusBadge from '../../components/ui/StatusBadge';
import StackedColumns from '../../components/admin/StackedColumns';
import HBars from '../../components/admin/HBars';
import ShareBar from '../../components/admin/ShareBar';
import Sparkline from '../../components/admin/Sparkline';
import ProductImage from '../../components/shop/ProductImage';
import { statusLabel } from '../../data/statuses';
import { LOW_STOCK_AT } from '../../data/inventory';
import {
  SERIES,
  dailySeries,
  daysLeft,
  greeting,
  handoffShare,
  itemsSummary,
  ordersByWeekday,
  paymentShare,
  recentActivity,
  requestsByService,
  salesByCategory,
  shortPeso,
  stageCounts,
  stockWatch,
  summarize,
  topProducts,
  upcomingDeadlines,
} from '../../utils/admin';
import { can, ROLE_LABELS } from '../../utils/permissions';
import { firstName, formatDate, formatPeso, timeAgo } from '../../utils/format';

const RANGES = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
];
const REORDER_TARGET = 20;

function Kpi({ to, icon: Icon, label, value, peso, hint, ink, spark, sparkLabel }) {
  return (
    <Link to={to} className={`stat ${spark ? 'stat--spark' : ''}`} data-ink={ink}>
      <span className="stat__icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <span className="stat__value num">
        {peso && '₱'}
        <CountUp to={value} duration={1000} />
      </span>
      <span className="stat__label">{label}</span>
      <span className="stat__hint">{hint}</span>
      {spark && (
        <span className="stat__spark">
          <Sparkline values={spark} label={sparkLabel} />
        </span>
      )}
    </Link>
  );
}

function Panel({ id, title, sub, link, className = '', children }) {
  return (
    <section className={`panel ${className}`} aria-labelledby={id}>
      <div className="panel__head">
        <div>
          <h2 id={id} className="h3">
            {title}
          </h2>
          {sub && <p className="small muted">{sub}</p>}
        </div>
        {link}
      </div>
      {children}
    </section>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const data = useAdmin();
  const { orders, projects, products, customers, loading } = data;
  const [params, setParams] = useSearchParams();
  const days = Number(params.get('range')) === 7 ? 7 : 30;
  const seeSales = can(user, 'view-sales');

  if (loading) return <div className="page"><div className="sk-block" style={{ height: 480 }} aria-busy="true" /></div>;

  const s = summarize(data, days);
  const daily = dailySeries(orders, projects, days);
  const rangeText = days === 7 ? 'last 7 days' : 'last 30 days';
  const RangeText = days === 7 ? 'Last 7 days' : 'Last 30 days';
  const dayLabel = (d, i) => (i === daily.length - 1 ? 'Today' : d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }));
  const longDate = (d) => d.toLocaleDateString('en-PH', { weekday: 'long', month: 'short', day: 'numeric' });

  const attention = [
    ...orders
      .filter((o) => o.status === 'pending')
      .map((o) => ({ key: o.ref, icon: Package, title: `${o.ref} from ${o.customer.name}`, body: `New order, ${formatPeso(o.total)}. Confirm stock and approve.`, to: `/admin/orders/${o.ref}`, when: o.createdAt })),
    ...projects
      .filter((p) => p.status === 'pending')
      .map((p) => ({ key: p.ref, icon: Sparkles, title: `${p.ref}: ${p.title}`, body: p.price ? `New ${p.serviceName} request. Review and approve.` : 'Needs a quotation before it can be approved.', to: `/admin/projects/${p.ref}`, when: p.createdAt })),
    ...stockWatch(products)
      .filter((p) => p.stock === 0)
      .map((p) => ({ key: p.id, icon: PackageX, title: `${p.name} is out of stock`, body: 'Customers cannot order it until you restock.', to: '/admin/products?stock=out', urgent: true })),
  ];
  const deadlines = upcomingDeadlines(projects, 7);
  const stock = stockWatch(products);
  const activity = recentActivity(orders, projects, 7);
  const services = requestsByService(projects, days);

  const kpis = seeSales
    ? [
        { to: '/admin/orders', icon: Wallet, ink: 'magenta', label: 'Revenue', value: s.revenue, peso: true, hint: `${shortPeso(s.shop)} shop, ${shortPeso(s.digital)} digital`, spark: daily.map((d) => d.shop + d.digital), sparkLabel: 'Daily revenue trend' },
        { to: '/admin/orders', icon: Receipt, ink: 'cyan', label: 'Orders', value: s.orderCount, hint: `${s.pendingOrders} waiting for approval`, spark: daily.map((d) => d.orders), sparkLabel: 'Daily orders trend' },
        { to: '/admin/orders', icon: Wallet, ink: 'ink', label: 'Average order', value: s.avgOrder, peso: true, hint: 'Shop orders only' },
        { to: '/admin/projects', icon: Sparkles, ink: 'magenta', label: 'Digital requests', value: s.requestCount, hint: `${s.needsQuote} need a quotation` },
        { to: '/admin/customers', icon: Users, ink: 'yellow', label: 'Customers who ordered', value: s.activeCustomers, hint: `${s.newCustomers} new sign-ups` },
        { to: '/admin/products?stock=low', icon: CircleAlert, ink: 'ink', label: 'Low-stock items', value: s.lowStock, hint: `${s.outOfStock} out of stock` },
      ]
    : [
        { to: '/admin/orders?status=open', icon: Package, ink: 'cyan', label: 'Open orders', value: s.openOrders, hint: `${s.pendingOrders} waiting for approval` },
        { to: '/admin/projects?status=open', icon: Hourglass, ink: 'magenta', label: 'Open digital requests', value: s.openRequests, hint: `${s.pendingRequests} to review` },
        { to: '/admin/projects?status=open', icon: CalendarClock, ink: 'yellow', label: 'Due in 3 days', value: s.dueSoon, hint: 'Digital requests' },
        { to: '/admin/orders', icon: Receipt, ink: 'cyan', label: 'Orders placed', value: s.orderCount, hint: RangeText, spark: daily.map((d) => d.orders), sparkLabel: 'Daily orders trend' },
        { to: '/admin/projects', icon: FolderKanban, ink: 'magenta', label: 'Requests received', value: s.requestCount, hint: RangeText },
        { to: '/admin/products?stock=low', icon: CircleAlert, ink: 'ink', label: 'Low-stock items', value: s.lowStock, hint: `${s.outOfStock} out of stock` },
      ];

  return (
    <div className="page admin-dash">
      <header className="welcome welcome--admin">
        <div>
          <h1 className="h1">
            {greeting()}, {firstName(user.fullName)}
          </h1>
          <p className="welcome__sub">
            {ROLE_LABELS[user.role]} view.{' '}
            {attention.length
              ? `${attention.length} ${attention.length === 1 ? 'thing needs' : 'things need'} your attention.`
              : 'Everything is up to date.'}
          </p>
        </div>
        <div className="welcome__actions">
          <Link to="/admin/orders?status=pending" className="btn btn--ink">
            <Package size={18} aria-hidden="true" /> New orders
          </Link>
          <Link to="/admin/projects?status=pending" className="btn btn--primary">
            <Sparkles size={18} aria-hidden="true" /> Requests to review
          </Link>
        </div>
      </header>

      <div className="dash-toolbar">
        <div className="segmented" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              aria-pressed={days === r.days}
              onClick={() => setParams(r.days === 30 ? {} : { range: String(r.days) }, { replace: true })}
            >
              {r.label}
            </button>
          ))}
        </div>
        <p className="small muted">
          {daily[0].date.toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })} to today. Totals and charts use this range;
          open work and stock are always current.
        </p>
      </div>

      <section className="stats stats--six" aria-label="Summary">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </section>

      <div className="admin-grid">
        <Panel
          id="volume-h"
          className="admin-grid__wide"
          title={seeSales ? 'Daily revenue' : 'Orders per day'}
          sub={seeSales ? 'Shop orders and confirmed digital work. Hover a day for details.' : 'Online orders placed each day. Hover a day for details.'}
        >
          {seeSales ? (
            <StackedColumns
              ariaLabel={`Daily revenue, ${rangeText}`}
              series={[
                { key: 'shop', label: 'Shop orders', color: SERIES.shop },
                { key: 'digital', label: 'Digital services', color: SERIES.digital },
              ]}
              rows={daily.map((d, i) => ({
                label: dayLabel(d.date, i),
                tip: longDate(d.date),
                values: { shop: d.shop, digital: d.digital },
                meta: `${d.orders} order${d.orders === 1 ? '' : 's'}, ${d.projects} digital job${d.projects === 1 ? '' : 's'}`,
              }))}
              format={formatPeso}
              tickFormat={shortPeso}
              height={320}
            />
          ) : (
            <StackedColumns
              ariaLabel={`Orders per day, ${rangeText}`}
              series={[{ key: 'orders', label: 'Orders', color: SERIES.shop }]}
              rows={daily.map((d, i) => ({ label: dayLabel(d.date, i), tip: longDate(d.date), values: { orders: d.orders } }))}
              height={320}
              integer
            />
          )}
        </Panel>

        <Panel id="attention-h" title="Needs attention" link={<span className="tag num">{attention.length}</span>}>
          {attention.length ? (
            <ul className="attention" role="list">
              {attention.slice(0, 5).map(({ key, icon: Icon, title, body, to, when, urgent }) => (
                <li key={key}>
                  <Link to={to} className={`attention__item ${urgent ? 'is-urgent' : ''}`}>
                    <span className="attention__icon" aria-hidden="true">
                      <Icon size={17} />
                    </span>
                    <span>
                      <span className="attention__title">{title}</span>
                      <span className="attention__body">{body}</span>
                      {when && <span className="tiny muted">{timeAgo(when)}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">Nothing waiting. New orders and requests will show up here.</p>
          )}
          {attention.length > 5 && (
            <p className="small panel__foot">
              {attention.length - 5} more in <Link to="/admin/orders?status=pending">orders</Link> and{' '}
              <Link to="/admin/projects?status=pending">requests</Link>.
            </p>
          )}
        </Panel>

        <Panel id="stage-h" title="Work in each stage" sub="Orders and digital requests right now">
          <HBars
            label="Work in each stage"
            rows={stageCounts(orders).map((st) => ({
              id: st.id,
              label: statusLabel(st.id, 'order'),
              value: st.value + projects.filter((p) => p.status === st.id).length,
            }))}
          />
          <p className="tiny muted panel__foot">
            {s.openOrders} open orders and {s.openRequests} open digital requests.
          </p>
        </Panel>

        <Panel id="weekday-h" title="Busiest days" sub={`Orders by day of the week, ${rangeText}`}>
          <StackedColumns
            ariaLabel="Orders by day of the week"
            series={[{ key: 'orders', label: 'Orders', color: SERIES.shop }]}
            rows={ordersByWeekday(orders, days)}
            height={210}
            labelEvery={1}
            integer
          />
        </Panel>

        <Panel id="pay-h" title="How customers order" sub={RangeText}>
          <p className="share__title">Payment method</p>
          <ShareBar label="Payment method" parts={paymentShare(orders, days)} format={(v) => `${v} orders`} />
          <p className="share__title">Pickup or delivery</p>
          <ShareBar label="Pickup or delivery" parts={handoffShare(orders, days)} format={(v) => `${v} orders`} />
        </Panel>

        {seeSales && (
          <Panel id="cat-h" title="Sales by category" sub={RangeText}>
            <HBars label="Sales by category" rows={salesByCategory(orders, projects, days)} format={formatPeso} />
          </Panel>
        )}

        <Panel id="top-h" title="Best sellers" sub={`Units sold, ${rangeText}`}>
          <HBars label="Best-selling products by units" rows={topProducts(orders, days)} format={(v) => `${v} pcs`} />
        </Panel>

        <Panel id="svc-h" title="Requests by service" sub={`Digital Help Hub, ${rangeText}`}>
          {services.length ? (
            <HBars label="Digital requests by service" rows={services} />
          ) : (
            <p className="muted small">No digital requests in this range.</p>
          )}
        </Panel>

        <Panel
          id="due-h"
          title="Due this week"
          sub="Open digital requests by deadline"
          link={
            <Link to="/admin/projects?status=open" className="small panel__link">
              All requests
            </Link>
          }
        >
          {deadlines.length ? (
            <ul className="due-list" role="list">
              {deadlines.slice(0, 5).map((p) => {
                const d = daysLeft(p.deadline);
                const date = new Date(`${p.deadline}T00:00:00`);
                return (
                  <li key={p.ref}>
                    <Link to={`/admin/projects/${p.ref}`} className={`due ${d < 0 ? 'is-late' : d <= 1 ? 'is-soon' : ''}`}>
                      <span className="due__date" aria-hidden="true">
                        <span className="due__month">{date.toLocaleDateString('en-PH', { month: 'short' })}</span>
                        <span className="due__day num">{date.getDate()}</span>
                      </span>
                      <span className="due__info">
                        <span className="due__title">{p.title}</span>
                        <span className="due__meta">
                          {p.customer.name}, {d < 0 ? `${-d} days late` : d === 0 ? 'due today' : d === 1 ? 'due tomorrow' : `due in ${d} days`}
                        </span>
                      </span>
                      <StatusBadge status={p.status} kind="project" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted small">No deadlines in the next 7 days.</p>
          )}
        </Panel>

        <Panel
          id="stock-h"
          title="Stock watch"
          sub={`${LOW_STOCK_AT} or fewer left. Bars compare stock with a reorder level of ${REORDER_TARGET}.`}
          link={
            <Link to="/admin/products?stock=low" className="small panel__link">
              Restock
            </Link>
          }
        >
          {stock.length ? (
            <ul className="meters" role="list">
              {stock.slice(0, 5).map((p) => (
                <li key={p.id} className="meter">
                  <span className="meter__img">
                    <ProductImage product={p} />
                  </span>
                  <span className="meter__body">
                    <span className="meter__name">{p.name}</span>
                    <span className="meter__track" aria-hidden="true">
                      <span className="meter__fill" style={{ width: `${Math.min(100, (p.stock / REORDER_TARGET) * 100)}%` }} />
                    </span>
                  </span>
                  <span className={`stock ${p.stock === 0 ? 'stock--out' : 'stock--low'}`}>{p.stock === 0 ? 'Out' : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">Every item is above the reorder level.</p>
          )}
        </Panel>

        <Panel id="act-h" title="Recent activity" sub="Latest changes to orders and requests" className={seeSales ? '' : 'admin-grid__wide'}>
          <ol className="activity" role="list">
            {activity.map((e) => (
              <li key={`${e.item.ref}-${e.status}-${e.at}`} className={`activity__item activity__item--${e.status}`}>
                <span className="activity__dot" aria-hidden="true" />
                <span className="activity__text">
                  <Link to={`/admin/${e.item.kind === 'order' ? 'orders' : 'projects'}/${e.item.ref}`}>{e.item.ref}</Link>{' '}
                  {e.first
                    ? `${e.item.kind === 'order' ? 'placed' : 'requested'} by ${e.item.customer.name}`
                    : `moved to ${statusLabel(e.status, e.item.kind)}`}
                  <span className="activity__meta">
                    {timeAgo(e.at)}
                    {e.by ? `, by ${e.by}` : ''}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Panel>

        {seeSales && (
          <Panel
            id="cust-h"
            title="Top customers"
            sub="By total spent"
            link={
              <Link to="/admin/customers" className="small panel__link">
                All customers
              </Link>
            }
          >
            <HBars
              label="Top customers by total spent"
              rows={[...customers]
                .sort((a, b) => b.spent - a.spent)
                .slice(0, 5)
                .map((c) => ({ id: c.id, label: c.fullName, value: c.spent }))}
              format={formatPeso}
            />
          </Panel>
        )}

        <Panel
          id="recent-h"
          title="Latest orders"
          className={seeSales ? 'admin-grid__wide' : 'admin-grid__full'}
          link={
            <Link to="/admin/orders" className="small panel__link">
              See all orders
            </Link>
          }
        >
          <div className="table-card table-card--flat">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Items</th>
                  <th scope="col" className="t-right">
                    Total
                  </th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.ref}>
                    <td data-label="Order">
                      <Link to={`/admin/orders/${o.ref}`} className="t-ref num">
                        {o.ref}
                      </Link>
                      <span className="t-sub">{formatDate(o.createdAt)}</span>
                    </td>
                    <td data-label="Customer">{o.customer.name}</td>
                    <td data-label="Items" className="t-products">
                      {itemsSummary(o)}
                    </td>
                    <td data-label="Total" className="t-right num t-strong">
                      {formatPeso(o.total)}
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={o.status} kind="order" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
