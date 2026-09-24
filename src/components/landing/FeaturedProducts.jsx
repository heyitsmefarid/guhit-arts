import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../shop/ProductCard';
import { categories, products } from '../../data/products';

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
        <div className="product-grid" key={category} data-reveal>
          {shown.map((p, i) => (
            <ProductCard key={p.id} index={i} product={p} to={loginTo(`/app/shop/${p.id}`)} publicMode />
          ))}
        </div>
      </div>
    </section>
  );
}
