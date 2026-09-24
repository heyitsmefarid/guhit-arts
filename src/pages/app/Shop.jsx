import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, SearchX, X } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import ProductCard from '../../components/shop/ProductCard';
import EmptyState from '../../components/ui/EmptyState';
import { countByCategory, getCategories, getProducts } from '../../services/catalogService';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { flyToCart } from '../../utils/motion';

const SORTS = [
  { id: 'featured', label: 'Featured first' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'name', label: 'Name: A to Z' },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { toast } = useToast();
  const categories = getCategories();
  const counts = useMemo(() => countByCategory(), []);

  const category = params.get('category') ?? 'all';
  const sort = params.get('sort') ?? 'featured';
  const q = params.get('q') ?? '';
  const [search, setSearch] = useState(q);
  const [products, setProducts] = useState(null);

  useEffect(() => setSearch(q), [q]);

  useEffect(() => {
    let live = true;
    setProducts(null);
    getProducts({ search: q, category, sort }).then((list) => live && setProducts(list));
    return () => {
      live = false;
    };
  }, [q, category, sort]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v && v !== 'all' && !(k === 'sort' && v === 'featured') ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  // Typing filters as you go, after a short pause.
  useEffect(() => {
    if (search === q) return undefined;
    const t = setTimeout(() => update({ q: search.trim() }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const onAdd = (product, imageEl) => {
    if (product.customizable) {
      navigate(`/app/shop/${product.id}`);
      return;
    }
    flyToCart(imageEl);
    add(product, 1);
    toast(`${product.name} added to cart.`, { action: { label: 'View cart', onClick: () => navigate('/app/cart') } });
  };

  const activeName = category === 'all' ? 'All products' : categories.find((c) => c.id === category)?.name;

  return (
    <div className="page shop">
      <PageHeader
        title="Shop"
        description="Supplies and custom goods from the Leuterio shop. Order here, then pick up at the counter or have it delivered within Calapan."
      />

      <div className="shop__controls">
        <div className="input-wrap shop__search">
          <Search size={18} aria-hidden="true" />
          <input
            className="input"
            type="search"
            placeholder="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />
          {search && (
            <button type="button" className="icon-btn input-affix" onClick={() => setSearch('')} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>
        <label className="shop__sort">
          <span className="sr-only">Sort by</span>
          <select className="select" value={sort} onChange={(e) => update({ sort: e.target.value })}>
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="chip-row shop__cats" role="group" aria-label="Categories">
        <button type="button" className="chip" aria-pressed={category === 'all'} onClick={() => update({ category: 'all' })}>
          All <span className="chip__count num">{counts.all}</span>
        </button>
        {categories.map((c) => (
          <button key={c.id} type="button" className="chip" aria-pressed={category === c.id} onClick={() => update({ category: c.id })}>
            {c.name} <span className="chip__count num">{counts[c.id]}</span>
          </button>
        ))}
      </div>

      <p className="shop__result small muted" aria-live="polite">
        {products ? `${products.length} ${products.length === 1 ? 'item' : 'items'} in ${activeName}${q ? ` matching “${q}”` : ''}` : 'Loading products…'}
      </p>

      {products === null ? (
        <div className="product-grid" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="pcard pcard--skeleton">
              <div className="pcard__media" />
              <div className="pcard__body">
                <span className="sk sk--sm" />
                <span className="sk" />
                <span className="sk sk--md" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length ? (
        <div className="product-grid" key={`${category}-${sort}-${q}`}>
          {products.map((p, i) => (
            <ProductCard key={p.id} index={i} product={p} to={`/app/shop/${p.id}`} onAdd={onAdd} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SearchX}
          title={`No products match “${q}”`}
          body="Check the spelling, or try a broader word like “paper” or “ball.” Some items are only in store, so you can also message the shop."
          note="Can't find it? Ask us, we probably have it."
        >
          <button type="button" className="btn btn--ink" onClick={() => update({ q: '', category: 'all' })}>
            Clear search and filters
          </button>
        </EmptyState>
      )}
    </div>
  );
}
