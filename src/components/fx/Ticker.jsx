import RegMark from '../brand/RegMark';

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
  return (
    <div className="ticker" aria-hidden="true">
      <Band items={BOTTOM} tone="yellow" reverse />
      <Band items={TOP} tone="ink" />
    </div>
  );
}
