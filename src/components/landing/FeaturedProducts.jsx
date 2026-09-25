import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../shop/ProductCard';
import { categories, products } from '../../data/products';
import { prefersReducedMotion } from '../../utils/motion';

// Cards lean toward the mouse, with a glare where the light would catch.
function tilt(e) {
  const card = e.target.closest?.('.pcard');
  if (!card || e.pointerType !== 'mouse' || prefersReducedMotion()) return;
  const r = card.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width;
  const py = (e.clientY - r.top) / r.height;
  card.style.setProperty('--ry', `${((px - 0.5) * 10).toFixed(2)}deg`);
  card.style.setProperty('--rx', `${((0.5 - py) * 8).toFixed(2)}deg`);
  card.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
  card.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
}
function untilt(e) {
  const card = e.target.closest?.('.pcard');
  if (!card || card.contains(e.relatedTarget)) return;
  card.style.setProperty('--rx', '0deg');
  card.style.setProperty('--ry', '0deg');
}

export default function FeaturedProducts() {
  const [category, setCategory] = useState('featured');

  const shown = useMemo(() => {
    const list = category === 'featured' ? products.filter((p) => p.featured) : products.filter((p) => p.category === category);
    return list.slice(0, 8);
  }, [category]);

  const loginTo = (path) => `/login?next=${encodeURIComponent(path)}`;

  return (
    <section id="products" className="section products" aria-labelledby="products-title">
      <div className="container">
        <header className="section-head section-head--row" data-reveal>
          <div>
            <h2 id="products-title" className="h2">
              Featured Products
            </h2>
            <p className="lede">
              School and art supplies, printing materials, sporting goods, and custom items, at counter prices. Sign
              in to order online and pick up at the shop.
            </p>
          </div>
          <Link to={loginTo('/app/shop')} className="btn btn--ghost">
            See all {products.length} products
          </Link>
        </header>

        <div className="chip-row" role="group" aria-label="Filter products">
          <button type="button" className="chip" aria-pressed={category === 'featured'} onClick={() => setCategory('featured')}>
            Featured
          </button>
          {categories.map((c) => (
            <button key={c.id} type="button" className="chip" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Keyed by category so the cards deal in again when the filter changes. */}
        <div className="product-grid" key={category} data-reveal onPointerMove={tilt} onPointerOut={untilt}>
          {shown.map((p, i) => (
            <ProductCard key={p.id} index={i} product={p} to={loginTo(`/app/shop/${p.id}`)} publicMode />
          ))}
        </div>
      </div>
    </section>
  );
}
