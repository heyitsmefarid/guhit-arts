import { statusLabel } from '../../data/statuses';

export default function StatusBadge({ status, kind = 'order' }) {
  return <span className={`badge badge--${status}`}>{statusLabel(status, kind)}</span>;
}
