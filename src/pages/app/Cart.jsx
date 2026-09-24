import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import QuantityStepper from '../../components/ui/QuantityStepper';
import ProductImage from '../../components/shop/ProductImage';
import EmptyState from '../../components/ui/EmptyState';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { products } from '../../data/products';
import { formatPeso } from '../../utils/format';

export default function Cart() {
  const { items, subtotal, count, setQty, remove, add } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const onRemove = (line) => {
    remove(line.id);
    const product = products.find((p) => p.id === line.productId);
    toast(`${line.name} removed.`, {
      tone: 'info',
      action: product ? { label: 'Undo', onClick: () => add(product, line.qty, { note: line.note }) } : null,
    });
  };

  if (!items.length) {
    return (
      <div className="page">
        <PageHeader title="Cart" />
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          body="Add supplies or custom items from the shop. They stay here until you check out."
          note="Bond paper runs out fast in exam week!"
        >
          <Link to="/app/shop" className="btn btn--primary">
            Go to the shop
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title="Cart" description={`${count} ${count === 1 ? 'item' : 'items'} ready for checkout.`} />
      <div className="cart">
        <ul className="cart__lines" role="list">
          {items.map((line) => {
            const product = products.find((p) => p.id === line.productId) ?? { ...line, category: 'custom' };
            return (
              <li key={line.id} className="cart-line">
                <Link to={`/app/shop/${line.productId}`} className="cart-line__img">
                  <ProductImage product={product} />
                </Link>
                <div className="cart-line__info">
                  <Link to={`/app/shop/${line.productId}`} className="cart-line__name">
                    {line.name}
                  </Link>
                  <p className="small muted num">{formatPeso(line.price)} each</p>
                  {line.note && <p className="cart-line__note small">{line.note}</p>}
                </div>
                <div className="cart-line__qty">
                  <QuantityStepper value={line.qty} onChange={(n) => setQty(line.id, n)} size="sm" label={`Quantity of ${line.name}`} />
                </div>
                <p className="cart-line__total num">{formatPeso(line.price * line.qty)}</p>
                <button type="button" className="icon-btn cart-line__remove" onClick={() => onRemove(line)} aria-label={`Remove ${line.name}`}>
                  <Trash2 size={18} />
                </button>
              </li>
            );
          })}
        </ul>

        <aside className="summary" aria-label="Order summary">
          <h2 className="h3">Summary</h2>
          <dl className="summary__rows">
            <div>
              <dt>Subtotal</dt>
              <dd className="num">{formatPeso(subtotal)}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd className="small muted">Free pickup, or ₱60 within Calapan</dd>
            </div>
          </dl>
          <div className="summary__total">
            <span>Total</span>
            <strong className="num">{formatPeso(subtotal)}</strong>
          </div>
          <button type="button" className="btn btn--primary btn--lg btn--block" onClick={() => navigate('/app/checkout')}>
            Checkout
          </button>
          <Link to="/app/shop" className="btn btn--text summary__continue">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
