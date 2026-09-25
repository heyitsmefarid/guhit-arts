import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Clock, PackageCheck, PackageX, Store, Wand2 } from 'lucide-react';
import { LOW_STOCK_AT } from '../../data/inventory';
import CropFrame from '../../components/brand/CropFrame';
import ProductImage from '../../components/shop/ProductImage';
import ProductCard from '../../components/shop/ProductCard';
import QuantityStepper from '../../components/ui/QuantityStepper';
import FileDrop from '../../components/ui/FileDrop';
import EmptyState from '../../components/ui/EmptyState';
import { getProduct } from '../../services/catalogService';
import { getCategory } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatPeso } from '../../utils/format';
import { flyToCart } from '../../utils/motion';

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [params] = useSearchParams();
  // A design tried on the landing page arrives as ?design= (the note) and ?qty=.
  const design = params.get('design') ?? '';
  const startQty = Math.min(99, Math.max(1, parseInt(params.get('qty'), 10) || 1));
  const [qty, setQty] = useState(startQty);
  const [note, setNote] = useState(design);
  const [files, setFiles] = useState([]);
  const [noteError, setNoteError] = useState('');

  useEffect(() => {
    let live = true;
    setData(null);
    setError('');
    setQty(startQty);
    setNote(design);
    setFiles([]);
    getProduct(productId)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [productId, design, startQty]);

  if (error) {
    return (
      <div className="page">
        <EmptyState icon={Store} title="Product not found" body={error}>
          <Link to="/app/shop" className="btn btn--ink">
            Back to the shop
          </Link>
        </EmptyState>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <div className="pdp pdp--loading" aria-busy="true">
          <div className="pdp__media sk-block" />
          <div className="pdp__info">
            <span className="sk sk--sm" />
            <span className="sk sk--lg" />
            <span className="sk sk--md" />
          </div>
        </div>
      </div>
    );
  }

  const { product, related } = data;
  const category = getCategory(product.category);

  const addToCart = (goToCart = false) => {
    if (product.customizable && !note.trim() && files.length === 0) {
      setNoteError('Describe your design or attach a file so we know what to print.');
      return;
    }
    setNoteError('');
    const fileNote = files.length ? ` (Files: ${files.map((f) => f.name).join(', ')})` : '';
    add(product, qty, { note: product.customizable ? `${note.trim()}${fileNote}`.trim() : '' });
    if (goToCart) {
      navigate('/app/cart');
      return;
    }
    flyToCart(document.querySelector('.pdp__media .product-img'));
    toast(`${qty} × ${product.name} added to cart.`, { action: { label: 'View cart', onClick: () => navigate('/app/cart') } });
  };

  const onAddRelated = (p, imageEl) => {
    if (p.customizable) {
      navigate(`/app/shop/${p.id}`);
      return;
    }
    flyToCart(imageEl);
    add(p, 1);
    toast(`${p.name} added to cart.`, { action: { label: 'View cart', onClick: () => navigate('/app/cart') } });
  };

  return (
    <div className="page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/app/shop">
          <ChevronLeft size={16} aria-hidden="true" /> Shop
        </Link>
        <span aria-hidden="true">/</span>
        <Link to={`/app/shop?category=${product.category}`}>{category?.name}</Link>
      </nav>

      <div className="pdp" data-ink={category?.ink}>
        <CropFrame className="pdp__media">
          <ProductImage product={product} eager />
        </CropFrame>

        <div className="pdp__info">
          <p className="pdp__cat">{category?.name}</p>
          <h1 className="h1 pdp__name">{product.name}</h1>
          <p className="pdp__price num">
            {product.customizable && <span className="pdp__from">from </span>}
            {formatPeso(product.price)}
            {product.customizable && <span className="pdp__unit"> per piece</span>}
          </p>
          <p className="pdp__desc">{product.description}</p>

          <ul className="pdp__details" role="list">
            {product.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>

          <p className={`pdp__stock ${product.stock === 0 ? 'pdp__stock--out' : ''}`}>
            {product.customizable ? (
              <>
                <Clock size={18} aria-hidden="true" /> Made to order. Ready in {product.leadTime} after you approve the proof.
              </>
            ) : product.stock === 0 ? (
              <>
                <PackageX size={18} aria-hidden="true" /> Out of stock. Message the shop to ask when it will be back.
              </>
            ) : product.stock <= LOW_STOCK_AT ? (
              <>
                <PackageCheck size={18} aria-hidden="true" /> Only {product.stock} left at the Leuterio shop
              </>
            ) : (
              <>
                <PackageCheck size={18} aria-hidden="true" /> In stock at the Leuterio shop
              </>
            )}
          </p>

          {product.customizable && (
            <div className="pdp__custom">
              <h2 className="h4">
                <Wand2 size={18} aria-hidden="true" /> Your design
              </h2>
              <div className="field">
                <label htmlFor="custom-note">What should we print?</label>
                <textarea
                  id="custom-note"
                  className="textarea"
                  rows={3}
                  placeholder="Text, colors, sizes, names and numbers. Example: Front logo, back text 'Lalud Warriors', sizes 4 M, 6 L, 2 XL."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  aria-invalid={!!noteError}
                  aria-describedby={noteError ? 'custom-err' : undefined}
                />
                {noteError && (
                  <p id="custom-err" className="error">
                    {noteError}
                  </p>
                )}
              </div>
              <FileDrop files={files} onChange={setFiles} accept="image/*,.pdf,.ai,.psd" label="Attach design files" />
            </div>
          )}

          <div className="pdp__buy">
            <QuantityStepper value={qty} onChange={setQty} max={product.stock ? Math.min(99, product.stock) : 99} />
            <p className="pdp__total num">
              Total <strong>{formatPeso(product.price * qty)}</strong>
            </p>
          </div>
          <div className="pdp__actions">
            <button type="button" className="btn btn--primary btn--lg" onClick={() => addToCart(false)} disabled={product.stock === 0}>
              Add to Cart
            </button>
            <button type="button" className="btn btn--ghost btn--lg" onClick={() => addToCart(true)} disabled={product.stock === 0}>
              Buy now
            </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="related" aria-labelledby="related-title">
          <h2 id="related-title" className="h3">
            More {category?.name.toLowerCase()}
          </h2>
          <div className="product-grid product-grid--4">
            {related.map((p, i) => (
              <ProductCard key={p.id} index={i} product={p} to={`/app/shop/${p.id}`} onAdd={onAddRelated} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
