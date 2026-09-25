// SVG filters shared by the landing page. "ink-rough" gives rubber stamps a
// slightly uneven edge and a few un-inked specks, like a real stamp on paper.
export default function InkFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <filter id="ink-rough" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="rough" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3 0 0 0 2.4" result="specks" />
        <feComposite in="rough" in2="specks" operator="in" />
      </filter>
    </svg>
  );
}
