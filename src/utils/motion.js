// Motion helpers. Every effect checks the user's reduced-motion preference first.

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

// Flies a copy of a product image into the cart button, then bumps the button.
export function flyToCart(sourceEl) {
  const target = document.querySelector('[data-cart-target]');
  if (!sourceEl || !target || prefersReducedMotion()) return;

  const s = sourceEl.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  if (!s.width || !t.width) return;

  const clone = sourceEl.cloneNode(true);
  Object.assign(clone.style, {
    position: 'fixed',
    left: `${s.left}px`,
    top: `${s.top}px`,
    width: `${s.width}px`,
    height: `${s.height}px`,
    margin: '0',
    zIndex: '95',
    pointerEvents: 'none',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 20px 40px -12px rgba(28,32,84,.45)',
  });
  clone.setAttribute('aria-hidden', 'true');
  document.body.appendChild(clone);

  const dx = t.left + t.width / 2 - (s.left + s.width / 2);
  const dy = t.top + t.height / 2 - (s.top + s.height / 2);
  const flight = clone.animate(
    [
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 90}px) scale(0.5) rotate(-10deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.06) rotate(14deg)`, opacity: 0.4 },
    ],
    { duration: 780, easing: 'cubic-bezier(0.55, 0, 0.3, 1)' }
  );
  flight.onfinish = () => {
    clone.remove();
    target.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.3) rotate(-8deg)' }, { transform: 'scale(1)' }],
      { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
    );
  };
}
