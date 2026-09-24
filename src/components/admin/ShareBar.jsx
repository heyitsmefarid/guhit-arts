// Part-to-whole as one horizontal stacked bar, with a legend that carries the
// numbers (so identity never depends on color alone).
//   parts: [{ id, label, value, color }]
export default function ShareBar({ parts, format = (v) => v, label }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const pct = (v) => (total ? Math.round((v / total) * 100) : 0);
  const shown = parts.filter((p) => p.value > 0);
  return (
    <div className="share">
      <div className="share__bar" role="img" aria-label={`${label}: ${parts.map((p) => `${p.label} ${pct(p.value)}%`).join(', ')}`}>
        {shown.map((p, i) => (
          <span
            key={p.id}
            className="share__seg"
            style={{ flexGrow: p.value, background: p.color, '--i': i }}
            title={`${p.label}: ${format(p.value)} (${pct(p.value)}%)`}
          />
        ))}
      </div>
      <ul className="share__legend" role="list">
        {parts.map((p) => (
          <li key={p.id}>
            <span className="legend__swatch" style={{ background: p.color }} aria-hidden="true" />
            <span className="share__label">{p.label}</span>
            <span className="share__value num">{format(p.value)}</span>
            <span className="share__pct num">{pct(p.value)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
