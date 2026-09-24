// Printer's registration mark: the target printed at the edge of every press sheet.
export default function RegMark({ size = 20, className = '', title }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
    >
      {title && <title>{title}</title>}
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 1.5v21M1.5 12h21" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
