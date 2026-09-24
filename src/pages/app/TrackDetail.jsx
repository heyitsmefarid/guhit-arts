import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Download, FastForward, FileCheck2, Paperclip, SearchX, Zap } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import StatusTimeline from '../../components/ui/StatusTimeline';
import EmptyState from '../../components/ui/EmptyState';
import ProductImage from '../../components/shop/ProductImage';
import { useAccount } from '../../context/AccountContext';
import { useToast } from '../../context/ToastContext';
import { nextStatus, statusLabel } from '../../data/statuses';
import { products } from '../../data/products';
import { formatDate, formatDateTime, formatFileSize, formatPeso } from '../../utils/format';

const PAYMENT_LABELS = { cash: 'Cash', gcash: 'GCash', maya: 'Maya' };

function OrderDetails({ order }) {
  return (
    <>
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
          <dt>{order.fulfillment === 'pickup' ? 'Pickup at shop' : 'Delivery'}</dt>
          <dd className="num">{order.deliveryFee ? formatPeso(order.deliveryFee) : 'Free'}</dd>
        </div>
        <div className="kv__total">
          <dt>Total</dt>
          <dd className="num">{formatPeso(order.total)}</dd>
        </div>
        <div>
          <dt>Payment</dt>
          <dd>{PAYMENT_LABELS[order.payment]}</dd>
        </div>
        <div>
          <dt>Contact</dt>
          <dd>
            {order.contact.name}, {order.contact.phone}
          </dd>
        </div>
        {order.contact.address && (
          <div>
            <dt>Deliver to</dt>
            <dd>{order.contact.address}</dd>
          </div>
        )}
      </dl>
    </>
  );
}

function ProjectDetails({ project, onDownload }) {
  return (
    <dl className="kv">
      <div>
        <dt>Service</dt>
        <dd>{project.serviceName}</dd>
      </div>
      <div>
        <dt>Price</dt>
        <dd className="num">{project.price ? formatPeso(project.price) : 'Waiting for a quotation'}</dd>
      </div>
      <div>
        <dt>Deadline</dt>
        <dd className="num">{formatDate(project.deadline, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</dd>
      </div>
      <div>
        <dt>Budget</dt>
        <dd className="num">{project.budget ? formatPeso(project.budget) : 'Quote first'}</dd>
      </div>
      {project.rush && (
        <div>
          <dt>Rush order</dt>
          <dd>
            <Zap size={14} aria-hidden="true" /> Yes
          </dd>
        </div>
      )}
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
      {project.deliverables?.length > 0 && (
        <div className="kv__wide">
          <dt>Files from Guhit</dt>
          <dd>
            <ul className="filelist" role="list">
              {project.deliverables.map((f) => (
                <li key={`${f.name}-${f.at}`}>
                  <FileCheck2 size={16} aria-hidden="true" />
                  <span className="filelist__name">{f.name}</span>
                  <span className={`tag ${f.kind === 'final' ? 'tag--final' : ''}`}>{f.kind === 'final' ? 'Final' : 'Draft'}</span>
                  <button
                    type="button"
                    className="icon-btn filelist__remove"
                    aria-label={`Download ${f.name}`}
                    onClick={onDownload}
                  >
                    <Download size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      )}
      <div className="kv__wide">
        <dt>Your files</dt>
        <dd>
          {project.files?.length ? (
            <ul className="review__files" role="list">
              {project.files.map((f) => (
                <li key={f.name}>
                  <Paperclip size={14} aria-hidden="true" /> {f.name} <span className="muted tiny">{formatFileSize(f.size)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="muted">No files attached</span>
          )}
        </dd>
      </div>
    </dl>
  );
}

export default function TrackDetail() {
  const { ref } = useParams();
  const { findByRef, advanceStatus, loading } = useAccount();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const item = findByRef(ref);

  if (loading) return <div className="page"><div className="sk-block" style={{ height: 320 }} aria-busy="true" /></div>;

  if (!item) {
    return (
      <div className="page">
        <EmptyState icon={SearchX} title={`We couldn't find ${ref.toUpperCase()}`} body="Check the reference number on your receipt or confirmation screen. Only orders and projects in your account can be tracked here.">
          <Link to="/app/track" className="btn btn--ink">
            Search another number
          </Link>
        </EmptyState>
      </div>
    );
  }

  const isOrder = item.kind === 'order';
  const next = nextStatus(item.status);

  const advance = async () => {
    setBusy(true);
    const updated = await advanceStatus(item.ref);
    setBusy(false);
    if (updated) toast(`${item.ref} moved to ${statusLabel(updated.status, item.kind)}.`, { tone: 'info' });
  };

  return (
    <div className="page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to={isOrder ? '/app/orders' : '/app/projects'}>
          <ChevronLeft size={16} aria-hidden="true" /> {isOrder ? 'My Orders' : 'My Projects'}
        </Link>
      </nav>

      <header className="track-head">
        <div>
          <p className="track-head__kind">{isOrder ? 'Product order' : 'Digital project'}</p>
          <h1 className="h1 num">{item.ref}</h1>
          <p className="muted">
            {isOrder ? `Placed ${formatDateTime(item.createdAt)}` : `${item.title}, submitted ${formatDateTime(item.createdAt)}`}
          </p>
        </div>
        <StatusBadge status={item.status} kind={item.kind} />
      </header>

      <div className="track-progress">
        <StatusTimeline item={item} compact labels />
      </div>

      <div className="track-grid">
        <section className="panel" aria-labelledby="progress-h">
          <h2 id="progress-h" className="h3 panel__title">
            Progress
          </h2>
          <StatusTimeline item={item} />
        </section>

        <div className="track-side">
          <section className="panel" aria-labelledby="details-h">
            <h2 id="details-h" className="h3 panel__title">
              {isOrder ? 'Items' : 'Project details'}
            </h2>
            {isOrder ? (
              <OrderDetails order={item} />
            ) : (
              <ProjectDetails
                project={item}
                onDownload={() => toast('Prototype: files are not stored, so there is nothing to download.', { tone: 'info' })}
              />
            )}
          </section>

          <section className="demo-control" aria-labelledby="demo-h">
            <h2 id="demo-h" className="h4">
              Prototype control
            </h2>
            <p className="small">
              Shop staff update this status from the admin panel. For a quick demo, you can also move it along here and watch the
              timeline and notifications change.
            </p>
            <button type="button" className="btn btn--ink btn--block" onClick={advance} disabled={!next || busy}>
              {busy ? (
                <span className="spinner" aria-hidden="true" />
              ) : (
                <FastForward size={18} aria-hidden="true" />
              )}
              {next ? `Move to ${statusLabel(next, item.kind)}` : 'Already completed'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
