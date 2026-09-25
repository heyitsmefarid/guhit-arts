import { useRef } from 'react';
import { Link } from 'react-router-dom';
import RegMark from '../brand/RegMark';
import GuhitStroke from '../brand/GuhitStroke';
import CropFrame from '../brand/CropFrame';
import PencilTrail from '../fx/PencilTrail';
import { photoUrl, productImageUrl } from '../../utils/images';
import { openStatus } from '../../utils/hours';
import { prefersReducedMotion } from '../../utils/motion';
import { business, divisions } from '../../data/business';

const clamp = (n) => Math.max(-1, Math.min(1, n));
const TITLE = ['From Your Ideas', 'to Something Real.'];

export default function Hero() {
  const status = openStatus();
  const proofsRef = useRef(null);

  // The print proofs drift a little with the mouse, each at its own depth.
  const onPointerMove = (e) => {
    const el = proofsRef.current;
    if (!el || e.pointerType !== 'mouse' || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)).toFixed(3));
    el.style.setProperty('--my', clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)).toFixed(3));
  };
  const onPointerLeave = () => {
    proofsRef.current?.style.setProperty('--mx', '0');
    proofsRef.current?.style.setProperty('--my', '0');
  };

  return (
    <section className="hero" aria-labelledby="hero-title" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <PencilTrail />
      <div className="container hero__inner">
        <p className="hero__where">
          <RegMark size={16} />
          {business.address.line1}, Calapan City
        </p>
        <p className="hero__doodle hand" aria-hidden="true">
          psst, you can doodle on this page
        </p>
        {/* Each letter is its own piece of type: hovering one knocks it out of
            register for a moment. Screen readers get the plain headline. */}
        <h1 id="hero-title" className="display hero__title" aria-label="From Your Ideas to Something Real.">
          {TITLE.map((line, n) => (
            <span key={line} className="hero__title-line" aria-hidden="true">
              {n > 0 && ' '}
              {line.split(/( )/).map((part, i) =>
                part === ' ' ? ' ' : (
                  <span key={i} className="hero__word">
                    {[...part].map((ch, j) => (
                      <span key={j} className="hero__char">
                        {ch}
                      </span>
                    ))}
                  </span>
                )
              )}
            </span>
          ))}
        </h1>
        <GuhitStroke className="hero__stroke" />

        <div className="hero__grid">
          <div className="hero__copy">
            <p className="hero__sub">
              Guhit Arts Center — creativity, printing, customized products, sporting goods, and digital services
              since 1979.
            </p>
            <ul className="hero__inks" role="list" aria-label="What we do">
              {divisions.map((d, i) => (
                <li key={d.id} data-ink={d.ink} style={{ '--i': i }}>
                  <span aria-hidden="true" />
                  {d.name}
                </li>
              ))}
            </ul>
            <div className="hero__actions">
              <a href="#services" className="btn btn--ink btn--lg">
                Explore Services
              </a>
              <Link to="/signup" className="btn btn--primary btn--lg">
                Sign Up / Get Started
              </Link>
            </div>
            <p className={`hero__open ${status.open ? 'is-open' : ''}`}>
              <span className="hero__open-dot" aria-hidden="true" />
              {status.text}
            </p>
          </div>

          <div className="hero__proofs" ref={proofsRef}>
            <CropFrame as="figure" className="proof proof--a">
              <img src={photoUrl('hero-supplies')} alt="Paints, pencils, and brushes laid out on a work table" />
            </CropFrame>
            <CropFrame as="figure" className="proof proof--b">
              <img src={photoUrl('custom')} alt="A shirt design being screen printed" />
            </CropFrame>
            <CropFrame as="figure" className="proof proof--c">
              <img src={productImageUrl('tshirt')} alt="A shirt printed with a custom design" />
            </CropFrame>
            <p className="hero__note hand" aria-hidden="true">
              bring a sketch, leave with the real thing
            </p>
            <span className="hero__stamp" aria-hidden="true">
              <span>Since</span>
              <strong className="num">1979</strong>
              <small>Calapan City</small>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
