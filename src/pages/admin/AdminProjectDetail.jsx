import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Download, FileCheck2, FileUp, Paperclip, SearchX, Zap } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import StatusTimeline from '../../components/ui/StatusTimeline';
import EmptyState from '../../components/ui/EmptyState';
import StatusControl from '../../components/admin/StatusControl';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../utils/permissions';
import { useToast } from '../../context/ToastContext';
import { getDigitalService } from '../../data/digitalServices';
import { statusLabel } from '../../data/statuses';
import { daysUntil, formatDate, formatDateTime, formatFileSize, formatPeso } from '../../utils/format';

export default function AdminProjectDetail() {
  const { ref } = useParams();
  const { findProject, updateProject, loading } = useAdmin();
  const { user } = useAuth();
  const canPrice = can(user, 'edit-prices');
  const { toast } = useToast();
  const project = findProject(ref);
  const [price, setPrice] = useState('');
  const [savingQuote, setSavingQuote] = useState(false);
  const fileRef = useRef(null);
  const [uploadKind, setUploadKind] = useState('draft');

  useEffect(() => {
    if (project) setPrice(project.price ? String(project.price) : '');
  }, [project?.ref, project?.price]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="page"><div className="sk-block" style={{ height: 360 }} aria-busy="true" /></div>;
  if (!project) {
    return (
      <div className="page">
        <EmptyState icon={SearchX} title={`Request ${ref} was not found`} body="Check the reference number, or find it from the requests list.">
          <Link to="/admin/projects" className="btn btn--ink">
            Back to requests
          </Link>
        </EmptyState>
      </div>
    );
  }

  const service = getDigitalService(project.serviceId);
  const due = daysUntil(project.deadline);
  const quoted = Number(price) > 0;

  const onUpdate = async (status, note) => {
    await updateProject(project.ref, { status, note });
    toast(`${project.ref} is now ${statusLabel(status, 'project')}. ${project.customer.name} was notified.`);
  };

  const saveQuote = async () => {
    setSavingQuote(true);
    await updateProject(project.ref, { price: Number(price) });
    setSavingQuote(false);
    toast(`Price for ${project.ref} set to ${formatPeso(Number(price))}.`);
  };

  // Sending a draft moves the request to For Revision; final files complete it.
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const status = uploadKind === 'final' ? 'completed' : 'for_revision';
    const note = uploadKind === 'final' ? `Final files are ready: ${f.name}` : `Draft sent for your review: ${f.name}`;
    await updateProject(project.ref, { status, note, deliverable: { name: f.name, size: f.size, kind: uploadKind } });
    toast(`${f.name} sent to ${project.customer.name}. The request is now ${statusLabel(status, 'project')}.`);
  };

  const pickFile = (kind) => {
    setUploadKind(kind);
    fileRef.current?.click();
  };

  return (
    <div className="page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/admin/projects">
          <ChevronLeft size={16} aria-hidden="true" /> Digital Requests
        </Link>
      </nav>

      <header className="track-head">
        <div>
          <p className="track-head__kind">{project.serviceName}</p>
          <h1 className="h1">{project.title}</h1>
          <p className="muted num">
            {project.ref}, submitted {formatDateTime(project.createdAt)} by{' '}
            {can(user, 'view-customers') ? <Link to={`/admin/customers/${project.customer.id}`}>{project.customer.name}</Link> : project.customer.name}
          </p>
        </div>
        <StatusBadge status={project.status} kind="project" />
      </header>

      <div className="track-progress">
        <StatusTimeline item={project} compact labels />
      </div>

      <div className="admin-detail">
        <div className="admin-detail__main">
          <section className="panel" aria-labelledby="brief-h">
            <h2 id="brief-h" className="h3 panel__title">
              Brief
            </h2>
            <dl className="kv">
              <div>
                <dt>Deadline</dt>
                <dd className={due <= 2 && project.status !== 'completed' ? 'deadline--soon' : ''}>
                  {formatDate(project.deadline, { weekday: 'short', month: 'short', day: 'numeric' })}
                  {project.status !== 'completed' && (
                    <span className="tiny"> ({due < 0 ? `${-due} days late` : due === 0 ? 'today' : `in ${due} days`})</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Customer budget</dt>
                <dd className="num">{project.budget ? formatPeso(project.budget) : 'Asked for a quote'}</dd>
              </div>
              <div>
                <dt>Service starts at</dt>
                <dd className="num">{service?.startingPrice ? formatPeso(service.startingPrice) : 'Quotation'}</dd>
              </div>
              <div>
                <dt>Rush order</dt>
                <dd>
                  {project.rush ? (
                    <>
                      <Zap size={14} aria-hidden="true" /> Yes, move to the front
                    </>
                  ) : (
                    'No'
                  )}
                </dd>
              </div>
              <div className="kv__wide">
                <dt>Description</dt>
                <dd>{project.description}</dd>
              </div>
              {project.instructions && (
                <div className="kv__wide">
                  <dt>Instructions</dt>
                  <dd>{project.instructions}</dd>
                </div>
              )}
              <div className="kv__wide">
                <dt>Files from the customer</dt>
                <dd>
                  {project.files?.length ? (
                    <ul className="filelist" role="list">
                      {project.files.map((f) => (
                        <li key={f.name}>
                          <Paperclip size={16} aria-hidden="true" />
                          <span className="filelist__name">{f.name}</span>
                          <span className="tiny muted num">{formatFileSize(f.size)}</span>
                          <button
                            type="button"
                            className="icon-btn filelist__remove"
                            aria-label={`Download ${f.name}`}
                            onClick={() => toast('Prototype: uploaded files are not stored, so there is nothing to download.', { tone: 'info' })}
                          >
                            <Download size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="muted">No files attached</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="panel" aria-labelledby="deliver-h">
            <div className="panel__head">
              <h2 id="deliver-h" className="h3">
                Files sent to the customer
              </h2>
            </div>
            {project.deliverables?.length ? (
              <ul className="filelist" role="list">
                {project.deliverables.map((f) => (
                  <li key={`${f.name}-${f.at}`}>
                    <FileCheck2 size={16} aria-hidden="true" />
                    <span className="filelist__name">{f.name}</span>
                    <span className={`tag ${f.kind === 'final' ? 'tag--final' : ''}`}>{f.kind === 'final' ? 'Final' : 'Draft'}</span>
                    <span className="tiny muted num">{formatDate(f.at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">Nothing sent yet. Upload a draft when the first version is ready.</p>
            )}
            {project.status !== 'completed' && project.status !== 'pending' && (
              <div className="deliver-actions">
                <button type="button" className="btn btn--ghost" onClick={() => pickFile('draft')}>
                  <FileUp size={17} aria-hidden="true" /> Send a draft
                </button>
                <button type="button" className="btn btn--ink" onClick={() => pickFile('final')}>
                  <FileCheck2 size={17} aria-hidden="true" /> Send final files
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" className="sr-only" onChange={onFile} aria-label="Choose a file to send" />
          </section>

          <section className="panel" aria-labelledby="hist-h">
            <h2 id="hist-h" className="h3 panel__title">
              History
            </h2>
            <StatusTimeline item={project} />
          </section>
        </div>

        <div className="admin-detail__side">
          <section className="panel quote" aria-labelledby="quote-h">
            <h2 id="quote-h" className="h3 panel__title">
              Price
            </h2>
            <div className="field">
              <label htmlFor="quote">Price for this request</label>
              <div className="quote__row">
                <div className="input-prefix">
                  <span aria-hidden="true">₱</span>
                  <input
                    readOnly={!canPrice}
                    id="quote"
                    className="input num"
                    type="number"
                    min="0"
                    step="50"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter a price"
                  />
                </div>
                {canPrice && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={saveQuote}
                  disabled={!quoted || Number(price) === project.price || savingQuote}
                >
                  Save
                </button>
                )}
              </div>
              <p className="hint">
                {!canPrice
                  ? 'Only the administrator sets prices and quotations.'
                  : project.price
                    ? `Currently ${formatPeso(project.price)}. The customer sees the price on their tracking page.`
                    : 'This request needs a quotation before you can approve it.'}
              </p>
            </div>
          </section>

          <StatusControl
            item={project}
            onUpdate={onUpdate}
            disabledReason={
              project.status === 'pending' && !project.price
                ? canPrice
                  ? 'Save a price first so the customer knows what they will pay.'
                  : 'Waiting for the administrator to set a price.'
                : ''
            }
          />
        </div>
      </div>
    </div>
  );
}
