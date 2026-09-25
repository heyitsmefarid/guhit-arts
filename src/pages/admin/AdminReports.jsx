import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Boxes, Download, ListChecks, Printer, Receipt, SlidersHorizontal, Sparkles, Timer, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Logo from '../../components/brand/Logo';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../../context/ToastContext';
import { storage } from '../../services/storage';
import {
  FILTERS,
  PERIODS,
  customersReport,
  describeFilters,
  digitalReport,
  downloadCsv,
  filterData,
  operationsReport,
  productsReport,
  resolvePeriod,
  salesReport,
  toCsv,
  toDateInput,
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
    filters: ['category', 'service', 'payment', 'handoff', 'place'],
    sections: [
      { id: 'findings', label: 'What stands out' },
      { id: 'kpis', label: 'Summary figures' },
      { id: 'trend', label: 'Revenue over time' },
      { id: 'paid', label: 'How customers paid' },
      { id: 'categories', label: 'Revenue by category' },
      { id: 'products', label: 'Best-selling products' },
    ],
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
    filters: ['category'],
    sections: [
      { id: 'findings', label: 'What stands out' },
      { id: 'kpis', label: 'Summary figures' },
      { id: 'units', label: 'Units sold by category' },
      { id: 'coverage', label: 'Stock coverage' },
      { id: 'made', label: 'Made-to-order products' },
      { id: 'slow', label: 'Slow movers' },
    ],
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
    filters: ['service', 'place'],
    sections: [
      { id: 'findings', label: 'What stands out' },
      { id: 'kpis', label: 'Summary figures' },
      { id: 'trend', label: 'Requests over time' },
      { id: 'stages', label: 'Open requests right now' },
      { id: 'services', label: 'By service' },
      { id: 'rounds', label: 'Rounds of changes' },
      { id: 'quotes', label: 'Quotes and rush jobs' },
      { id: 'prices', label: 'Average price by service' },
    ],
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
    filters: ['category', 'service', 'payment', 'handoff', 'place'],
    sections: [
      { id: 'findings', label: 'What stands out' },
      { id: 'kpis', label: 'Summary figures' },
      { id: 'trend', label: 'Customers over time' },
      { id: 'places', label: 'Where customers are from' },
      { id: 'top', label: 'Top customers' },
    ],
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
    filters: ['category', 'handoff'],
    sections: [
      { id: 'findings', label: 'What stands out' },
      { id: 'kpis', label: 'Summary figures' },
      { id: 'heat', label: 'When orders come in' },
      { id: 'age', label: 'Open work by age' },
      { id: 'team', label: 'Team workload' },
    ],
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

const HIDDEN_KEY = 'reportSections'; // { [tabId]: [hidden section ids] }, per browser

export default function AdminReports() {
  const { user } = useAuth();
  const data = useAdmin();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [hiddenByTab, setHiddenByTab] = useState(() => storage.get(HIDDEN_KEY, {}));
  const tab = TABS.find((t) => t.id === params.get('tab')) ?? TABS[0];

  // Period, including a custom date range
  const periodId = PERIODS.some((p) => p.id === params.get('period')) ? params.get('period') : 'month';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const period = useMemo(() => resolvePeriod(periodId, new Date(), { from, to }), [periodId, from, to]);
  const today = toDateInput(new Date());

  // Filters this tab supports, read from the URL so a filtered report can be bookmarked.
  const filters = Object.fromEntries(
    Object.entries(FILTERS).map(([key, def]) => {
      const value = params.get(def.param) ?? '';
      const ok =
        tab.filters.includes(key) &&
        def.options.some((o) => o.id === value) &&
        !(key === 'category' && tab.id === 'products' && value === 'digital');
      return [key, ok ? value : ''];
    })
  );
  if (filters.category && filters.category !== 'digital') filters.service = '';
  const filterKey = JSON.stringify(filters);
  const active = describeFilters(filters);

  const filtered = useMemo(
    () => (data.loading ? null : filterData(data, JSON.parse(filterKey))),
    [data, filterKey]
  );
  const report = useMemo(() => (filtered ? tab.build(filtered, period) : null), [filtered, tab, period]);

  // Sections the administrator chose to show on this tab
  const hidden = hiddenByTab[tab.id] ?? [];
  const show = (id) => !hidden.includes(id);
  const setHidden = (list) => {
    const next = { ...hiddenByTab, [tab.id]: list };
    setHiddenByTab(next);
    storage.set(HIDDEN_KEY, next);
  };
  const toggleSection = (id) => setHidden(show(id) ? [...hidden, id] : hidden.filter((h) => h !== id));

  const link = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    return `?${next.toString()}`;
  };
  // Built from the live address bar rather than the last render, so two quick
  // changes in a row (like From, then To) both stick.
  const update = (patch) =>
    setParams(
      () => {
        const next = new URLSearchParams(window.location.search);
        Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        return next;
      },
      { replace: true }
    );
  const choosePeriod = (id) =>
    update(
      id === 'custom'
        ? { period: 'custom', from: from || toDateInput(period.start), to: to || toDateInput(new Date(period.end - 1)) }
        : { period: id === 'month' ? null : id, from: null, to: null }
    );
  const fromValue = from || toDateInput(period.start);
  const toValue = to || toDateInput(new Date(period.end - 1));
  const onDate = (key) => (e) => {
    const v = e.target.value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v) && Number(v.slice(0, 4)) >= 2000) update({ [key]: v });
  };
  const clearFilters = () =>update(Object.fromEntries(Object.values(FILTERS).map((d) => [d.param, null])));

  const visibleFilters = tab.filters.filter((key) => !(key === 'service' && filters.category && filters.category !== 'digital'));
  const optionsFor = (key) =>
    FILTERS[key].options.filter((o) => !(key === 'category' && tab.id === 'products' && o.id === 'digital'));

  const onDownload = () => {
    const { name, text } = tab.csv(report);
    const file = `guhit-${name}-${toDateInput(period.start)}-to-${toDateInput(new Date(period.end - 1))}${active.length ? '-filtered' : ''}.csv`;
    downloadCsv(file, text);
    toast(`Downloaded ${file}`);
  };

  return (
    <div className="page reports">
      <PageHeader
        title="Reports"
        description="How the shop is doing, with every number compared to the period before. Narrow a report with the filters, choose which sections to show, then download the rows as CSV or print a copy."
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
            <button key={p.id} type="button" aria-pressed={periodId === p.id} onClick={() => choosePeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="report-filters">
        <p className="report-filters__title">
          <SlidersHorizontal size={17} aria-hidden="true" /> Filters
        </p>
        {periodId === 'custom' && (
          <>
            {/* Uncontrolled, so typing a date is never interrupted; the report
                follows as soon as the date is complete and valid. */}
            <label className="report-filter">
              <span>From</span>
              <input type="date" className="input" defaultValue={fromValue} max={today} onChange={onDate('from')} />
            </label>
            <label className="report-filter">
              <span>To</span>
              <input type="date" className="input" defaultValue={toValue} max={today} onChange={onDate('to')} />
            </label>
          </>
        )}
        {visibleFilters.map((key) => (
          <label key={key} className={`report-filter ${filters[key] ? 'is-set' : ''}`}>
            <span>{FILTERS[key].label}</span>
            <select className="select select--sm" value={filters[key]} onChange={(e) => update({ [FILTERS[key].param]: e.target.value || null })}>
              <option value="">{FILTERS[key].all}</option>
              {optionsFor(key).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        {active.length > 0 && (
          <button type="button" className="report-filters__clear" onClick={clearFilters}>
            Clear filters
          </button>
        )}

        <details className="report-sections">
          <summary>
            <ListChecks size={17} aria-hidden="true" /> Sections
            <span className="report-sections__count num">
              {tab.sections.length - hidden.length} of {tab.sections.length}
            </span>
          </summary>
          <div className="report-sections__menu">
            <p className="small muted">Show in this report and its printout:</p>
            {tab.sections.map((s) => (
              <label key={s.id} className="report-sections__item">
                <input type="checkbox" checked={show(s.id)} onChange={() => toggleSection(s.id)} />
                {s.label}
              </label>
            ))}
            <div className="report-sections__actions">
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setHidden([])} disabled={!hidden.length}>
                Show all
              </button>
            </div>
          </div>
        </details>
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
        {active.length > 0 && (
          <p className="report-head__filters">
            <SlidersHorizontal size={15} aria-hidden="true" /> Filtered to {active.join(', ')}.
            {filtered?.notes.map((n) => ` ${n}`)}
          </p>
        )}
      </header>

      {report ? (
        hidden.length === tab.sections.length ? (
          <div className="panel report-empty">
            <p>Every section of this report is hidden.</p>
            <button type="button" className="btn btn--ink btn--sm" onClick={() => setHidden([])}>
              Show all sections
            </button>
          </div>
        ) : (
          <tab.Body report={report} period={period} data={filtered} show={show} />
        )
      ) : (
        <div className="sk-block" style={{ height: 520 }} aria-busy="true" aria-label="Loading report" />
      )}
    </div>
  );
}
