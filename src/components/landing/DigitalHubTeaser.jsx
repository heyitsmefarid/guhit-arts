import { Link } from 'react-router-dom';
import { digitalServices } from '../../data/digitalServices';
import { portfolio } from '../../data/portfolio';
import PortfolioPreview from '../digital/PortfolioPreview';
import { servicePrice } from '../../utils/format';

export default function DigitalHubTeaser() {
  return (
    <section id="digital-hub" className="hub" aria-labelledby="hub-title">
      <div className="container hub__grid">
        <div className="hub__intro" data-reveal>
          <p className="sticker">Proposed new division</p>
          <h2 id="hub-title" className="h2">
            Student Digital Help Hub
          </h2>
          <p className="hub__lede">
            Resumes, slides, pubmats, invitations, and websites, made by people who have been laying out print work
            for decades. Send a request online, check the draft, and pick up printed copies at the same counter.
          </p>
          <p className="hub__note">
            Prices below are starting rates. Complex or custom projects get a quotation after we review your brief.
          </p>
          <Link to={`/login?next=${encodeURIComponent('/app/services')}`} className="btn btn--light btn--lg">
            Sign in to request a service
          </Link>
        </div>

        <div className="priceboard" aria-label="Digital service prices" data-reveal>
          <p className="priceboard__head">
            <span>Service</span>
            <span>Starts at</span>
          </p>
          <ul role="list">
            {digitalServices.map((s, i) => (
              <li key={s.id} className="priceboard__row" style={{ '--i': i }}>
                <span className="priceboard__name">{s.name}</span>
                <span className="priceboard__leader" aria-hidden="true" />
                <span className="priceboard__price num">{servicePrice(s)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container">
        <h3 className="hub__samples-title">Sample outputs</h3>
        <ul className="samples" role="list" data-reveal>
          {portfolio.map((item, i) => (
            <li key={item.id} className="sample" style={{ '--i': i }}>
              <PortfolioPreview item={item} />
              <p className="sample__title">{item.title}</p>
              <p className="sample__client">{item.client}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
