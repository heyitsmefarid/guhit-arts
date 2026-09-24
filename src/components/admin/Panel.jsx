// A titled card on the admin dashboard and reports.
export default function Panel({ id, title, sub, link, className = '', children }) {
  return (
    <section className={`panel ${className}`} aria-labelledby={id}>
      <div className="panel__head">
        <div>
          <h2 id={id} className="h3">
            {title}
          </h2>
          {sub && <p className="small muted">{sub}</p>}
        </div>
        {link}
      </div>
      {children}
    </section>
  );
}
