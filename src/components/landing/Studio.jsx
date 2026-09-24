import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer, RotateCcw } from 'lucide-react';
import CropFrame from '../brand/CropFrame';
import { products } from '../../data/products';
import { formatPeso } from '../../utils/format';
import { prefersReducedMotion } from '../../utils/motion';

// "Try it on something real": type a line, pick a product and an ink, and
// run it through the press. The design starts as a pencil sketch (the idea)
// and prints plate by plate (C, M, Y, then your ink) into the real thing.
const ITEMS = [
  { id: 'mug', productId: 'cus-mug', label: 'Mug', area: { x: 212, y: 196, w: 170 } },
  { id: 'shirt', productId: 'cus-shirt', label: 'Shirt', area: { x: 240, y: 176, w: 150 } },
  { id: 'pin', productId: 'cus-pins', label: 'Button pin', area: { x: 240, y: 184, w: 190 } },
  { id: 'tarp', productId: 'cus-tarpaulin', label: 'Tarpaulin', area: { x: 240, y: 184, w: 330 } },
];
const INKS = [
  { id: 'magenta', label: 'Magenta' },
  { id: 'cyan', label: 'Cyan' },
  { id: 'ink', label: 'Indigo' },
  { id: 'yellow', label: 'Yellow' },
];
const PLATES = ['c', 'm', 'y'];
const PRINT_MS = 1900;

function Mockup({ item }) {
  if (item.id === 'mug')
    return (
      <g className="mock">
        <defs>
          <linearGradient id="studio-mug-shade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#1c2054" stopOpacity="0.1" />
            <stop offset="0.28" stopColor="#1c2054" stopOpacity="0" />
            <stop offset="0.72" stopColor="#1c2054" stopOpacity="0" />
            <stop offset="1" stopColor="#1c2054" stopOpacity="0.13" />
          </linearGradient>
        </defs>
        <path className="mock__handle-out" d="M330 118 C 404 118 404 262 330 262" />
        <path className="mock__handle-in" d="M330 118 C 404 118 404 262 330 262" />
        <rect className="mock__body mock__line" x="96" y="78" width="234" height="236" rx="20" />
        <rect x="96" y="78" width="234" height="236" rx="20" fill="url(#studio-mug-shade)" />
        <ellipse className="mock__rim mock__line" cx="213" cy="80" rx="117" ry="14" />
      </g>
    );
  if (item.id === 'shirt')
    return (
      <g className="mock">
        <path
          className="mock__body mock__line"
          d="M170 52 L210 40 Q240 64 270 40 L310 52 L386 104 L356 150 L330 136 L330 322 L150 322 L150 136 L124 150 L94 104 Z"
        />
        <path className="mock__seam" d="M210 40 Q240 76 270 40" />
        <path className="mock__seam" d="M150 136 L150 118 M330 136 L330 118" />
      </g>
    );
  if (item.id === 'pin')
    return (
      <g className="mock">
        <circle className="mock__edge" cx="240" cy="184" r="136" />
        <circle className="mock__body mock__line" cx="240" cy="180" r="130" />
        <path className="mock__gloss" d="M150 110 A 118 118 0 0 1 250 64" />
      </g>
    );
  return (
    <g className="mock">
      <path className="mock__rope" d="M58 104 L20 60 M422 104 L460 60 M58 266 L20 310 M422 266 L460 310" />
      <rect className="mock__body mock__line" x="46" y="92" width="388" height="186" rx="4" />
      {[
        [58, 104],
        [422, 104],
        [58, 266],
        [422, 266],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} className="mock__eyelet" cx={cx} cy={cy} r="6" />
      ))}
    </g>
  );
}

// Long big text breaks onto two lines at the space nearest the middle.
function splitLine(text) {
  if (text.length <= 10 || !text.includes(' ')) return [text];
  const spaces = [...text.matchAll(/ /g)].map((m) => m.index);
  const cut = spaces.reduce((best, i) => (Math.abs(i - text.length / 2) < Math.abs(best - text.length / 2) ? i : best));
  return [text.slice(0, cut), text.slice(cut + 1)];
}

// Big text sized to fill the print area, centered with a smaller line under it.
function Artwork({ area, main, sub, hand }) {
  const lines = splitLine(main || 'Your words');
  const longest = Math.max(4, ...lines.map((l) => l.length));
  const size = Math.min(hand ? 48 : 44, area.w / (longest * (hand ? 0.5 : 0.74)));
  const subSize = Math.min(18, (area.w * 1.25) / Math.max(sub.length, 8));
  const lead = size * 1.02;
  const height = lines.length * lead + (sub ? subSize + 12 : 0);
  const top = area.y - height / 2 + size * 0.8;
  return (
    <g className={hand ? 'art art--sketch' : 'art'}>
      {lines.map((line, i) => (
        <text key={i} x={area.x} y={top + i * lead} textAnchor="middle" fontSize={size} className="art__main">
          {line}
        </text>
      ))}
      {sub && (
        <text x={area.x} y={top + (lines.length - 1) * lead + subSize + 14} textAnchor="middle" fontSize={subSize} className="art__sub">
          {sub}
        </text>
      )}
    </g>
  );
}

export default function Studio() {
  const [main, setMain] = useState('BSIT 4-A');
  const [sub, setSub] = useState('Class of 2026');
  const [itemId, setItemId] = useState('mug');
  const [ink, setInk] = useState('magenta');
  const [stage, setStage] = useState('sketch'); // sketch → printing → printed
  const timer = useRef(null);
  const proof = useRef(null);
  const item = ITEMS.find((i) => i.id === itemId);
  const product = products.find((p) => p.id === item.productId);
  const ready = /same day/i.test(product.leadTime) ? 'Ready the same day' : `Ready in ${product.leadTime}`;

  useEffect(() => () => clearTimeout(timer.current), []);

  // Any change takes the design back to a sketch.
  const edit = (fn) => (value) => {
    clearTimeout(timer.current);
    fn(value);
    setStage('sketch');
  };

  const backToSketch = () => {
    clearTimeout(timer.current);
    setStage('sketch');
  };

  const print = () => {
    clearTimeout(timer.current);
    // On phones the form sits under the preview; bring the preview into view.
    proof.current?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    if (prefersReducedMotion()) {
      setStage('printed');
      return;
    }
    setStage('printing');
    timer.current = setTimeout(() => setStage('printed'), PRINT_MS);
  };

  const words = [main.trim(), sub.trim()].filter(Boolean);
  const design = `Please print "${words.join('" and "') || 'my design'}" in ${INKS.find((i) => i.id === ink).label.toLowerCase()}, like the preview on the website.`;
  const orderPath = `/app/shop/${item.productId}?design=${encodeURIComponent(design)}`;
  const status = {
    sketch: 'Sketch. This is still an idea.',
    printing: 'Printing: cyan, magenta, yellow, then your ink.',
    printed: `Printed on a ${item.label.toLowerCase()}.`,
  }[stage];

  return (
    <section id="studio" className="section studio" aria-labelledby="studio-title">
      <div className="container studio__grid">
        <div className="studio__copy" data-reveal>
          <h2 id="studio-title" className="h2">
            Try your idea on something real
          </h2>
          <p className="lede">
            Type a line, pick what to print it on, and press print. We make the real one at the shop, usually in a day
            or two.
          </p>
        </div>

        <div className="studio__stage" data-reveal>
          <CropFrame as="figure" ref={proof} className={`studio__proof is-${stage}`} data-ink={ink}>
            <svg viewBox="0 0 480 360" role="img" aria-label={`Preview: "${words.join(', ') || 'Your words'}" on a ${item.label.toLowerCase()}, ${stage === 'sketch' ? 'as a pencil sketch' : `printed in ${ink === 'ink' ? 'indigo' : ink}`}`}>
              <Mockup item={item} />
              {stage === 'sketch' ? (
                <>
                  <rect className="art__area" x={item.area.x - item.area.w / 2 - 10} y={item.area.y - 62} width={item.area.w + 20} height="124" rx="6" />
                  <Artwork area={item.area} main={main.trim()} sub={sub.trim()} hand />
                </>
              ) : (
                <g key={`${stage}-${itemId}-${ink}-${main}-${sub}`}>
                  {stage === 'printing' &&
                    PLATES.map((p) => (
                      <g key={p} className={`plate-run plate-run--${p}`}>
                        <Artwork area={item.area} main={main.trim()} sub={sub.trim()} />
                      </g>
                    ))}
                  <g className="plate-run plate-run--final">
                    <Artwork area={item.area} main={main.trim()} sub={sub.trim()} />
                  </g>
                  {stage === 'printing' && <rect className="studio__sweep" x="-120" y="0" width="90" height="360" />}
                </g>
              )}
            </svg>
            <figcaption className="studio__caption">
              <span className="hand">{stage === 'sketch' ? 'your idea, in pencil' : stage === 'printing' ? 'on the press…' : 'the real thing'}</span>
            </figcaption>
          </CropFrame>

          <p className="studio__status" role="status">
            {status}
          </p>

          <div className={`studio__ticket ${stage === 'printed' ? 'is-ready' : ''}`}>
            <div>
              <p className="studio__ticket-name">{product.name}</p>
              <p className="studio__ticket-meta">
                From <strong className="num">{formatPeso(product.price)}</strong>. {ready}.
              </p>
            </div>
            <Link to={`/login?next=${encodeURIComponent(orderPath)}`} className="btn btn--ink">
              Order this design
            </Link>
          </div>
        </div>

        <form
          className="studio__form"
          data-reveal
          onSubmit={(e) => {
            e.preventDefault();
            print();
          }}
        >
          <div className="field">
            <label htmlFor="studio-main">Big text</label>
            <input id="studio-main" className="input" maxLength={18} value={main} onChange={(e) => edit(setMain)(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="studio-sub">Small text</label>
            <input id="studio-sub" className="input" maxLength={28} value={sub} onChange={(e) => edit(setSub)(e.target.value)} />
          </div>

          <fieldset className="studio__choices">
            <legend>Print it on</legend>
            <div className="studio__options">
              {ITEMS.map((i) => (
                <label key={i.id} className="studio__option">
                  <input type="radio" name="studio-item" value={i.id} checked={itemId === i.id} onChange={() => edit(setItemId)(i.id)} />
                  <span>{i.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="studio__choices">
            <legend>Ink</legend>
            <div className="studio__options">
              {INKS.map((i) => (
                <label key={i.id} className="studio__option studio__option--ink" data-ink={i.id}>
                  <input type="radio" name="studio-ink" value={i.id} checked={ink === i.id} onChange={() => edit(setInk)(i.id)} />
                  <span>
                    <span className="studio__swatch" aria-hidden="true" />
                    {i.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="studio__actions">
            <button type="submit" className="btn btn--primary btn--lg" disabled={stage === 'printing'}>
              <Printer size={19} aria-hidden="true" />
              {stage === 'printed' ? 'Print again' : 'Print it'}
            </button>
            {stage !== 'sketch' && (
              <button type="button" className="btn btn--ghost" onClick={backToSketch}>
                <RotateCcw size={17} aria-hidden="true" /> Back to sketch
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
