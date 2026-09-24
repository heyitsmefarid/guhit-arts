import { useEffect, useMemo, useState } from 'react';
import { prefersReducedMotion } from '../../utils/motion';

const INKS = ['#009fe3', '#e4007c', '#ffd60a', '#1c2054'];

// A one-time burst of CMYK paper scraps for confirmation screens.
export default function Confetti({ count = 110 }) {
  const [visible, setVisible] = useState(() => !prefersReducedMotion());

  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * 100,
        delay: Math.random() * 0.4,
        dur: 2.1 + Math.random() * 1.7,
        rot: Math.round(Math.random() * 1000 - 500),
        drift: Math.round(Math.random() * 260 - 130),
        size: 7 + Math.random() * 9,
        color: INKS[i % INKS.length],
        shape: i % 3,
      })),
    [count]
  );

  useEffect(() => {
    if (!visible) return undefined;
    const t = setTimeout(() => setVisible(false), 4500);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`confetti__p confetti__p--${p.shape}`}
          style={{
            '--x': `${p.x}%`,
            '--delay': `${p.delay}s`,
            '--dur': `${p.dur}s`,
            '--rot': `${p.rot}deg`,
            '--drift': `${p.drift}px`,
            '--s': `${p.size}px`,
            '--c': p.color,
          }}
        />
      ))}
    </div>
  );
}
