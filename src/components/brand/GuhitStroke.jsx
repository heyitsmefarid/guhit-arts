// "Guhit" means line. This hand-drawn stroke draws itself in pencil, then the
// cyan, magenta, and yellow plates land slightly off-register, like a print.
// It is the one orchestrated motion on the landing page.
const PATH =
  'M6 40 C 58 22, 112 50, 172 36 S 280 12, 338 30 S 430 58, 492 36 S 560 14, 596 26';

export default function GuhitStroke({ className = '' }) {
  return (
    <svg className={`guhit ${className}`} viewBox="0 0 600 64" fill="none" aria-hidden="true" preserveAspectRatio="none">
      <path className="guhit__plate guhit__plate--c" d={PATH} pathLength="1" />
      <path className="guhit__plate guhit__plate--m" d={PATH} pathLength="1" />
      <path className="guhit__plate guhit__plate--y" d={PATH} pathLength="1" />
      <path className="guhit__pencil" d={PATH} pathLength="1" />
    </svg>
  );
}
