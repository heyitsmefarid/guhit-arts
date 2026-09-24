import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Wand2 } from 'lucide-react';
import ProductImage from './ProductImage';
import { getCategory } from '../../data/products';
import { formatPeso } from '../../utils/format';

// Used on the public landing page (action = sign in) and in the shop (action = add to cart).
// `index` staggers the card's entrance; onAdd also receives the image so it can fly to the cart.
export default function ProductCard({ product, to, onAdd, publicMode = false, index = 0 }) {
  const category = getCategory(product.category);
  const ref = useRef(null);
  return (
    <article ref={ref} className="pcard" data-ink={category?.ink} style={{ '--i': Math.min(index, 12) }}>
      <Link to={to} className="pcard__media" tabIndex={-1} aria-hidden="true">
        <ProductImage product={product} />
        {product.customizable && (
          <span className="pcard__flag">
            <Wand2 size={13} aria-hidden="true" /> Customizable
          </span>
        )}
      </Link>
      <div className="pcard__body">
        <p className="pcard__cat">{category?.name}</p>
        <h3 className="pcard__name">
          <Link to={to}>{product.name}</Link>
        </h3>
        <div className="pcard__foot">
          <p className="pcard__price num">
            {product.customizable && <span className="pcard__from">from </span>}
            {formatPeso(product.price)}
          </p>
          {publicMode ? (
            <Link to={to} className="btn btn--ghost btn--sm">
              Sign in to shop
            </Link>
          ) : product.stock === 0 ? (
            <button type="button" className="btn btn--ghost btn--sm pcard__add" disabled>
              Out of stock
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--ink btn--sm pcard__add"
              onClick={() => onAdd(product, ref.current?.querySelector('.product-img'))}
              aria-label={product.customizable ? `Customize ${product.name}` : `Add ${product.name} to cart`}
            >
              {product.customizable ? (
                'Customize'
              ) : (
                <>
                  <Plus size={16} aria-hidden="true" /> Add
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
