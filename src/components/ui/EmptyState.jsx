// Empty screens say what to do next, with a sketched note in the shop's hand.
export default function EmptyState({ icon: Icon, title, body, children, note }) {
  return (
    <div className="empty">
      {Icon && (
        <span className="empty__icon" aria-hidden="true">
          <Icon size={28} strokeWidth={1.5} />
        </span>
      )}
      <h2 className="h3">{title}</h2>
      {body && <p className="muted">{body}</p>}
      {children && <div className="empty__actions">{children}</div>}
      {note && <p className="empty__note hand">{note}</p>}
    </div>
  );
}
