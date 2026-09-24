// Ranked horizontal bars for one measure. Values sit at the bar tips, so no
// axis is needed; the list itself is readable by screen readers.
export default function HBars({ rows, format = (v) => v, label }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="hbars" role="list" aria-label={label}>
      {rows.map((r, i) => (
        <li key={r.id} className="hbars__row" style={{ '--i': i }} title={`${r.label}: ${format(r.value)}`}>
          <span className="hbars__label">{r.label}</span>
          <span className="hbars__track" aria-hidden="true">
            <span className="hbars__bar" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="hbars__value num">{format(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}
