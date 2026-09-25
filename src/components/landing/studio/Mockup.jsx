// Product drawings for the design studio. `children` is the printed design:
// it is drawn on the surface and then shaded with the product, so the ink
// sits in it. `overlay` (the ink roller) is drawn on top, moving with the
// product. Each product has a small idle motion: the shirt sways on its
// hanger, the pin floats, and the tarpaulin flutters.
const MUG = 'M100 84 V296 A112 18 0 0 0 324 296 V84 Z';
const SHIRT =
  'M168 46 C 188 40 200 36 208 34 C 220 54 260 54 272 34 C 280 36 292 40 312 46 L 384 86 C 391 90 393 97 389 103 L 361 150 C 357 157 350 158 344 155 L 328 146 L 330 316 C 330 322 326 326 320 326 L 160 326 C 154 326 150 322 150 316 L 152 146 L 136 155 C 130 158 123 157 119 150 L 91 103 C 87 97 89 90 96 86 Z';
const TARP = 'M48 96 Q 145 86 240 96 T 432 96 L 432 276 Q 335 286 240 276 T 48 276 Z';
const EYELETS = [
  [62, 104],
  [418, 104],
  [62, 268],
  [418, 268],
];

export function Defs() {
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
      <linearGradient id="st-drum" x1="0" x2="1">
        <stop offset="0" stopColor="#000" stopOpacity="0.28" />
        <stop offset="0.35" stopColor="#000" stopOpacity="0" />
        <stop offset="0.55" stopColor="#fff" stopOpacity="0.35" />
        <stop offset="1" stopColor="#000" stopOpacity="0.3" />
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

// The mug handle as seen when the mug is turned by `rot` radians: a loop
// sticking out of the side at angle 90° + rot, flattened by perspective.
function handlePath(rot, inset = 0, reach = 80) {
  const s = Math.sin(Math.PI / 2 + rot);
  const x = (d) => (212 + (112 + d) * s).toFixed(1);
  return `M${x(-2 + inset)} ${124 + inset} C ${x(reach)} ${120 + inset} ${x(reach)} ${270 - inset} ${x(-2 + inset)} ${262 - inset}`;
}

function MugHandle({ rot, fill, edge, dark }) {
  return (
    <g>
      <path d={handlePath(rot)} fill="none" stroke={edge} strokeWidth="34" strokeLinecap="round" />
      <path d={handlePath(rot)} fill="none" stroke={fill} strokeWidth="26" strokeLinecap="round" />
      <path d={handlePath(rot, 14, 62)} className="mock__shine-line" opacity={dark ? 0.2 : 0.7} />
    </g>
  );
}

export default function Mockup({ item, color, rot = 0, children, overlay }) {
  const { fill, edge, dark } = color;
  if (item.id === 'mug') {
    // Behind the body once the handle turns past the side.
    const handleInFront = Math.cos(Math.PI / 2 + rot) > 0.02;
    return (
      <g>
        <ellipse cx="214" cy="318" rx="150" ry="13" className="mock__shadow" filter="url(#st-blur)" />
        {!handleInFront && <MugHandle rot={rot} fill={fill} edge={edge} dark={dark} />}
        <path d={MUG} fill={fill} stroke={edge} strokeWidth="1.5" />
        <g clipPath="url(#st-clip-mug)">{children}</g>
        <path d={MUG} fill="url(#st-cyl)" />
        <rect x="126" y="104" width="16" height="184" rx="8" fill="#fff" opacity={dark ? 0.16 : 0.6} filter="url(#st-soft)" />
        <ellipse cx="212" cy="84" rx="112" ry="18" fill={dark ? '#35373e' : '#f3f5f8'} stroke={edge} strokeWidth="1.5" />
        <ellipse cx="212" cy="87" rx="101" ry="12.5" fill={`url(#st-in-${dark ? 'dark' : 'light'})`} />
        {handleInFront && <MugHandle rot={rot} fill={fill} edge={edge} dark={dark} />}
        {overlay}
      </g>
    );
  }
  if (item.id === 'shirt')
    return (
      <g className="mock-sway">
        <path d="M240 34 L240 20 C240 8 254 6 256 16" className="mock__hook" />
        <path d="M170 50 L240 30 L310 50" className="mock__hanger" />
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
        {overlay}
      </g>
    );
  if (item.id === 'pin')
    return (
      <g>
        <ellipse cx="244" cy="330" rx="104" ry="10" className="mock__shadow mock-float-shadow" filter="url(#st-blur)" />
        <g className="mock-float">
          <circle cx="240" cy="180" r="132" fill="url(#st-crimp)" />
          <circle cx="240" cy="180" r="124" fill={fill} />
          <g clipPath="url(#st-clip-pin)">{children}</g>
          <circle cx="240" cy="180" r="124" fill="url(#st-dome)" />
          <path d="M152 124 A 112 112 0 0 1 236 70" className="mock__gloss" filter="url(#st-soft)" />
          {overlay}
        </g>
      </g>
    );
  return (
    <g className="mock-flutter">
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
      {overlay}
    </g>
  );
}

// An ink roller that rolls across the print area, laying the ink down behind it.
export function Roller({ area }) {
  const x0 = area.x - area.w / 2 - 34;
  const x1 = area.x + area.w / 2 + 34;
  const top = area.y - area.h / 2 - 20;
  const h = area.h + 40;
  return (
    <g className="roller" style={{ '--from': `${x0}px`, '--to': `${x1}px` }}>
      <path className="roller__frame" d={`M0 ${top - 4} L0 ${top - 26} L40 ${top - 50}`} />
      <path className="roller__grip" d={`M36 ${top - 47} L70 ${top - 68}`} />
      <rect className="roller__drum" x="-15" y={top} width="30" height={h} rx="14" />
      <rect x="-15" y={top} width="30" height={h} rx="14" fill="url(#st-drum)" />
    </g>
  );
}

// The strip of print the roller has covered so far.
export function RevealClip({ area }) {
  const x0 = area.x - area.w / 2 - 34;
  const x1 = area.x + area.w / 2 + 34;
  return (
    <clipPath id="st-reveal">
      <rect className="reveal-rect" x={x0} y="0" width={x1 - x0} height="360" />
    </clipPath>
  );
}
