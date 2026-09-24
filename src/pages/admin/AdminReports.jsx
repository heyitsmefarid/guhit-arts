import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Boxes, Download, Printer, Receipt, Sparkles, Timer, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Logo from '../../components/brand/Logo';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../../context/ToastContext';
import {
  PERIODS,
  customersReport,
  digitalReport,
  downloadCsv,
  operationsReport,
  productsReport,
  resolvePeriod,
  salesReport,
  toCsv,
} from '../../utils/reports';
import { itemsSummary } from '../../utils/admin';
import { statusLabel } from '../../data/statuses';
import SalesReport from './reports/SalesReport';
import ProductsReport from './reports/ProductsReport';
import DigitalReport from './reports/DigitalReport';
import CustomersReport from './reports/CustomersReport';
import OperationsReport from './reports/OperationsReport';

const day = (iso) => (iso ? new Date(iso).toLocaleDateString('en-CA') : '');
const PAYMENT = { cash: 'Cash', gcash: 'GCash', maya: 'Maya' };

// Each tab: what it covers, how to build it, and what its CSV contains.
const TABS = [
  {
    id: 'sales',
    label: 'Sales',
    icon: Receipt,
    title: 'Sales report',
    build: salesReport,
    Body: SalesReport,
    csv: (r) => ({
      name: 'sales',
      text: toCsv(
        [
          ...r.orders.map((o) => ({ type: 'Shop order', ref: o.ref, at: o.createdAt, who: o.customer.name, what: itemsSummary(o), amount: o.total, payment: PAYMENT[o.payment], handoff: o.fulfillment === 'delivery' ? 'Delivery' : 'Pickup', status: statusLabel(o.status, 'order') })),
          ...r.projects.map((p) => ({ type: 'Digital service', ref: p.ref, at: p.createdAt, who: p.customer.name, what: `${p.serviceName}: ${p.title}`, amount: p.price, payment: '', handoff: '', status: statusLabel(p.status, 'project') })),
        ].sort((a, b) => a.at.localeCompare(b.at)),
        [
          { label: 'Type', value: (x) => x.type },
          { label: 'Reference', value: (x) => x.ref },
          { label: 'Date', value: (x) => day(x.at) },
          { label: 'Customer', value: (x) => x.who },
          { label: 'Details', value: (x) => x.what },
          { label: 'Amount (PHP)', value: (x) => x.amount },
          { label: 'Payment', value: (x) => x.payment },
          { label: 'Handoff', value: (x) => x.handoff },
          { label: 'Status', value: (x) => x.status },
        ]
      ),
    }),
  },
  {
    id: 'products',
    label: 'Products & stock',
    icon: Boxes,
    title: 'Products and stock report',
    build: productsReport,
    Body: ProductsReport,
    csv: (r) => ({
      name: 'products',
      text: toCsv(
        [...r.rows].sort((a, b) => b.revenue - a.revenue),
        [
          { label: 'Product', value: (x) => x.name },
          { label: 'Category', value: (x) => x.categoryLabel },
          { label: 'Price (PHP)', value: (x) => x.price },
          { label: 'Units sold', value: (x) => x.units },
          { label: 'Sales (PHP)', value: (x) => x.revenue },
          { label: 'On hand', value: (x) => (x.stocked ? x.stock : 'Made to order') },
          { label: 'Days of stock left', value: (x) => (x.stocked ? (Number.isFinite(x.daysLeft) ? Math.round(x.daysLeft) : 'No recent sales') : '') },
          { label: 'Suggested reorder', value: (x) => x.reorder ?? '' },
          { label: 'Last sold', value: (x) => day(x.lastSold) },
          { label: 'Shown in shop', value: (x) => (x.active ? 'Yes' : 'No') },
        ]
      ),
    }),
  },
  {
    id: 'digital',
    label: 'Digital Help Hub',
    icon: Sparkles,
    title: 'Digital Help Hub report',
    build: digitalReport,
    Body: DigitalReport,
    csv: (r) => ({
      name: 'digital-requests',
      text: toCsv(r.created, [
        { label: 'Reference', value: (p) => p.ref },
        { label: 'Date', value: (p) => day(p.createdAt) },
        { label: 'Customer', value: (p) => p.customer.name },
        { label: 'Service', value: (p) => p.serviceName },
        { label: 'Title', value: (p) => p.title },
        { label: 'Price (PHP)', value: (p) => p.price ?? '' },
        { label: 'Budget (PHP)', value: (p) => p.budget ?? '' },
        { label: 'Rush', value: (p) => (p.rush ? 'Yes' : 'No') },
        { label: 'Deadline', value: (p) => p.deadline },
        { label: 'Finished', value: (p) => day(p.history.find((h) => h.status === 'completed')?.at) },
        { label: 'Status', value: (p) => statusLabel(p.status, 'project') },
      ]),
    }),
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    title: 'Customers report',
    build: customersReport,
    Body: CustomersReport,
    csv: (r) => ({
      name: 'customers',
      text: toCsv(r.ranked, [
        { label: 'Customer', value: (c) => c.name },
        { label: 'From', value: (c) => c.place },
        { label: 'Orders', value: (c) => c.orders },
        { label: 'Digital requests', value: (c) => c.projects },
        { label: 'Spent (PHP)', value: (c) => c.spent },
        { label: 'First purchase', value: (c) => day(c.since) },
        { label: 'Last purchase', value: (c) => day(c.last) },
      ]),
    }),
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Timer,
    title: 'Operations report',
    build: operationsReport,
    Body: OperationsReport,
    csv: (r) => ({
      name: 'team-workload',
      text: toCsv(r.team, [
        { label: 'Team member', value: (m) => m.name },
        { label: 'Title', value: (m) => m.title },
        { label: 'Orders handled', value: (m) => m.orders },
        { label: 'Digital requests handled', value: (m) => m.projects },
        { label: 'Status updates', value: (m) => m.updates },
      ]),
    }),
  },
];

export default function AdminReports() {
  const { user } = useAuth();
  const data = useAdmin();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((t) => t.id === params.get('tab')) ?? TABS[0];
  const periodId = PERIODS.some((p) => p.id === params.get('period')) ? params.get('period') : 'month';
  const period = useMemo(() => resolvePeriod(periodId), [periodId]);
  const report = useMemo(() => (data.loading ? null : tab.build(data, period)), [data, tab, period]);

  const link = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    return `?${next.toString()}`;
  };

  const onDownload = () => {
    const { name, text } = tab.csv(report);
    const file = `guhit-${name}-${day(period.start.toISOString())}-to-${day(new Date(period.end - 1).toISOString())}.csv`;
    downloadCsv(file, text);
    toast(`Downloaded ${file}`);
  };

  return (
    <div className="page reports">
      <PageHeader
        title="Reports"
        description="How the shop is doing, with every number compared to the period before. Download the rows as CSV for Excel, or print a copy."
        actions={
          <>
            <button type="button" className="btn btn--ghost" onClick={onDownload} disabled={!report}>
              <Download size={18} aria-hidden="true" /> Download CSV
            </button>
            <button type="button" className="btn btn--ink" onClick={() => window.print()} disabled={!report}>
              <Printer size={18} aria-hidden="true" /> Print or save as PDF
            </button>
          </>
        }
      />

      <div className="report-toolbar">
        <nav className="report-tabs" aria-label="Reports">
          {TABS.map(({ id, label, icon: Icon }) => (
            <Link
              key={id}
              to={link({ tab: id === 'sales' ? null : id })}
              replace
              className="report-tab"
              aria-current={tab.id === id ? 'page' : undefined}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="segmented" role="group" aria-label="Report period">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={periodId === p.id}
              onClick={() => setParams(new URLSearchParams(link({ period: p.id === 'month' ? null : p.id }).slice(1)), { replace: true })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <header className="report-head">
        <div className="report-head__print" aria-hidden="true">
          <Logo to="/admin" />
          <p>
            Prepared by {user.fullName} on{' '}
            {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}. Sample data from
            the prototype.
          </p>
        </div>
        <h2 className="report-head__title">{tab.title}</h2>
        <p className="report-head__range">
          <strong>{period.title}</strong>
          <span>
            {period.against
              ? `Compared with ${period.against} (${period.prevTitle})`
              : 'Month by month since online orders began. There is no earlier year to compare with.'}
          </span>
        </p>
      </header>

      {report ? (
        <tab.Body report={report} period={period} data={data} />
      ) : (
        <div className="sk-block" style={{ height: 520 }} aria-busy="true" aria-label="Loading report" />
      )}
    </div>
  );
}
