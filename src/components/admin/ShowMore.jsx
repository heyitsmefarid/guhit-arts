import { useState } from 'react';

// Long admin lists render `size` rows at a time. Changing `resetKey` (the
// current filters) starts again from the first page.
export function usePaged(list, resetKey, size = 50) {
  const [state, setState] = useState({ key: resetKey, count: size });
  const count = state.key === resetKey ? state.count : size;
  return {
    visible: list.slice(0, count),
    remaining: Math.max(0, list.length - count),
    total: list.length,
    showMore: () => setState({ key: resetKey, count: count + size }),
  };
}

export default function ShowMore({ paged, noun, size = 50 }) {
  if (!paged.remaining) return null;
  return (
    <div className="show-more">
      <p className="small muted">
        Showing {paged.visible.length} of {paged.total} {noun}
      </p>
      <button type="button" className="btn btn--ghost" onClick={paged.showMore}>
        Show {Math.min(size, paged.remaining)} more
      </button>
    </div>
  );
}
