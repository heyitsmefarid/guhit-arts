import { useState } from 'react';

const STEPS = 5;

// Weekday × time-of-day counts as a table of shaded cells (one hue, light to
// dark). The busiest cell is labeled; every other value shows on hover and is
// in the table for screen readers.
//   rows: [label], cols: [label], grid: number[rows][cols]
export default function Heatmap({ rows, cols, grid, caption, cellText, unit = 'orders or requests' }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...grid.flat());
  const peak = grid.flat().indexOf(max);
  const step = (v) => (v === 0 ? 0 : Math.max(1, Math.ceil((v / max) * STEPS)));

  return (
    <div className="heat">
      <table className="heat__table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <td />
            {cols.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r}>
              <th scope="row">
                <span className="heat__day-long">{r}</span>
                <span className="heat__day-short" aria-hidden="true">
                  {r.slice(0, 3)}
                </span>
              </th>
              {grid[ri].map((v, ci) => {
                const isPeak = ri * cols.length + ci === peak && v > 0;
                const active = hover && hover[0] === ri && hover[1] === ci;
                return (
                  <td
                    key={ci}
                    className={`heat__cell heat__cell--${step(v)} ${active ? 'is-active' : ''}`}
                    onMouseEnter={() => setHover([ri, ci])}
                    onMouseLeave={() => setHover(null)}
                  >
                    {isPeak ? <span className="heat__peak num">{v}</span> : <span className="sr-only">{v}</span>}
                    {active && (
                      <span className="heat__tip" role="presentation">
                        <strong>{cellText ? cellText(ri, ci) : `${r}, ${cols[ci]}`}</strong>
                        <span className="num">
                          {v ? `${v} ${unit}` : `No ${unit}`}
                        </span>
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="heat__legend" aria-hidden="true">
        Fewer
        {Array.from({ length: STEPS }, (_, i) => (
          <span key={i} className={`heat__swatch heat__cell--${i + 1}`} />
        ))}
        More
      </p>
    </div>
  );
}
