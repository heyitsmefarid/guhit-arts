import CountUp from '../fx/CountUp';
import Delta from './Delta';

// A summary figure for a report: value, label, change, and the previous value.
//   format: turns a number into display text (pesos, %, days); CountUp is used
//   for whole counts and pesos so the tiles animate in like the dashboard.
export default function ReportKpi({ label, value, prev, format, peso, ink = 'ink', goodWhen, against, hint }) {
  // No `against` means the period has nothing before it to compare with.
  const hasPrev = prev !== undefined && against !== null;
  return (
    <div className="stat stat--report" data-ink={ink}>
      <span className="stat__value num">
        {format ? (
          format(value)
        ) : (
          <>
            {peso && '₱'}
            <CountUp to={value} duration={900} />
          </>
        )}
      </span>
      <span className="stat__label">{label}</span>
      <span className="stat__hint">
        {hasPrev && <Delta cur={value} prev={prev} goodWhen={goodWhen} against={against} />}
        {hint && <span className="stat__was">{hint}</span>}
        {hasPrev && !hint && prev !== null && prev !== 0 && (
          <span className="stat__was">
            Was {format ? format(prev) : `${peso ? '₱' : ''}${Math.round(prev).toLocaleString('en-PH')}`}
          </span>
        )}
      </span>
    </div>
  );
}
