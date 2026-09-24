import { Check } from 'lucide-react';
import { STATUS_FLOW, statusLabel, statusDescription } from '../../data/statuses';
import { formatDateTime } from '../../utils/format';

// Visual tracker for Pending → Approved → In Progress → For Revision → Completed.
// `compact` renders a slim progress rail (with optional step labels); the default
// is the full vertical timeline with descriptions and timestamps.
export default function StatusTimeline({ item, compact = false, labels = false }) {
  const current = STATUS_FLOW.indexOf(item.status);
  const complete = item.status === 'completed';
  const reached = Object.fromEntries(item.history.map((h) => [h.status, h]));

  if (compact) {
    return (
      <div
        className={`rail ${labels ? 'rail--labeled' : ''}`}
        role="img"
        aria-label={`Step ${current + 1} of ${STATUS_FLOW.length}: ${statusLabel(item.status, item.kind)}`}
      >
        {STATUS_FLOW.map((s, i) => (
          <span
            key={s}
            className={`rail__step ${i < current || complete ? 'is-done' : ''} ${i === current && !complete ? 'is-current' : ''}`}
            style={{ '--i': i }}
          >
            <span className="rail__seg" />
            {labels && <span className="rail__label">{statusLabel(s, item.kind)}</span>}
          </span>
        ))}
      </div>
    );
  }

  return (
    <ol className="timeline" role="list">
      {STATUS_FLOW.map((s, i) => {
        const state = i < current || item.status === 'completed' ? 'done' : i === current ? 'current' : 'upcoming';
        const entry = reached[s];
        return (
          <li
            key={s}
            className={`timeline__step is-${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
            style={{ '--i': i }}
          >
            <span className="timeline__dot" aria-hidden="true">
              {state === 'done' ? <Check size={16} strokeWidth={3} /> : i + 1}
            </span>
            <div className="timeline__body">
              <p className="timeline__label">{statusLabel(s, item.kind)}</p>
              <p className="timeline__desc">{statusDescription(s, item.kind)}</p>
              {entry && <p className="timeline__time num">{formatDateTime(entry.at)}</p>}
              {entry?.note && <p className="timeline__note">{entry.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
