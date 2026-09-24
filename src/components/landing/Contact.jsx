import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import SocialIcon from '../ui/SocialIcon';
import { business } from '../../data/business';
import { openStatus } from '../../utils/hours';

function MapPlaceholder() {
  // Stylized street map. Replace with an embedded map once the exact pin is confirmed.
  return (
    <svg className="map__art" viewBox="0 0 480 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="480" height="320" fill="#e4ecf4" />
      <path d="M0 250 C 90 230, 150 270, 250 250 S 400 200, 480 215 L480 320 L0 320Z" fill="#cfe6f5" />
      <g stroke="#fff" strokeWidth="14" fill="none" strokeLinecap="round">
        <path d="M-10 120 L 490 90" />
        <path d="M150 -10 L 190 330" />
        <path d="M330 -10 L 300 330" />
      </g>
      <g stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round">
        <path d="M-10 190 L 490 170" />
        <path d="M60 -10 L 90 240" />
        <path d="M420 -10 L 400 220" />
      </g>
      <g fill="#d3dbe6">
        <rect x="200" y="20" width="90" height="50" rx="6" />
        <rect x="30" y="20" width="100" height="70" rx="6" />
        <rect x="350" y="110" width="50" height="45" rx="6" />
        <rect x="205" y="130" width="80" height="30" rx="6" />
        <rect x="40" y="140" width="95" height="36" rx="6" />
      </g>
      <text x="236" y="112" fontSize="11" fill="#5c6378" fontFamily="Archivo, sans-serif" transform="rotate(-3 236 112)">
        Leuterio
      </text>
      <text x="40" y="290" fontSize="11" fill="#0072a8" fontFamily="Archivo, sans-serif">
        Calapan Bay
      </text>
    </svg>
  );
}

export default function Contact() {
  const status = openStatus();
  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="container">
        <header className="section-head" data-reveal>
          <h2 id="contact-title" className="h2">
            Visit the shop
          </h2>
          <p className="lede">Come by with your files or sketches, or message us first with what you need.</p>
        </header>

        <div className="contact__grid" data-reveal>
          <div className="contact__card">
            <h3 className="h3">{business.name}</h3>
            <ul className="contact__list" role="list">
              <li>
                <MapPin size={20} aria-hidden="true" />
                <span>
                  {business.address.line1}
                  <br />
                  {business.address.line2}
                </span>
              </li>
              <li>
                <Phone size={20} aria-hidden="true" />
                <span>
                  {business.phone.mobile}
                  <br />
                  {business.phone.landline}
                </span>
              </li>
              <li>
                <Mail size={20} aria-hidden="true" />
                <span>{business.email.value}</span>
              </li>
            </ul>
            <p className="contact__placeholder tiny">Phone numbers and email are placeholders for the prototype.</p>
            <div className="socials">
              {business.socials.map((s) => (
                <a key={s.id} href={s.href} className="social" aria-label={`${s.label}: ${s.handle}`}>
                  <SocialIcon id={s.id} />
                  <span>{s.handle}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="contact__card contact__hours">
            <h3 className="h3">
              <Clock size={20} aria-hidden="true" /> Business hours
            </h3>
            <p className={`open-pill ${status.open ? 'is-open' : ''}`}>{status.text}</p>
            <dl className="hours">
              {business.hours.map((h) => (
                <div key={h.days}>
                  <dt>{h.days}</dt>
                  <dd className="num">{h.time}</dd>
                </div>
              ))}
            </dl>
            <Link to="/signup" className="btn btn--ghost btn--block">
              Order online instead
            </Link>
          </div>

          <div className="map">
            <MapPlaceholder />
            <span className="map__pin" aria-hidden="true">
              <MapPin size={30} strokeWidth={2.2} />
            </span>
            <div className="map__label">
              <p>
                <strong>{business.name}</strong>
                <br />
                <span className="small muted">{business.address.line1}</span>
              </p>
              <a href={business.mapUrl} target="_blank" rel="noreferrer" className="btn btn--ink btn--sm">
                <Navigation size={16} aria-hidden="true" /> Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
