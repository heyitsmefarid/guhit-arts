import { useEffect, useState } from 'react';
import { ArrowUpRight, Send } from 'lucide-react';
import { STATUS_FLOW, nextStatus, statusLabel } from '../../data/statuses';
import { NEXT_ACTION } from '../../utils/admin';

// Staff controls for moving an order or project along. The main button takes
// the usual next step; "Set status" allows any step, e.g. back to For Revision.
// The optional note goes to the customer with the notification.
export default function StatusControl({ item, onUpdate, disabledReason = '', extraActions = null }) {
  const [note, setNote] = useState('');
  const [manual, setManual] = useState(item.status);
  const [busy, setBusy] = useState(false);
  const next = nextStatus(item.status);

  useEffect(() => setManual(item.status), [item.status]);

  const run = async (status) => {
    setBusy(true);
    try {
      await onUpdate(status, note.trim());
      setNote('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel status-control" aria-labelledby="sc-h">
      <h2 id="sc-h" className="h3 panel__title">
        Update status
      </h2>
      <div className="field">
        <label htmlFor="sc-note">
          Note to customer <span className="muted">(optional)</span>
        </label>
        <textarea
          id="sc-note"
          className="textarea"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Example: Ready for pickup after 2 PM. Please bring your reference number."
        />
        <p className="hint">The customer gets this with a notification, and it shows on their tracking page.</p>
      </div>

      {next ? (
        <>
          <button type="button" className="btn btn--primary btn--lg btn--block" onClick={() => run(next)} disabled={busy || !!disabledReason}>
            {busy ? <span className="spinner" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
            {NEXT_ACTION[item.kind][item.status]}
          </button>
          <p className="hint status-control__to">
            Moves it to {statusLabel(next, item.kind)} and notifies {item.customer?.name ?? 'the customer'}.
          </p>
        </>
      ) : (
        <p className="alert alert--success">This {item.kind === 'order' ? 'order' : 'request'} is completed.</p>
      )}
      {disabledReason && <p className="hint hint--warn">{disabledReason}</p>}
      {extraActions}

      <div className="status-control__manual">
        <label htmlFor="sc-status" className="small">
          Or set any status
        </label>
        <div className="status-control__row">
          <select id="sc-status" className="select" value={manual} onChange={(e) => setManual(e.target.value)}>
            {STATUS_FLOW.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s, item.kind)}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn--ghost" onClick={() => run(manual)} disabled={busy || manual === item.status}>
            <ArrowUpRight size={16} aria-hidden="true" /> Set
          </button>
        </div>
      </div>
    </section>
  );
}
