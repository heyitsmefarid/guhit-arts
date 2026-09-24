// Miniature sample outputs drawn with HTML and CSS, one layout per service.
// They stand in for real portfolio images until the shop has its own work to show.

function QrGlyph({ size = 21 }) {
  // Deterministic pseudo-random modules with the three finder squares.
  const cells = [];
  let seed = 7;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const inFinder = (x, y) =>
    (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!inFinder(x, y) && rand() > 0.52) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  }
  const finder = (x, y) => (
    <g key={`f${x}${y}`}>
      <rect x={x} y={y} width="7" height="7" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="pv-qr__code" shapeRendering="crispEdges" aria-hidden="true">
      <g fill="currentColor">
        {cells}
        {finder(0, 0)}
        {finder(size - 7, 0)}
        {finder(0, size - 7)}
      </g>
    </svg>
  );
}

const Lines = ({ n = 3, className = '' }) => (
  <span className={`pv-lines ${className}`} aria-hidden="true">
    {Array.from({ length: n }).map((_, i) => (
      <span key={i} />
    ))}
  </span>
);

function Art({ item }) {
  switch (item.variant) {
    case 'pubmat':
      return (
        <div className="pv__art pv-pubmat">
          <span className="pv-pubmat__sun" />
          <p className="pv-pubmat__title">{item.heading}</p>
          <p className="pv-pubmat__sub">{item.sub}</p>
          <span className="pv-pubmat__tag">Go, Mindoro!</span>
        </div>
      );
    case 'resume':
      return (
        <div className="pv__art pv-resume">
          <div className="pv-resume__side">
            <span className="pv-resume__avatar" />
            <Lines n={4} className="pv-lines--light" />
          </div>
          <div className="pv-resume__main">
            <p className="pv-resume__name">{item.heading}</p>
            <p className="pv-resume__role">{item.sub}</p>
            <span className="pv-resume__rule" />
            <Lines n={4} />
            <span className="pv-resume__rule" />
            <Lines n={3} />
          </div>
        </div>
      );
    case 'slides':
      return (
        <div className="pv__art pv-slides">
          <div className="pv-slides__slide">
            <p className="pv-slides__kicker">{item.sub}</p>
            <p className="pv-slides__title">{item.heading}</p>
            <div className="pv-slides__bars" aria-hidden="true">
              <span style={{ height: '40%' }} />
              <span style={{ height: '65%' }} />
              <span style={{ height: '52%' }} />
              <span style={{ height: '88%' }} />
            </div>
          </div>
          <div className="pv-slides__strip" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      );
    case 'invitation':
      return (
        <div className="pv__art pv-invite">
          <div className="pv-invite__frame">
            <p className="pv-invite__small">You are invited</p>
            <p className="pv-invite__title">{item.heading}</p>
            <span className="pv-invite__rule" />
            <p className="pv-invite__small">{item.sub}</p>
          </div>
        </div>
      );
    case 'infographic':
      return (
        <div className="pv__art pv-info">
          <p className="pv-info__title">{item.heading}</p>
          <p className="pv-info__big">{item.sub.split(' ')[0]} kg</p>
          <p className="pv-info__cap">collected along the shore</p>
          <div className="pv-info__rows" aria-hidden="true">
            <span style={{ '--w': '82%' }}>Plastic</span>
            <span style={{ '--w': '56%' }}>Glass</span>
            <span style={{ '--w': '34%' }}>Metal</span>
          </div>
        </div>
      );
    case 'qr':
      return (
        <div className="pv__art pv-qr">
          <p className="pv-qr__brand">{item.sub}</p>
          <QrGlyph />
          <p className="pv-qr__cta">{item.heading}</p>
        </div>
      );
    default:
      return null;
  }
}

export default function PortfolioPreview({ item }) {
  return (
    <div className="pv">
      <Art item={item} />
    </div>
  );
}
