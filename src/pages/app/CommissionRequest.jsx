import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Paperclip, PencilLine, Send, TriangleAlert, Zap } from 'lucide-react';
import FileDrop from '../../components/ui/FileDrop';
import StatusBadge from '../../components/ui/StatusBadge';
import RegMark from '../../components/brand/RegMark';
import Confetti from '../../components/fx/Confetti';
import ServiceIcon from '../../components/digital/ServiceIcon';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { RUSH_FEE, getDigitalService, requestableServices, rushFeeFor } from '../../data/digitalServices';
import { formatDate, formatFileSize, formatPeso, servicePrice } from '../../utils/format';

const STEPS = ['Details', 'Review', 'Submitted'];

const isoDate = (d) => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const addDays = (n) => isoDate(new Date(Date.now() + n * 864e5));

function validate(f) {
  const e = {};
  if (!f.customerName.trim()) e.customerName = 'Enter the name we should put on the request.';
  if (!f.serviceId) e.serviceId = 'Choose a service.';
  if (f.title.trim().length < 4) e.title = 'Give the project a short title, like “Org week pubmat”.';
  if (f.description.trim().length < 20) e.description = 'Describe the project in a sentence or two (at least 20 characters).';
  if (!f.deadline) e.deadline = 'Pick the date you need the final files.';
  else if (f.deadline < addDays(1)) e.deadline = 'Choose a date from tomorrow onward. For same-day work, tick Rush order and message the shop.';
  if (f.budget === '' || Number(f.budget) < 0) e.budget = 'Enter your budget in pesos. Use 0 if you want us to quote first.';
  return e;
}

function Stepper({ step }) {
  return (
    <ol className="progress" role="list" aria-label="Request progress">
      {STEPS.map((s, i) => (
        <li key={s} className={`progress__step ${i < step ? 'is-done' : ''} ${i === step ? 'is-current' : ''}`} aria-current={i === step ? 'step' : undefined}>
          <span className="progress__num num">{i + 1}</span>
          {s}
        </li>
      ))}
    </ol>
  );
}

export default function CommissionRequest() {
  const { user } = useAuth();
  const { submitProject } = useAccount();
  const [params] = useSearchParams();
  const initialService = getDigitalService(params.get('service'))?.id;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    customerName: user.fullName,
    serviceId: initialService && initialService !== 'rush' ? initialService : '',
    title: '',
    description: '',
    deadline: '',
    budget: '',
    rush: params.get('service') === 'rush',
    instructions: '',
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const service = getDigitalService(form.serviceId);
  const base = service?.startingPrice ?? null;
  const rushFee = form.rush ? rushFeeFor(base) : 0;
  const estimate = base ? base + (rushFee ?? 0) : null;
  const soon = form.deadline && form.deadline <= addDays(2);
  const lowBudget = base && form.budget !== '' && Number(form.budget) > 0 && Number(form.budget) < estimate;

  const set = (k) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const next = { ...form, [k]: value };
    setForm(next);
    if (Object.keys(errors).length) setErrors(validate(next));
  };

  const toReview = (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setStep(1);
    window.scrollTo(0, 0);
  };

  const submit = async () => {
    setBusy(true);
    const project = await submitProject({
      serviceId: service.id,
      serviceName: service.name,
      customerName: form.customerName.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      deadline: form.deadline,
      budget: Number(form.budget),
      rush: form.rush,
      instructions: form.instructions.trim(),
      files,
      price: estimate,
    });
    setSubmitted(project);
    setStep(2);
    setBusy(false);
    window.scrollTo(0, 0);
  };

  const summaryRows = useMemo(
    () => [
      ['Customer name', form.customerName],
      ['Service', service?.name],
      ['Project title', form.title],
      ['Deadline', form.deadline ? formatDate(form.deadline, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) : ''],
      ['Budget', form.budget !== '' ? (Number(form.budget) === 0 ? 'Quote first' : formatPeso(Number(form.budget))) : ''],
      ['Rush order', form.rush ? `Yes${rushFee ? `, +${formatPeso(rushFee)}` : ', fee included in the quote'}` : 'No'],
    ],
    [form, service, rushFee]
  );

  if (step === 2 && submitted) {
    return (
      <div className="page">
        <Confetti />
        <div className="done">
          <span className="done__mark" aria-hidden="true">
            <RegMark size={56} />
          </span>
          <h1 className="h1">Project Request Submitted!</h1>
          <p className="done__lede">
            Thanks, we got your {submitted.serviceName} request. The Digital Help Hub team will review it and confirm the price
            {submitted.price ? '' : ' with a quotation'}. You will see every update in Notifications.
          </p>
          <dl className="done__facts">
            <div>
              <dt>Reference</dt>
              <dd className="done__ref num">{submitted.ref}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={submitted.status} kind="project" />
              </dd>
            </div>
            <div>
              <dt>Estimate</dt>
              <dd className="num">{submitted.price ? `from ${formatPeso(submitted.price)}` : 'For quotation'}</dd>
            </div>
          </dl>
          <div className="done__actions">
            <Link to={`/app/track/${submitted.ref}`} className="btn btn--primary btn--lg">
              Track this project
            </Link>
            <Link to="/app/projects" className="btn btn--ghost btn--lg">
              Go to My Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page commission">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/app/services">
          <ChevronLeft size={16} aria-hidden="true" /> Digital Services
        </Link>
      </nav>
      <header className="commission__head">
        <h1 className="h1">Request a digital service</h1>
        <Stepper step={step} />
      </header>

      {step === 0 && (
        <form className="commission__grid" onSubmit={toReview} noValidate>
          <div className="commission__form">
            <div className="form-grid form-grid--2">
              <div className="field">
                <label htmlFor="customerName">Customer name</label>
                <input id="customerName" className="input" value={form.customerName} onChange={set('customerName')} aria-invalid={!!errors.customerName} />
                {errors.customerName && <p className="error">{errors.customerName}</p>}
              </div>
              <div className="field">
                <label htmlFor="serviceId">Service</label>
                <select id="serviceId" className="select" value={form.serviceId} onChange={set('serviceId')} aria-invalid={!!errors.serviceId}>
                  <option value="">Choose a service</option>
                  {requestableServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({servicePrice(s)})
                    </option>
                  ))}
                </select>
                {errors.serviceId && <p className="error">{errors.serviceId}</p>}
              </div>
            </div>

            <div className="field">
              <label htmlFor="title">Project title</label>
              <input id="title" className="input" value={form.title} onChange={set('title')} placeholder="Example: Science fair poster" aria-invalid={!!errors.title} />
              {errors.title && <p className="error">{errors.title}</p>}
            </div>

            <div className="field">
              <label htmlFor="description">Project description</label>
              <textarea
                id="description"
                className="textarea"
                rows={5}
                value={form.description}
                onChange={set('description')}
                placeholder="What is it for, who will see it, and what should it include? Mention sizes, number of slides or pages, and any text that must appear."
                aria-invalid={!!errors.description}
              />
              {errors.description ? <p className="error">{errors.description}</p> : <p className="hint">The more detail you give, the fewer revisions you need.</p>}
            </div>

            <div className="form-grid form-grid--2">
              <div className="field">
                <label htmlFor="deadline">Deadline</label>
                <input id="deadline" className="input" type="date" min={addDays(1)} value={form.deadline} onChange={set('deadline')} aria-invalid={!!errors.deadline} />
                {errors.deadline ? (
                  <p className="error">{errors.deadline}</p>
                ) : (
                  service && <p className="hint">Usual turnaround: {service.turnaround}.</p>
                )}
              </div>
              <div className="field">
                <label htmlFor="budget">Budget</label>
                <div className="input-prefix">
                  <span aria-hidden="true">₱</span>
                  <input
                    id="budget"
                    className="input num"
                    type="number"
                    min="0"
                    step="50"
                    inputMode="numeric"
                    value={form.budget}
                    onChange={set('budget')}
                    placeholder={base ? String(estimate) : '0'}
                    aria-invalid={!!errors.budget}
                  />
                </div>
                {errors.budget ? (
                  <p className="error">{errors.budget}</p>
                ) : lowBudget ? (
                  <p className="hint hint--warn">This is below the {formatPeso(estimate)} starting price. We may suggest a smaller scope.</p>
                ) : (
                  <p className="hint">{base ? `Starts at ${formatPeso(base)}.` : 'This service is quoted after review. Enter 0 to get a quote first.'}</p>
                )}
              </div>
            </div>

            <label className={`check rush ${form.rush ? 'is-on' : ''}`}>
              <input type="checkbox" checked={form.rush} onChange={set('rush')} />
              <span>
                <strong>
                  <Zap size={16} aria-hidden="true" /> Rush order
                </strong>
                <span className="small muted">
                  Move to the front of the queue for +{RUSH_FEE.percent}% (minimum {formatPeso(RUSH_FEE.minimum)}).
                  {soon && !form.rush && ' Your deadline is close, so this is recommended.'}
                </span>
              </span>
            </label>

            <div className="field">
              <label htmlFor="instructions">
                Additional instructions <span className="muted">(optional)</span>
              </label>
              <textarea
                id="instructions"
                className="textarea"
                rows={3}
                value={form.instructions}
                onChange={set('instructions')}
                placeholder="Colors, fonts, logos to use, designs you like, or a Google Drive link for large files."
              />
            </div>

            <div className="field">
              <span className="label">Reference files</span>
              <FileDrop files={files} onChange={setFiles} accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" />
            </div>
          </div>

          <aside className="summary commission__aside" aria-label="Estimate">
            {service ? (
              <>
                <p className="commission__svc">
                  <span className="svc__icon">
                    <ServiceIcon name={service.icon} />
                  </span>
                  <strong>{service.name}</strong>
                </p>
                <dl className="summary__rows">
                  <div>
                    <dt>Starting price</dt>
                    <dd className="num">{base ? formatPeso(base) : 'Quotation'}</dd>
                  </div>
                  {form.rush && (
                    <div>
                      <dt>Rush fee</dt>
                      <dd className="num">{rushFee ? `+${formatPeso(rushFee)}` : 'In quote'}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Turnaround</dt>
                    <dd>{form.rush ? '24 hours or less' : service.turnaround}</dd>
                  </div>
                </dl>
                <div className="summary__total">
                  <span>Estimate</span>
                  <strong className="num">{estimate ? `from ${formatPeso(estimate)}` : 'For quotation'}</strong>
                </div>
              </>
            ) : (
              <p className="muted small">Choose a service to see the starting price and turnaround.</p>
            )}
            <button type="submit" className="btn btn--primary btn--lg btn--block">
              Review request
            </button>
            {Object.keys(errors).length > 0 && (
              <p className="alert alert--error" role="alert">
                <TriangleAlert size={18} aria-hidden="true" /> Some details need fixing. Check the highlighted fields.
              </p>
            )}
          </aside>
        </form>
      )}

      {step === 1 && (
        <div className="commission__grid">
          <section className="review" aria-labelledby="review-title">
            <h2 id="review-title" className="h3">
              Project summary
            </h2>
            <p className="muted small">Check the details. You can still edit them before sending.</p>
            <dl className="review__list">
              {summaryRows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              <div className="review__wide">
                <dt>Project description</dt>
                <dd>{form.description}</dd>
              </div>
              {form.instructions && (
                <div className="review__wide">
                  <dt>Additional instructions</dt>
                  <dd>{form.instructions}</dd>
                </div>
              )}
              <div className="review__wide">
                <dt>Files</dt>
                <dd>
                  {files.length ? (
                    <ul className="review__files" role="list">
                      {files.map((f) => (
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
          </section>

          <aside className="summary commission__aside" aria-label="Submit">
            <div className="summary__total">
              <span>Estimate</span>
              <strong className="num">{estimate ? `from ${formatPeso(estimate)}` : 'For quotation'}</strong>
            </div>
            <p className="small muted">
              No payment now. We confirm the final price before any work starts, and you pay after approving it.
            </p>
            <button type="button" className="btn btn--primary btn--lg btn--block" onClick={submit} disabled={busy}>
              {busy ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Submitting…
                </>
              ) : (
                <>
                  <Send size={18} aria-hidden="true" /> Submit request
                </>
              )}
            </button>
            <button type="button" className="btn btn--ghost btn--block" onClick={() => setStep(0)} disabled={busy}>
              <PencilLine size={18} aria-hidden="true" /> Edit details
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
