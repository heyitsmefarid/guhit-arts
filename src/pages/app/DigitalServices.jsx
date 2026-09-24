import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import ServiceIcon from '../../components/digital/ServiceIcon';
import PortfolioPreview from '../../components/digital/PortfolioPreview';
import { digitalServices, hubSteps } from '../../data/digitalServices';
import { portfolio } from '../../data/portfolio';
import { servicePrice } from '../../utils/format';

export default function DigitalServices() {
  return (
    <div className="page hubpage">
      <header className="hubpage__hero">
        <p className="sticker">Proposed new division</p>
        <h1 className="h1">Student Digital Help Hub</h1>
        <p className="hubpage__lede">
          Get help with the digital side of school and work: resumes, slides, pubmats, invitations, and more. Send a
          request, review the draft, and print it at the shop if you need copies.
        </p>
        <p className="hubpage__note small">
          Prices are starting rates. Complex or custom projects get a quotation after we review your brief.
        </p>
      </header>

      <section aria-labelledby="svc-title">
        <h2 id="svc-title" className="sr-only">
          Services
        </h2>
        <ul className="svc-grid" role="list">
          {digitalServices.map((s) => {
            const isRush = s.id === 'rush';
            return (
              <li key={s.id} className={`svc ${s.startingPrice ? '' : 'svc--quote'}`}>
                <span className="svc__icon">
                  <ServiceIcon name={s.icon} />
                </span>
                <h3 className="h4">{s.name}</h3>
                <p className="svc__desc">{s.description}</p>
                <dl className="svc__meta">
                  <div>
                    <dt>Starts at</dt>
                    <dd className="svc__price num">{servicePrice(s)}</dd>
                  </div>
                  <div>
                    <dt>Turnaround</dt>
                    <dd>
                      <Clock size={14} aria-hidden="true" /> {s.turnaround}
                    </dd>
                  </div>
                </dl>
                {isRush ? (
                  <p className="svc__rush small muted">Tick “Rush order” on any request form to add this.</p>
                ) : (
                  <Link to={`/app/services/request?service=${s.id}`} className="btn btn--ink btn--block svc__cta">
                    Request Service
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="hubpage__how" aria-labelledby="how-title">
        <h2 id="how-title" className="h3">
          How a request works
        </h2>
        <ol className="steps" role="list">
          {hubSteps.map((step, i) => (
            <li key={step.title} className="steps__item">
              <span className="steps__num num">{i + 1}</span>
              <p className="h4">{step.title}</p>
              <p className="small muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="samples-title">
        <h2 id="samples-title" className="h3">
          Sample outputs
        </h2>
        <ul className="samples samples--light" role="list">
          {portfolio.map((item) => (
            <li key={item.id} className="sample">
              <PortfolioPreview item={item} />
              <p className="sample__title">{item.title}</p>
              <p className="sample__client">{item.client}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
