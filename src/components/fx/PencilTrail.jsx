import { useEffect, useRef } from 'react';
import { hasFinePointer, prefersReducedMotion } from '../../utils/motion';

const LIFE = 1200; // ms a stroke stays on the page
// Three process plates slightly off-register, then the ink line on top.
const PLATES = [
  { rgb: '0,159,227', dx: -2.5, dy: 2, alpha: 0.55 },
  { rgb: '228,0,124', dx: 2.5, dy: 3, alpha: 0.5 },
  { rgb: '255,214,10', dx: 3.5, dy: -1.5, alpha: 0.7 },
  { rgb: '28,32,84', dx: 0, dy: 0, alpha: 0.9 },
];

// Lets visitors doodle on the hero with the cursor. The line fades after a moment.
// Mouse and pen only; nothing runs on touch screens or with reduced motion.
export default function PencilTrail({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host || !hasFinePointer() || prefersReducedMotion()) return undefined;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let points = [];
    let raf = 0;

    const resize = () => {
      const r = host.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now) => {
      ctx.clearRect(0, 0, w, h);
      points = points.filter((p) => now - p.t < LIFE);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const plate of PLATES) {
        for (let i = 1; i < points.length; i++) {
          const a = points[i - 1];
          const b = points[i];
          if (b.t - a.t > 120) continue; // a new stroke, don't join to the last one
          const life = 1 - (now - b.t) / LIFE;
          ctx.strokeStyle = `rgba(${plate.rgb},${plate.alpha * life})`;
          ctx.lineWidth = 0.6 + 3.2 * life;
          ctx.beginPath();
          ctx.moveTo(a.x + plate.dx, a.y + plate.dy);
          ctx.lineTo(b.x + plate.dx, b.y + plate.dy);
          ctx.stroke();
        }
      }
      raf = points.length ? requestAnimationFrame(draw) : 0;
    };

    const onMove = (e) => {
      if (e.pointerType === 'touch') return;
      const r = canvas.getBoundingClientRect();
      const events = e.getCoalescedEvents?.() ?? [e];
      for (const ev of events) points.push({ x: ev.clientX - r.left, y: ev.clientY - r.top, t: performance.now() });
      if (!raf) raf = requestAnimationFrame(draw);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    host.addEventListener('pointermove', onMove);
    return () => {
      host.removeEventListener('pointermove', onMove);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className={`trail ${className}`} aria-hidden="true" />;
}
