// Tiny trend line for a stat tile: 2px line, soft wash, end dot with a surface ring.
export default function Sparkline({ values, width = 112, height = 34, label }) {
  if (!values?.length) return null;
  const max = Math.max(1, ...values);
  const pad = 5;
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const pts = values.map((v, i) => [pad + i * step, height - pad - (v / max) * (height - pad * 2)]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${height - pad} L${pad},${height - pad} Z`;
  const [ex, ey] = pts[pts.length - 1];
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <path d={area} className="spark__area" />
      <path d={line} className="spark__line" />
      <circle cx={ex} cy={ey} r="4" className="spark__dot" />
    </svg>
  );
}
