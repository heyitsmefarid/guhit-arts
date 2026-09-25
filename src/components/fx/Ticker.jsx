import { useEffect, useRef } from 'react';
import RegMark from '../brand/RegMark';
import { prefersReducedMotion } from '../../utils/motion';

const TOP = [
  'Tarpaulin printing',
  'Sublimation jerseys',
  'Custom mugs',
  'Art supplies',
  'Hand lettering',
  'Photo printing',
  'Basketballs',
  'ID laces',
];
const BOTTOM = [
  'Resume and CV',
  'Pubmats',
  'PowerPoint decks',
  'Plaques and trophies',
  'Button pins',
  'Digital invitations',
  'Bond paper',
  'QR codes',
];
const INKS = ['cyan', 'magenta', 'yellow'];

function Band({ items, tone, reverse }) {
  // The list is doubled so the loop is seamless.
  const loop = [...items, ...items];
  return (
    <div className={`ticker__band ticker__band--${tone}`}>
      <div className={`ticker__track ${reverse ? 'ticker__track--reverse' : ''}`}>
        {loop.map((text, i) => (
          <span key={i} className="ticker__item">
            {text}
            <RegMark size={20} className={`ticker__mark ticker__mark--${INKS[i % 3]}`} />
          </span>
        ))}
      </div>
    </div>
  );
}

// Two crossed bands of "printed tape" listing what the shop makes. Decorative:
// the same services are listed in full in the sections below.
export default function Ticker() {
  const ref = useRef(null);

  // The tape leans with the speed of the scroll, then settles back upright.
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let lean = 0;
    let target = 0;
    let raf = 0;
    const tick = () => {
      lean += (target - lean) * 0.14;
      target *= 0.88;
      ref.current?.style.setProperty('--lean', `${lean.toFixed(2)}deg`);
      raf = Math.abs(lean) > 0.02 || Math.abs(target) > 0.02 ? requestAnimationFrame(tick) : 0;
    };
    const onScroll = () => {
      const now = performance.now();
      const speed = (window.scrollY - lastY) / Math.max(16, now - lastT);
      lastY = window.scrollY;
      lastT = now;
      target = Math.max(-12, Math.min(12, -speed * 7));
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="ticker" aria-hidden="true" ref={ref}>
      <Band items={BOTTOM} tone="yellow" reverse />
      <Band items={TOP} tone="ink" />
    </div>
  );
}
