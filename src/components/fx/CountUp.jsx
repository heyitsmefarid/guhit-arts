import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../utils/motion';

// Counts from the last shown value up to `to` once the number is on screen.
// Screen readers get the final value only.
export default function CountUp({ to, duration = 1100 }) {
  const ref = useRef(null);
  const shown = useRef(prefersReducedMotion() ? to : 0);
  const [value, setValue] = useState(shown.current);

  useEffect(() => {
    if (prefersReducedMotion()) {
      shown.current = to;
      setValue(to);
      return undefined;
    }
    let raf = 0;
    const run = () => {
      const from = shown.current;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const v = Math.round(from + (to - from) * (1 - (1 - p) ** 3));
        shown.current = v;
        setValue(v);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        io.disconnect();
        run();
      }
    });
    io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  return (
    <span ref={ref}>
      <span aria-hidden="true">{value.toLocaleString('en-PH')}</span>
      <span className="sr-only">{to}</span>
    </span>
  );
}
