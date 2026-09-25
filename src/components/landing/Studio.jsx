import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleDot, Coffee, Flag, ImagePlus, Printer, RotateCcw, Shirt, Shuffle, X } from 'lucide-react';
import CropFrame from '../brand/CropFrame';
import QuantityStepper from '../ui/QuantityStepper';
import { products } from '../../data/products';
import { formatPeso } from '../../utils/format';
import { prefersReducedMotion } from '../../utils/motion';

// "Try your idea on something real": type a line (or add a logo), pick a
// product, a color, an ink, and a lettering style, and run it through the
// press. The design starts as a pencil sketch (the idea) and prints plate by
// plate (C, M, Y, then your ink) onto the product.
const WHITE = { id: 'white', label: 'White', fill: '#ffffff', edge: '#d3d8e1' };
const BLACK = { id: 'black', label: 'Black', fill: '#26272d', edge: '#111216', dark: true };
const ITEMS = [
  {
    id: 'mug',
    productId: 'cus-mug',
    label: 'Mug',
    icon: Coffee,
    unit: ['mug', 'mugs'],
    area: { x: 212, y: 196, w: 176, h: 150 },
    curve: 11,
    colors: [WHITE, BLACK],
  },
  {
    id: 'shirt',
    productId: 'cus-shirt',
    label: 'Shirt',
    icon: Shirt,
    unit: ['shirt', 'shirts'],
    area: { x: 240, y: 172, w: 128, h: 112 },
    colors: [
      WHITE,
      BLACK,
      { id: 'ash', label: 'Ash gray', fill: '#c9ccd3', edge: '#a9aeb8' },
      { id: 'maroon', label: 'Maroon', fill: '#7a1f2b', edge: '#561520', dark: true },
    ],
  },
  {
    id: 'pin',
    productId: 'cus-pins',
    label: 'Button pin',
    icon: CircleDot,
    unit: ['set of 10', 'sets of 10'],
    area: { x: 240, y: 180, w: 172, h: 150 },
    colors: [WHITE, { id: 'yellow', label: 'Yellow', fill: '#ffd60a', edge: '#d9b400' }, BLACK],
  },
  {
    id: 'tarp',
    productId: 'cus-tarpaulin',
    label: 'Tarpaulin',
    icon: Flag,
    unit: ['tarpaulin', 'tarpaulins'],
    area: { x: 240, y: 186, w: 320, h: 150 },
    colors: [WHITE],
  },
];
const INKS = [
  { id: 'magenta', label: 'Magenta', color: '#e4007c' },
  { id: 'cyan', label: 'Cyan', color: '#009fe3' },
  { id: 'yellow', label: 'Yellow', color: '#ffd60a' },
  { id: 'ink', label: 'Indigo', color: '#1c2054' },
  { id: 'white', label: 'White', color: '#ffffff' },
];
const LOOKS = [
  { id: 'bold', label: 'Bold' },
  { id: 'hand', label: 'Hand-lettered' },
  { id: 'outline', label: 'Outline' },
];
const EXAMPLES = [
  { main: 'Lalud Warriors', sub: 'Barangay League 2026', item: 'shirt', color: 'black', ink: 'yellow', look: 'bold', qty: 15 },
  { main: 'Bea turns 18', sub: 'November 15, 2026', item: 'mug', color: 'white', ink: 'magenta', look: 'hand', qty: 30 },
  { main: 'Vote Kyla', sub: 'SSG President', item: 'pin', color: 'yellow', ink: 'ink', look: 'bold', qty: 5 },
  { main: 'Happy 60th, Lola Nena!', sub: 'Love, your apos', item: 'tarp', color: 'white', ink: 'cyan', look: 'hand', qty: 1 },
  { main: 'BSIT 4-A', sub: 'Class of 2026', item: 'mug', color: 'black', ink: 'white', look: 'outline', qty: 40 },
];
const PLATES = ['c', 'm', 'y'];
const PRINT_MS = 1900;
const MAX_LOGO_BYTES = 3 * 1024 * 1024;

// ------------------------------------------------------------------
// Where the design sits inside a product's print area
// ------------------------------------------------------------------
// Long text breaks onto two lines at the space nearest the middle.
function splitLine(text) {
  if (text.length <= 10 || !text.includes(' ')) return [text];
  const spaces = [...text.matchAll(/ /g)].map((m) => m.index);
  const cut = spaces.reduce((best, i) => (Math.abs(i - text.length / 2) < Math.abs(best - text.length / 2) ? i : best));
  return [text.slice(0, cut), text.slice(cut + 1)];
}

// Logo on top, big text under it, small text last, all centered in the area
// and scaled down together when they would not fit.
function layout(area, { main, sub, logo, hand }) {
  const lines = main ? splitLine(main) : logo ? [] : ['Your words'];
  const hasText = lines.length > 0 || Boolean(sub);
  const logoSize = logo ? Math.min(area.w * 0.62, area.h * (hasText ? 0.46 : 0.95)) : 0;
  const gap = logo && hasText ? 10 : 0;
  const longest = Math.max(4, ...lines.map((l) => l.length));
  let size = Math.min(hand ? 48 : 44, area.w / (longest * (hand ? 0.5 : 0.74)));
  let subSize = sub ? Math.min(18, size * 0.55, (area.w * 1.25) / Math.max(sub.length, 8)) : 0;
  const blockHeight = () => lines.length * size * 1.02 + (sub ? subSize + 8 : 0);
  const room = area.h - logoSize - gap;
  if (blockHeight() > room) {
    const k = room / blockHeight();
    size *= k;
    subSize *= k;
  }
  const top = area.y - (logoSize + gap + blockHeight()) / 2;
  const first = top + logoSize + gap + size * 0.8;
  const lastLine = lines.length ? first + (lines.length - 1) * size * 1.02 : top + logoSize + gap - 6;
  return {
    lines: lines.map((text, i) => ({ text, y: first + i * size * 1.02 })),
    size,
    sub: sub ? { text: sub, y: lastLine + subSize + 8, size: subSize } : null,
    logo: logo ? { x: area.x - logoSize / 2, y: top, size: logoSize } : null,
  };
}

// A baseline that follows the mug's curve (the lower half of its rim ellipse).
const arcPath = (area, y, curve) => {
  const span = area.w / 2 + 40;
  return `M${area.x - span} ${y} Q${area.x} ${y + curve * 2} ${area.x + span} ${y}`;
};

function Artwork({ item, main, sub, logo, look, sketch, prefix, showLogo = true }) {
  const L = layout(item.area, { main, sub, logo, hand: sketch || look === 'hand' });
  const line = (text, y, size, cls, key) =>
    item.curve ? (
      <text key={key} fontSize={size} className={cls} textAnchor="middle">
        <textPath href={`#${prefix}-${key}`} startOffset="50%">
          {text}
        </textPath>
      </text>
    ) : (
      <text key={key} x={item.area.x} y={y} fontSize={size} className={cls} textAnchor="middle">
        {text}
      </text>
    );
  return (
    <g className={`art ${sketch ? 'art--sketch' : `art--${look}`}`}>
      {item.curve ? (
        <defs>
          {L.lines.map((l, i) => (
            <path key={i} id={`${prefix}-${i}`} d={arcPath(item.area, l.y, item.curve)} />
          ))}
          {L.sub && <path id={`${prefix}-sub`} d={arcPath(item.area, L.sub.y, item.curve)} />}
        </defs>
      ) : null}
      {showLogo && L.logo && (
        <image
          href={logo}
          x={L.logo.x}
          y={L.logo.y}
          width={L.logo.size}
          height={L.logo.size}
          preserveAspectRatio="xMidYMid meet"
          className="art__logo"
        />
      )}
      {L.lines.map((l, i) => line(l.text, l.y, L.size, 'art__main', i))}
      {L.sub && line(L.sub.text, L.sub.y, L.sub.size, 'art__sub', 'sub')}
    </g>
  );
}

// ------------------------------------------------------------------
// Product drawings. `children` is the printed design: it is drawn on the
// surface and then shaded with the product, so the ink sits in it.
// ------------------------------------------------------------------
const MUG = 'M100 84 V296 A112 18 0 0 0 324 296 V84 Z';
const MUG_HANDLE = 'M322 124 C 404 120 404 270 322 262';
const SHIRT =
  'M168 46 C 188 40 200 36 208 34 C 220 54 260 54 272 34 C 280 36 292 40 312 46 L 384 86 C 391 90 393 97 389 103 L 361 150 C 357 157 350 158 344 155 L 328 146 L 330 316 C 330 322 326 326 320 326 L 160 326 C 154 326 150 322 150 316 L 152 146 L 136 155 C 130 158 123 157 119 150 L 91 103 C 87 97 89 90 96 86 Z';
const TARP = 'M48 96 Q 145 86 240 96 T 432 96 L 432 276 Q 335 286 240 276 T 48 276 Z';
const EYELETS = [
  [62, 104],
  [418, 104],
  [62, 268],
  [418, 268],
];

function Defs() {
  return (
    <defs>
      <filter id="st-blur" x="-20%" y="-50%" width="140%" height="200%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <filter id="st-soft">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      {/* Cylinder light: darker at both edges, lit a little left of center */}
      <linearGradient id="st-cyl" x1="0" x2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.22" />
        <stop offset="0.14" stopColor="#000" stopOpacity="0.05" />
        <stop offset="0.36" stopColor="#000" stopOpacity="0" />
        <stop offset="0.64" stopColor="#000" stopOpacity="0.02" />
        <stop offset="0.86" stopColor="#000" stopOpacity="0.1" />
        <stop offset="1" stopColor="#000" stopOpacity="0.3" />
      </linearGradient>
      <linearGradient id="st-in-light" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#c9cfd9" />
        <stop offset="1" stopColor="#f1f3f6" />
      </linearGradient>
      <linearGradient id="st-in-dark" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#0d0e11" />
        <stop offset="1" stopColor="#2c2e35" />
      </linearGradient>
      <radialGradient id="st-cloth" cx="0.5" cy="0.42" r="0.62">
        <stop offset="0.55" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.14" />
      </radialGradient>
      <linearGradient id="st-crimp" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#f4f5f7" />
        <stop offset="1" stopColor="#aeb4bf" />
      </linearGradient>
      <radialGradient id="st-dome" cx="0.36" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
        <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.82" stopColor="#000" stopOpacity="0.05" />
        <stop offset="1" stopColor="#000" stopOpacity="0.2" />
      </radialGradient>
      <linearGradient id="st-wave" x1="0" x2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.07" />
        <stop offset="0.25" stopColor="#000" stopOpacity="0" />
        <stop offset="0.5" stopColor="#000" stopOpacity="0.06" />
        <stop offset="0.75" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.07" />
      </linearGradient>
      <clipPath id="st-clip-mug">
        <path d={MUG} />
      </clipPath>
      <clipPath id="st-clip-shirt">
        <path d={SHIRT} />
      </clipPath>
      <clipPath id="st-clip-pin">
        <circle cx="240" cy="180" r="124" />
      </clipPath>
      <clipPath id="st-clip-tarp">
        <path d={TARP} />
      </clipPath>
    </defs>
  );
}

function Mockup({ item, color, children }) {
  const { fill, edge, dark } = color;
  if (item.id === 'mug')
    return (
      <g>
        <ellipse cx="214" cy="318" rx="150" ry="13" className="mock__shadow" filter="url(#st-blur)" />
        <path d={MUG_HANDLE} fill="none" stroke={edge} strokeWidth="34" strokeLinecap="round" />
        <path d={MUG_HANDLE} fill="none" stroke={fill} strokeWidth="26" strokeLinecap="round" />
        <path d="M318 140 C 382 138 382 254 318 248" fill="none" stroke="#000" strokeOpacity={dark ? 0.35 : 0.09} strokeWidth="7" filter="url(#st-soft)" />
        <path d="M330 138 C 386 138 386 250 330 248" className="mock__shine-line" opacity={dark ? 0.2 : 0.7} />
        <path d={MUG} fill={fill} stroke={edge} strokeWidth="1.5" />
        <g clipPath="url(#st-clip-mug)">{children}</g>
        <path d={MUG} fill="url(#st-cyl)" />
        <rect x="126" y="104" width="16" height="184" rx="8" fill="#fff" opacity={dark ? 0.16 : 0.6} filter="url(#st-soft)" />
        <ellipse cx="212" cy="84" rx="112" ry="18" fill={dark ? '#35373e' : '#f3f5f8'} stroke={edge} strokeWidth="1.5" />
        <ellipse cx="212" cy="87" rx="101" ry="12.5" fill={`url(#st-in-${dark ? 'dark' : 'light'})`} />
      </g>
    );
  if (item.id === 'shirt')
    return (
      <g>
        <path d={SHIRT} transform="translate(3 8)" className="mock__shadow" filter="url(#st-blur)" />
        <path d={SHIRT} fill={fill} stroke={edge} strokeWidth="1.5" />
        <path d="M210 36 C 222 52 258 52 270 36 C 260 46 220 46 210 36 Z" fill={edge} opacity="0.55" />
        <path d="M208 34 C 220 56 260 56 272 34" fill="none" stroke={edge} strokeWidth="5" opacity="0.8" />
        <g clipPath="url(#st-clip-shirt)">{children}</g>
        <g className="mock__folds" filter="url(#st-soft)">
          <path d="M178 180 C 188 236 180 282 190 322" />
          <path d="M304 190 C 296 240 304 286 298 322" />
          <path d="M226 290 C 236 300 250 304 262 322" />
          <path d="M150 146 L 170 128 M330 146 L 310 128" />
        </g>
        <path d="M152 146 L 150 118 M328 146 L 330 118" className="mock__seam" stroke={edge} />
        <path d={SHIRT} fill="url(#st-cloth)" />
      </g>
    );
  if (item.id === 'pin')
    return (
      <g>
        <circle cx="246" cy="194" r="130" className="mock__shadow" filter="url(#st-blur)" />
        <circle cx="240" cy="180" r="132" fill="url(#st-crimp)" />
        <circle cx="240" cy="180" r="124" fill={fill} />
        <g clipPath="url(#st-clip-pin)">{children}</g>
        <circle cx="240" cy="180" r="124" fill="url(#st-dome)" />
        <path d="M152 124 A 112 112 0 0 1 236 70" className="mock__gloss" filter="url(#st-soft)" />
      </g>
    );
  return (
    <g>
      <path d="M62 104 L24 58 M418 104 L456 58 M62 268 L24 314 M418 268 L456 314" className="mock__rope" />
      <path d={TARP} transform="translate(4 9)" className="mock__shadow" filter="url(#st-blur)" />
      <path d={TARP} fill={fill} stroke={edge} strokeWidth="1.5" />
      <g clipPath="url(#st-clip-tarp)">{children}</g>
      <path d={TARP} fill="url(#st-wave)" />
      {EYELETS.map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="7" className="mock__eyelet" />
          <circle cx={cx} cy={cy} r="2.5" className="mock__eyelet-hole" />
        </g>
      ))}
    </g>
  );
}

// ------------------------------------------------------------------
export default function Studio() {
  const [main, setMain] = useState('BSIT 4-A');
  const [sub, setSub] = useState('Class of 2026');
  const [itemId, setItemId] = useState('mug');
  const [colorId, setColorId] = useState('white');
  const [ink, setInk] = useState('magenta');
  const [look, setLook] = useState('bold');
  const [logo, setLogo] = useState(null); // { src, name }
  const [logoError, setLogoError] = useState('');
  const [qty, setQty] = useState(12);
  const [example, setExample] = useState(0);
  const [stage, setStage] = useState('sketch'); // sketch → printing → printed
  const timer = useRef(null);
  const proof = useRef(null);

  const item = ITEMS.find((i) => i.id === itemId);
  const color = item.colors.find((c) => c.id === colorId) ?? item.colors[0];
  const inkInfo = INKS.find((i) => i.id === ink);
  const product = products.find((p) => p.id === item.productId);

  useEffect(() => () => clearTimeout(timer.current), []);

  const toSketch = () => {
    clearTimeout(timer.current);
    setStage('sketch');
  };
  // Any change to the design takes it back to a sketch.
  const change = (setter) => (value) => {
    setter(value);
    toSketch();
  };

  // White ink only prints on dark products; indigo barely shows on them.
  const fitInk = (nextColor, current) => {
    if (nextColor.dark && current === 'ink') return 'white';
    if (!nextColor.dark && current === 'white') return 'magenta';
    return current;
  };
  const pickItem = (id) => {
    const next = ITEMS.find((i) => i.id === id);
    const nextColor = next.colors.find((c) => c.id === colorId) ?? next.colors[0];
    setItemId(id);
    setColorId(nextColor.id);
    setInk((cur) => fitInk(nextColor, cur));
    toSketch();
  };
  const pickColor = (c) => {
    setColorId(c.id);
    setInk((cur) => fitInk(c, cur));
    toSketch();
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

  const tryExample = () => {
    const e = EXAMPLES[example % EXAMPLES.length];
    setExample((n) => n + 1);
    setMain(e.main);
    setSub(e.sub);
    setItemId(e.item);
    setColorId(e.color);
    setInk(e.ink);
    setLook(e.look);
    setQty(e.qty);
    print();
  };

  const onLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoError('Choose an image file, like a PNG or JPG.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('That image is over 3 MB. Choose a smaller one.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogo({ src: reader.result, name: file.name });
      setLogoError('');
      toSketch();
    };
    reader.readAsDataURL(file);
  };

  const words = [main.trim(), sub.trim()].filter(Boolean);
  const lookLabel = LOOKS.find((s) => s.id === look).label.toLowerCase();
  const note = `${words.length ? `Print "${words.join('" and "')}"` : 'Print my logo'}, in ${inkInfo.label.toLowerCase()} ink, ${lookLabel} lettering, on a ${color.label.toLowerCase()} ${item.label.toLowerCase()}.${logo ? ' I will attach my logo.' : ''} Designed on the website.`;
  const orderLink = `/login?next=${encodeURIComponent(`/app/shop/${item.productId}?qty=${qty}&design=${encodeURIComponent(note)}`)}`;
  const ready = /same day/i.test(product.leadTime) ? 'Ready the same day' : `Ready in ${product.leadTime}`;
  const art = { item, main: main.trim(), sub: sub.trim(), logo: logo?.src, look };
  const keyline = ink === 'yellow' && !color.dark && look !== 'outline';
  const status = {
    sketch: 'Sketch. This is still an idea.',
    printing: 'Printing: cyan, magenta, yellow, then your ink.',
    printed: `Printed on a ${color.label.toLowerCase()} ${item.label.toLowerCase()}.`,
  }[stage];

  return (
    <section id="studio" className="section studio" aria-labelledby="studio-title">
      <div className="container studio__grid">
        <div className="studio__copy" data-reveal>
          <h2 id="studio-title" className="h2">
            Try your idea on something real
          </h2>
          <p className="lede">
            Type your words or add a logo, pick what to print it on, and press print. We make the real one at the
            counter, usually in a day or two.
          </p>
        </div>

        <div className="studio__stage" data-reveal>
          <CropFrame
            as="figure"
            ref={proof}
            className={`studio__proof studio__proof--${item.id} is-${stage}`}
            style={{ '--print': inkInfo.color }}
          >
            <svg
              viewBox="0 0 480 360"
              role="img"
              aria-label={`Preview: ${words.join(', ') || 'your logo'} on a ${color.label.toLowerCase()} ${item.label.toLowerCase()}, ${
                stage === 'sketch' ? 'as a pencil sketch' : `printed in ${inkInfo.label.toLowerCase()} ink`
              }`}
            >
              <Defs />
              <Mockup item={item} color={color}>
                {stage === 'sketch' ? (
                  <g className={color.dark ? 'is-dark' : ''}>
                    <rect
                      className="art__area"
                      x={item.area.x - item.area.w / 2 - 10}
                      y={item.area.y - item.area.h / 2 - 8}
                      width={item.area.w + 20}
                      height={item.area.h + 16}
                      rx="6"
                    />
                    <Artwork {...art} sketch prefix="st-s" />
                  </g>
                ) : (
                  <g key={`${stage}-${itemId}-${colorId}-${ink}-${look}-${main}-${sub}-${logo?.name}`} className={keyline ? 'art-keyline' : ''}>
                    {stage === 'printing' &&
                      PLATES.map((p) => (
                        <g key={p} className={`plate-run plate-run--${p}`}>
                          <Artwork {...art} prefix={`st-${p}`} showLogo={false} />
                        </g>
                      ))}
                    <g className="plate-run plate-run--final">
                      <Artwork {...art} prefix="st-k" />
                    </g>
                  </g>
                )}
              </Mockup>
              {stage === 'printing' && <rect className="studio__sweep" x="-120" y="0" width="90" height="360" />}
            </svg>
            <figcaption className="studio__caption">
              <span className="hand">{stage === 'sketch' ? 'your idea, in pencil' : stage === 'printing' ? 'on the press…' : 'the real thing'}</span>
            </figcaption>
          </CropFrame>
          <p className="studio__status" role="status">
            {status}
          </p>
        </div>

        <form
          className="slip"
          data-reveal
          onSubmit={(e) => {
            e.preventDefault();
            print();
          }}
        >
          <div className="slip__words">
            <div className="field">
              <label htmlFor="studio-main">Big text</label>
              <input id="studio-main" className="input" maxLength={24} value={main} onChange={(e) => change(setMain)(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="studio-sub">Small text</label>
              <input id="studio-sub" className="input" maxLength={28} value={sub} onChange={(e) => change(setSub)(e.target.value)} />
            </div>
            <button type="button" className="slip__example" onClick={tryExample}>
              <Shuffle size={15} aria-hidden="true" /> Try an example
            </button>
          </div>

          <fieldset className="slip__group">
            <legend>Print it on</legend>
            <div className="slip__tiles">
              {ITEMS.map((i) => (
                <label key={i.id} className="slip__tile">
                  <input type="radio" name="studio-item" value={i.id} checked={itemId === i.id} onChange={() => pickItem(i.id)} />
                  <span>
                    <i.icon size={22} strokeWidth={1.7} aria-hidden="true" />
                    {i.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="slip__pair">
            <fieldset className="slip__group">
              <legend>
                Color <span className="slip__picked">{color.label}</span>
              </legend>
              <div className="slip__swatches">
                {item.colors.map((c) => (
                  <label key={c.id} className="slip__swatch" title={c.label}>
                    <input type="radio" name="studio-color" value={c.id} checked={color.id === c.id} onChange={() => pickColor(c)} />
                    <span style={{ background: c.fill }}>
                      <span className="sr-only">{c.label}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="slip__group">
              <legend>
                Ink <span className="slip__picked">{inkInfo.label}</span>
              </legend>
              <div className="slip__swatches">
                {INKS.map((i) => {
                  const off = i.id === 'white' && !color.dark;
                  return (
                    <label key={i.id} className={`slip__swatch ${off ? 'is-off' : ''}`} title={off ? 'White ink needs a dark product' : i.label}>
                      <input type="radio" name="studio-ink" value={i.id} checked={ink === i.id} disabled={off} onChange={() => change(setInk)(i.id)} />
                      <span style={{ background: i.color }}>
                        <span className="sr-only">
                          {i.label}
                          {off ? ', needs a dark product' : ''}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <fieldset className="slip__group">
            <legend>Lettering</legend>
            <div className="slip__looks">
              {LOOKS.map((s) => (
                <label key={s.id} className={`slip__look slip__look--${s.id}`}>
                  <input type="radio" name="studio-look" value={s.id} checked={look === s.id} onChange={() => change(setLook)(s.id)} />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="slip__pair">
            <div className="slip__group">
              <span className="slip__label">Logo or photo</span>
              {logo ? (
                <p className="slip__file">
                  <img src={logo.src} alt="" />
                  <span>{logo.name}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => {
                      setLogo(null);
                      toSketch();
                    }}
                    aria-label={`Remove ${logo.name}`}
                  >
                    <X size={16} />
                  </button>
                </p>
              ) : (
                <label className="btn btn--ghost btn--sm slip__upload">
                  <ImagePlus size={16} aria-hidden="true" /> Add an image
                  <input type="file" accept="image/*" onChange={onLogo} />
                </label>
              )}
              {logoError && (
                <p className="slip__error" role="alert">
                  {logoError}
                </p>
              )}
            </div>
            <div className="slip__group">
              <span className="slip__label">Quantity</span>
              <QuantityStepper value={qty} onChange={setQty} max={99} label={`How many ${item.unit[1]}`} />
            </div>
          </div>

          <div className="slip__foot">
            <p className="slip__estimate">
              <span className="slip__math num">
                {qty} {item.unit[qty === 1 ? 0 : 1]} × {formatPeso(product.price)}
              </span>
              <strong className="num">{formatPeso(qty * product.price)}</strong>
              <span className="slip__ready">Estimate. {ready}.</span>
            </p>
            <div className="slip__actions">
              <button type="submit" className="btn btn--primary" disabled={stage === 'printing'}>
                <Printer size={18} aria-hidden="true" />
                {stage === 'printed' ? 'Print again' : 'Print it'}
              </button>
              <Link to={orderLink} className={`btn ${stage === 'printed' ? 'btn--ink' : 'btn--ghost'}`}>
                Order this design
              </Link>
              {stage === 'printed' && (
                <button type="button" className="icon-btn slip__back" onClick={toSketch} aria-label="Back to sketch" title="Back to sketch">
                  <RotateCcw size={17} aria-hidden="true" />
                </button>
              )}
            </div>
            {logo && <p className="slip__note">Attach the same image again when you order. It stays on this page only.</p>}
          </div>
        </form>
      </div>
    </section>
  );
}
