// The printed design: words and an optional logo laid out inside a product's
// print area. On the mug each letter sits on a cylinder, so the print curves,
// narrows toward the edges, and turns with the mug.

// Long big text breaks onto two lines at the space nearest the middle.
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

// ------------------------------------------------------------------
// Letter widths, measured once per font and letter
// ------------------------------------------------------------------
const FONTS = {
  bold: (s) => ({ font: `850 ${s}px Archivo`, stretch: 'expanded', spacing: -0.01 }),
  sub: (s) => ({ font: `650 ${s}px Archivo`, stretch: 'normal', spacing: 0.02 }),
  hand: (s) => ({ font: `700 ${s}px Kalam`, stretch: 'normal', spacing: 0 }),
};
let ctx = null;
const cache = new Map();
export const resetLetterWidths = () => cache.clear();

function letterWidths(text, { font, stretch }) {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  ctx.font = font;
  if ('fontStretch' in ctx) ctx.fontStretch = stretch;
  return [...text].map((ch) => {
    const key = `${font}|${stretch}|${ch}`;
    if (!cache.has(key)) cache.set(key, ctx.measureText(ch).width);
    return cache.get(key);
  });
}

// One line of text on a cylinder turned by `rot` radians. Letters facing
// away are dropped; letters near the edges narrow and fade.
function CylinderLine({ text, y, size, spec, cls, rot, wrap }) {
  const widths = letterWidths(text, spec).map((w) => w + spec.spacing * size);
  let s = -widths.reduce((a, b) => a + b, 0) / 2;
  return [...text].map((ch, i) => {
    const mid = s + widths[i] / 2;
    s += widths[i];
    if (ch === ' ') return null;
    const theta = mid / wrap.r + rot;
    const c = Math.cos(theta);
    if (c <= 0.03) return null;
    const x = wrap.cx + wrap.r * Math.sin(theta);
    return (
      <text
        key={i}
        className={cls}
        fontSize={size}
        textAnchor="middle"
        transform={`translate(${x.toFixed(2)} ${(y + wrap.k * c).toFixed(2)}) scale(${c.toFixed(3)} 1)`}
        opacity={Math.min(1, c * 1.8).toFixed(2)}
      >
        {ch}
      </text>
    );
  });
}

export default function Artwork({ item, main, sub, logo, look, sketch, rot = 0, showLogo = true }) {
  const hand = sketch || look === 'hand';
  const L = layout(item.area, { main, sub, logo, hand });
  const mainSpec = hand ? FONTS.hand(L.size) : FONTS.bold(L.size);
  const subSpec = L.sub && (hand ? FONTS.hand(L.sub.size) : FONTS.sub(L.sub.size));
  const { wrap } = item;

  const line = (text, y, size, spec, cls, key) =>
    wrap ? (
      <g key={key}>
        <CylinderLine text={text} y={y} size={size} spec={spec} cls={cls} rot={rot} wrap={wrap} />
      </g>
    ) : (
      <text key={key} x={item.area.x} y={y} fontSize={size} className={cls} textAnchor="middle">
        {text}
      </text>
    );

  let logoEl = null;
  if (showLogo && L.logo) {
    const img = (
      <image href={logo} x={L.logo.x} y={L.logo.y} width={L.logo.size} height={L.logo.size} preserveAspectRatio="xMidYMid meet" className="art__logo" />
    );
    if (!wrap) logoEl = img;
    else {
      const c = Math.cos(rot);
      if (c > 0.05) {
        const x = wrap.cx + wrap.r * Math.sin(rot);
        logoEl = <g transform={`translate(${x.toFixed(2)} ${(wrap.k * (c - 1)).toFixed(2)}) scale(${c.toFixed(3)} 1) translate(${-wrap.cx} 0)`}>{img}</g>;
      }
    }
  }

  return (
    <g className={`art ${sketch ? 'art--sketch' : `art--${look}`}`}>
      {logoEl}
      {L.lines.map((l, i) => line(l.text, l.y, L.size, mainSpec, 'art__main', i))}
      {L.sub && line(L.sub.text, L.sub.y, L.sub.size, subSpec, 'art__sub', 'sub')}
    </g>
  );
}
