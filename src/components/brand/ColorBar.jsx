// A press color-control strip: solids, tints, and overprints, as printed along
// the trim edge of a sheet. Used as a divider between major bands of the page.
const SWATCHES = [
  '#009fe3', '#e4007c', '#ffd60a', '#1c2054',
  '#7fcff1', '#f27fbd', '#ffeb85', '#8d90aa',
  '#2a3a9c', '#e5332a', '#00a651', '#1c2054',
];

export default function ColorBar({ className = '' }) {
  return (
    <div className={`colorbar ${className}`} aria-hidden="true">
      {Array.from({ length: 4 }).flatMap((_, r) =>
        SWATCHES.map((c, i) => <span key={`${r}-${i}`} style={{ background: c }} />)
      )}
    </div>
  );
}
