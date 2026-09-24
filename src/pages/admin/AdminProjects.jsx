import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SearchX, Zap } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useAdmin } from '../../context/AdminContext';
import { STATUS_FLOW, statusLabel } from '../../data/statuses';
import { digitalServices } from '../../data/digitalServices';
import { daysUntil, formatDate, formatPeso } from '../../utils/format';

function Due({ p }) {
  const d = daysUntil(p.deadline);
  if (p.status === 'completed') return <span className="muted">{formatDate(p.deadline)}</span>;
  const cls = d < 0 ? 'deadline deadline--late' : d <= 2 ? 'deadline deadline--soon' : 'deadline';
  return (
    <span className={cls}>
      {formatDate(p.deadline)}
      <span className="tiny"> {d < 0 ? `${-d}d late` : d === 0 ? 'today' : `in ${d}d`}</span>
    </span>
  );
}

export default function AdminProjects() {
  const { projects, loading } = useAdmin();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'all';
  const service = params.get('service') ?? 'all';
  const q = params.get('q') ?? '';

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const matchesStatus = (p, s) => s === 'all' || (s === 'open' ? p.status !== 'completed' : p.status === s);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return projects
      .filter((p) => matchesStatus(p, status))
      .filter((p) => service === 'all' || p.serviceId === service)
      .filter((p) => !term || `${p.ref} ${p.title} ${p.customer.name} ${p.serviceName}`.toLowerCase().includes(term));
  }, [projects, status, service, q]);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    ...STATUS_FLOW.map((s) => ({ id: s, label: statusLabel(s, 'project') })),
  ];

  return (
    <div className="page">
      <PageHeader title="Digital Requests" description="Requests from the Student Digital Help Hub. Quote, approve, send drafts, and deliver final files." />

      <div className="admin-filters">
        <div className="input-wrap admin-filters__search">
          <Search size={18} aria-hidden="true" />
          <input
            className="input"
            type="search"
            placeholder="Search by reference, title, or customer"
            value={q}
            onChange={(e) => set('q', e.target.value)}
            aria-label="Search requests"
          />
        </div>
        <label className="admin-filters__select">
          <span className="sr-only">Service</span>
          <select className="select" value={service} onChange={(e) => set('service', e.target.value)}>
            <option value="all">All services</option>
            {digitalServices
              .filter((s) => s.id !== 'rush')
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
      </div>
      <div className="chip-row" role="group" aria-label="Filter by status">
        {filters.map((f) => (
          <button key={f.id} type="button" className="chip" aria-pressed={status === f.id} onClick={() => set('status', f.id)}>
            {f.label} <span className="chip__count num">{projects.filter((p) => matchesStatus(p, f.id)).length}</span>
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
                <th scope="col">Request</th>
                <th scope="col">Customer</th>
                <th scope="col">Service</th>
                <th scope="col" className="t-right">
                  Price
                </th>
                <th scope="col">Deadline</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.ref} className={p.status === 'pending' ? 'is-new' : ''}>
                  <td data-label="Request">
                    <Link to={`/admin/projects/${p.ref}`} className="t-title">
                      {p.title}
                    </Link>
                    <span className="t-sub num">
                      {p.ref}
                      {p.rush && (
                        <span className="t-rush">
                          <Zap size={12} aria-hidden="true" /> Rush
                        </span>
                      )}
                    </span>
                  </td>
                  <td data-label="Customer">{p.customer.name}</td>
                  <td data-label="Service">{p.serviceName}</td>
                  <td data-label="Price" className="t-right num t-strong">
                    {p.price ? formatPeso(p.price) : <span className="t-needs">Needs quote</span>}
                  </td>
                  <td data-label="Deadline" className="num">
                    <Due p={p} />
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={p.status} kind="project" />
                  </td>
                  <td className="t-action">
                    <Link to={`/admin/projects/${p.ref}`} className="btn btn--ghost btn--sm">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={SearchX} title="No requests match" body="Try another search or clear the filters.">
          <button type="button" className="btn btn--ink" onClick={() => setParams({}, { replace: true })}>
            Clear filters
          </button>
        </EmptyState>
      )}
    </div>
  );
}
