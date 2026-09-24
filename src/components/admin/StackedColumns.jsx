import { useEffect, useRef, useState } from 'react';

const PAD = { top: 26, right: 8, bottom: 30, left: 56 };
const BAR_MAX = 24;
const GAP = 2; // surface gap between stacked segments

// Rounds the axis maximum up to a clean step whose half is also a clean number.
function niceMax(v) {
  if (v <= 0) return 10;
  const pow = 10 ** Math.floor(Math.log10(v));
  const step = [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10].find((s) => s * pow >= v);
  return step * pow;
}

// Segment with an optional 4px rounded top; the base stays square.
function segmentPath(x, y, w, h, roundTop) {
  const r = roundTop ? Math.min(4, h, w / 2) : 0;
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

// Stacked (or single-series) columns with a legend, hover tooltip, direct
// label on the peak, and a table for screen readers.
//   rows:   [{ label, tip, values: { [seriesKey]: number } }]
//   series: [{ key, label, color }]
export default function StackedColumns({ rows, series, format = (v) => v, tickFormat = format, height = 230, ariaLabel, labelEvery, integer = false }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(260, entry.contentRect.width)));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const totals = rows.map((r) => series.reduce((s, se) => s + (r.values[se.key] ?? 0), 0));
  // Counts get an even maximum so the middle tick is a whole number.
  const max = integer ? Math.max(2, Math.ceil(Math.max(...totals) / 2) * 2) : niceMax(Math.max(...totals));
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const band = innerW / rows.length;
  const barW = Math.min(BAR_MAX, Math.max(4, band - 4));
  const y = (v) => PAD.top + innerH - (v / max) * innerH;
  const peak = totals.reduce((best, t, i) => (t > totals[best] ? i : best), 0);
  const every = labelEvery ?? (band < 30 ? 4 : band < 48 ? 2 : 1);
  const showTick = (i) => i === rows.length - 1 || (rows.length - 1 - i) % every === 0;
  const multi = series.length > 1;

  return (
    <div className="chart" ref={wrapRef}>
      {multi && (
        <ul className="legend" role="list">
          {series.map((s) => (
            <li key={s.key}>
              <span className="legend__swatch" style={{ background: s.color }} aria-hidden="true" />
              {s.label}
              <span className="legend__value num">{format(rows.reduce((sum, r) => sum + (r.values[s.key] ?? 0), 0))}</span>
            </li>
          ))}
        </ul>
      )}
      <svg width={width} height={height} role="img" aria-label={ariaLabel} className="chart__svg">
        {[0, max / 2, max].map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="chart__grid" />
            <text x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="chart__tick">
              {tickFormat(t)}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const x = PAD.left + band * i + (band - barW) / 2;
          let base = 0;
          const visible = series.filter((s) => (r.values[s.key] ?? 0) > 0);
          return (
            <g key={i} className={hover !== null && hover !== i ? 'is-dim' : ''}>
              {visible.map((s, k) => {
                const v = r.values[s.key];
                const top = base + v;
                const segTop = y(top);
                const segH = y(base) - segTop - (k > 0 ? GAP : 0);
                base = top;
                if (segH <= 0) return null;
                return (
                  <path
                    key={s.key}
                    d={segmentPath(x, segTop, barW, segH, k === visible.length - 1)}
                    className="chart__seg"
                    style={{ '--i': i, fill: s.color }}
                  />
                );
              })}
              {showTick(i) && (
                <text x={x + barW / 2} y={height - 8} textAnchor="middle" className={`chart__tick ${i === rows.length - 1 ? 'chart__tick--strong' : ''}`}>
                  {r.label}
                </text>
              )}
              <rect
                x={PAD.left + band * i}
                y={PAD.top}
                width={band}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}
        {totals[peak] > 0 && (
          <text x={PAD.left + band * peak + band / 2} y={y(totals[peak]) - 8} textAnchor="middle" className="chart__value">
            {format(totals[peak])}
          </text>
        )}
      </svg>
      {hover !== null && (
        <div
          className="chart__tip"
          style={{
            left: Math.min(width - 180, Math.max(0, PAD.left + band * hover + band / 2 - 90)),
            top: Math.max(multi ? 34 : 0, y(totals[hover]) - (multi ? 30 : 70)),
          }}
        >
          <p className="chart__tip-date">{rows[hover].tip ?? rows[hover].label}</p>
          <p className="chart__tip-value num">{format(totals[hover])}</p>
          {multi &&
            series.map((s) => (
              <p key={s.key} className="chart__tip-row">
                <span className="legend__swatch" style={{ background: s.color }} aria-hidden="true" />
                {s.label}
                <span className="num">{format(rows[hover].values[s.key] ?? 0)}</span>
              </p>
            ))}
          {rows[hover].meta && <p className="chart__tip-meta">{rows[hover].meta}</p>}
        </div>
      )}
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            {series.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
            {multi && <th scope="col">Total</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <th scope="row">{r.tip ?? r.label}</th>
              {series.map((s) => (
                <td key={s.key}>{format(r.values[s.key] ?? 0)}</td>
              ))}
              {multi && <td>{format(totals[i])}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
