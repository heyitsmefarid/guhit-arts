import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Banknote, CheckCircle2, Smartphone, Store, TriangleAlert, Truck, Wallet } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import RegMark from '../../components/brand/RegMark';
import Confetti from '../../components/fx/Confetti';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useAccount } from '../../context/AccountContext';
import { business } from '../../data/business';
import { formatPeso } from '../../utils/format';

const DELIVERY_FEE = 60;

const FULFILLMENT = [
  { id: 'pickup', icon: Store, title: 'Pick up at the shop', body: `${business.address.line1}. Free.`, fee: 0 },
  { id: 'delivery', icon: Truck, title: 'Deliver within Calapan', body: `Next business day. ${formatPeso(DELIVERY_FEE)}.`, fee: DELIVERY_FEE },
];

const PAYMENT = [
  { id: 'cash', icon: Banknote, title: (f) => (f === 'pickup' ? 'Cash on pickup' : 'Cash on delivery') },
  { id: 'gcash', icon: Smartphone, title: () => 'GCash' },
  { id: 'maya', icon: Wallet, title: () => 'Maya' },
];

function OptionCard({ name, option, checked, onChange, title, body }) {
  const Icon = option.icon;
  return (
    <label className={`option ${checked ? 'is-checked' : ''}`}>
      <input type="radio" name={name} value={option.id} checked={checked} onChange={onChange} />
      <Icon size={22} aria-hidden="true" />
      <span>
        <strong>{title}</strong>
        {body && <span className="small muted">{body}</span>}
      </span>
    </label>
  );
}

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, clear } = useCart();
  const { placeOrder } = useAccount();
  const [fulfillment, setFulfillment] = useState('pickup');
  const [payment, setPayment] = useState('cash');
  const [contact, setContact] = useState({ name: user.fullName, phone: user.contactNumber ?? '', address: user.address ?? '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState(null);

  if (placed) {
    return (
      <div className="page">
        <Confetti />
        <div className="done">
          <span className="done__mark" aria-hidden="true">
            <RegMark size={56} />
          </span>
          <h1 className="h1">Order placed!</h1>
          <p className="done__lede">
            We will confirm stock and message you at {placed.contact.phone}.{' '}
            {placed.fulfillment === 'pickup' ? 'Bring your reference number when you pick it up.' : 'Keep your phone on for the delivery rider.'}
          </p>
          <dl className="done__facts">
            <div>
              <dt>Reference</dt>
              <dd className="done__ref num">{placed.ref}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd className="num">{formatPeso(placed.total)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={placed.status} kind="order" />
              </dd>
            </div>
          </dl>
          {placed.payment !== 'cash' && (
            <p className="alert alert--info done__note">
              Prototype: no payment was taken. In the live system you would get a {placed.payment === 'gcash' ? 'GCash' : 'Maya'} payment request
              after we confirm the order.
            </p>
          )}
          <div className="done__actions">
            <Link to={`/app/track/${placed.ref}`} className="btn btn--primary btn--lg">
              Track this order
            </Link>
            <Link to="/app/shop" className="btn btn--ghost btn--lg">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!items.length) return <Navigate to="/app/cart" replace />;

  const fee = FULFILLMENT.find((f) => f.id === fulfillment).fee;
  const total = subtotal + fee;
  const set = (k) => (e) => setContact((c) => ({ ...c, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!contact.name.trim()) found.name = 'Enter the name of the person picking up or receiving the order.';
    if (!/^(09|\+639)\d{9}$/.test(contact.phone.replace(/[\s-]/g, ''))) found.phone = 'Enter an 11-digit mobile number starting with 09.';
    if (fulfillment === 'delivery' && contact.address.trim().length < 10) found.address = 'Enter the street, barangay, and landmark for the rider.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    const order = await placeOrder({
      items: items.map(({ productId, name, price, qty, image, note }) => ({ productId, name, price, qty, image, note })),
      fulfillment,
      payment,
      deliveryFee: fee,
      contact: { ...contact, address: fulfillment === 'delivery' ? contact.address.trim() : '' },
    });
    clear();
    setPlaced(order);
    window.scrollTo(0, 0);
  };

  return (
    <div className="page">
      <PageHeader title="Checkout" description="Nothing is charged in this prototype. Placing an order creates a trackable sample order." />
      <form className="checkout" onSubmit={submit} noValidate>
        <div className="checkout__steps">
          <fieldset className="step">
            <legend>
              <span className="step__num">1</span> How do you want to get it?
            </legend>
            <div className="options">
              {FULFILLMENT.map((f) => (
                <OptionCard key={f.id} name="fulfillment" option={f} checked={fulfillment === f.id} onChange={() => setFulfillment(f.id)} title={f.title} body={f.body} />
              ))}
            </div>
          </fieldset>

          <fieldset className="step">
            <legend>
              <span className="step__num">2</span> Contact details
            </legend>
            <div className="form-grid form-grid--2">
              <div className="field">
                <label htmlFor="c-name">Name</label>
                <input id="c-name" className="input" value={contact.name} onChange={set('name')} aria-invalid={!!errors.name} autoComplete="name" />
                {errors.name && <p className="error">{errors.name}</p>}
              </div>
              <div className="field">
                <label htmlFor="c-phone">Mobile number</label>
                <input id="c-phone" className="input" type="tel" value={contact.phone} onChange={set('phone')} aria-invalid={!!errors.phone} autoComplete="tel" />
                {errors.phone && <p className="error">{errors.phone}</p>}
              </div>
            </div>
            {fulfillment === 'delivery' && (
              <div className="field" style={{ marginTop: '1.1rem' }}>
                <label htmlFor="c-address">Delivery address</label>
                <textarea
                  id="c-address"
                  className="textarea"
                  rows={2}
                  value={contact.address}
                  onChange={set('address')}
                  aria-invalid={!!errors.address}
                  placeholder="House no., street, barangay, landmark"
                  autoComplete="street-address"
                />
                {errors.address && <p className="error">{errors.address}</p>}
              </div>
            )}
          </fieldset>

          <fieldset className="step">
            <legend>
              <span className="step__num">3</span> Payment
            </legend>
            <div className="options options--3">
              {PAYMENT.map((p) => (
                <OptionCard key={p.id} name="payment" option={p} checked={payment === p.id} onChange={() => setPayment(p.id)} title={p.title(fulfillment)} />
              ))}
            </div>
          </fieldset>
        </div>

        <aside className="summary" aria-label="Order summary">
          <h2 className="h3">Your order</h2>
          <ul className="summary__items" role="list">
            {items.map((l) => (
              <li key={l.id}>
                <span>
                  {l.name} <span className="muted num">× {l.qty}</span>
                </span>
                <span className="num">{formatPeso(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="summary__rows">
            <div>
              <dt>Subtotal</dt>
              <dd className="num">{formatPeso(subtotal)}</dd>
            </div>
            <div>
              <dt>{fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}</dt>
              <dd className="num">{fee ? formatPeso(fee) : 'Free'}</dd>
            </div>
          </dl>
          <div className="summary__total">
            <span>Total</span>
            <strong className="num">{formatPeso(total)}</strong>
          </div>
          {Object.keys(errors).length > 0 && (
            <p className="alert alert--error" role="alert">
              <TriangleAlert size={18} aria-hidden="true" /> Check the highlighted details before placing the order.
            </p>
          )}
          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" aria-hidden="true" /> Placing order…
              </>
            ) : (
              <>
                <CheckCircle2 size={18} aria-hidden="true" /> Place order
              </>
            )}
          </button>
          <Link to="/app/cart" className="btn btn--text summary__continue">
            Back to cart
          </Link>
        </aside>
      </form>
    </div>
  );
}
