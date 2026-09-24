import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { change, pct } from '../../utils/reports';

// Change against the previous period, with an arrow and words so it never
// depends on color. `goodWhen="down"` is for times and counts where less is better.
export default function Delta({ cur, prev, goodWhen = 'up', against }) {
  if (prev === null || prev === undefined) return <span className="delta delta--none">No earlier data</span>;
  if (prev === 0) {
    if (!cur) return <span className="delta delta--flat">No change</span>;
    return (
      <span className={`delta delta--${goodWhen === 'up' ? 'good' : 'bad'}`}>
        <ArrowUpRight size={15} aria-hidden="true" />
        Up from 0
      </span>
    );
  }
  const c = change(cur, prev);
  const flat = Math.abs(c) < 0.005;
  const up = c > 0;
  const tone = flat ? 'flat' : up === (goodWhen === 'up') ? 'good' : 'bad';
  const Icon = flat ? ArrowRight : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`delta delta--${tone}`} title={against ? `Compared with ${against}` : undefined}>
      <Icon size={15} aria-hidden="true" />
      {flat ? 'No change' : `${pct(Math.abs(c))} ${up ? 'up' : 'down'}`}
    </span>
  );
}
