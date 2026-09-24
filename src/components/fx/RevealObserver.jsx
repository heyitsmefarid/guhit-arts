import { useEffect } from 'react';

// Marks [data-reveal] blocks with .is-in when they scroll into view. CSS in
// motion.css keeps every animation inside a block paused until then, so each
// section plays its entrance when the visitor actually reaches it.
export default function RevealObserver() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const root = document.documentElement;
    root.classList.add('reveal-ready');

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }),
      { rootMargin: '0px 0px -12% 0px' }
    );

    let frame = 0;
    const scan = () => {
      frame = 0;
      document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el));
    };
    scan();
    // New pages and re-rendered lists add blocks after mount; rescan once per frame.
    const mo = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(frame);
      root.classList.remove('reveal-ready');
    };
  }, []);

  return null;
}
