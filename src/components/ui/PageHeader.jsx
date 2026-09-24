export default function PageHeader({ title, description, actions, children }) {
  return (
    <header className="page-head">
      <div className="page-head__text">
        <h1 className="h1">{title}</h1>
        {description && <p className="page-head__desc">{description}</p>}
        {children}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </header>
  );
}
