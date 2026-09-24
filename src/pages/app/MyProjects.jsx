import { Link, useSearchParams } from 'react-router-dom';
import { FolderKanban, Zap } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useAccount } from '../../context/AccountContext';
import { isActive } from '../../data/statuses';
import { daysUntil, formatDate, formatPeso } from '../../utils/format';

const FILTERS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'pending', label: 'Pending review', test: (p) => p.status === 'pending' },
  { id: 'active', label: 'In progress', test: (p) => isActive(p.status) && p.status !== 'pending' },
  { id: 'completed', label: 'Completed', test: (p) => p.status === 'completed' },
];

function Deadline({ project }) {
  const d = daysUntil(project.deadline);
  const soon = isActive(project.status) && d >= 0 && d <= 2;
  return (
    <span className={soon ? 'deadline deadline--soon' : 'deadline'}>
      {formatDate(project.deadline)}
      {isActive(project.status) && d >= 0 && <span className="tiny"> {d === 0 ? 'today' : `in ${d}d`}</span>}
    </span>
  );
}

export default function MyProjects() {
  const { projects, loading } = useAccount();
  const [params, setParams] = useSearchParams();
  const filter = FILTERS.find((f) => f.id === params.get('filter')) ?? FILTERS[0];
  const shown = projects.filter(filter.test);

  return (
    <div className="page">
      <PageHeader
        title="My Projects"
        description="Digital service requests from the Student Digital Help Hub."
        actions={
          <Link to="/app/services" className="btn btn--primary">
            New request
          </Link>
        }
      />

      <div className="chip-row" role="group" aria-label="Filter projects">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="chip"
            aria-pressed={filter.id === f.id}
            onClick={() => setParams(f.id === 'all' ? {} : { filter: f.id }, { replace: true })}
          >
            {f.label} <span className="chip__count num">{projects.filter(f.test).length}</span>
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
                <th scope="col">Project</th>
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
                <tr key={p.ref}>
                  <td data-label="Project">
                    <Link to={`/app/track/${p.ref}`} className="t-title">
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
                  <td data-label="Service">{p.serviceName}</td>
                  <td data-label="Price" className="t-right num t-strong">
                    {p.price ? formatPeso(p.price) : <span className="muted">For quote</span>}
                  </td>
                  <td data-label="Deadline" className="num">
                    <Deadline project={p} />
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={p.status} kind="project" />
                  </td>
                  <td className="t-action">
                    <Link to={`/app/track/${p.ref}`} className="btn btn--ghost btn--sm">
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
          icon={FolderKanban}
          title={filter.id === 'all' ? 'No projects yet' : 'Nothing here right now'}
          body={
            filter.id === 'all'
              ? 'Request a resume, slides, a pubmat, or any digital service. Your requests and their status show up here.'
              : 'Try the All filter to see every project.'
          }
          note={filter.id === 'all' ? 'Thesis season? We do slides too.' : undefined}
        >
          <Link to="/app/services" className="btn btn--primary">
            Browse digital services
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
