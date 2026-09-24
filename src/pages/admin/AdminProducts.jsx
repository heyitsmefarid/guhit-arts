import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Minus, Plus, Search, SearchX } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ProductImage from '../../components/shop/ProductImage';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../utils/permissions';
import { useToast } from '../../context/ToastContext';
import { categories, getCategory } from '../../data/products';
import { LOW_STOCK_AT, stockLevel } from '../../data/inventory';
import { formatPeso } from '../../utils/format';

const STOCK_FILTERS = [
  { id: 'all', label: 'All stock' },
  { id: 'low', label: `Low (${LOW_STOCK_AT} or fewer)` },
  { id: 'out', label: 'Out of stock' },
  { id: 'made', label: 'Made to order' },
  { id: 'hidden', label: 'Hidden from shop' },
];

const STOCK_TAG = {
  out: { cls: 'stock--out', text: 'Out of stock' },
  low: { cls: 'stock--low', text: 'Low stock' },
  ok: { cls: 'stock--ok', text: 'In stock' },
  made: { cls: 'stock--made', text: 'Made to order' },
};

function PriceCell({ product, onSave }) {
  const [value, setValue] = useState(String(product.price));
  const commit = () => {
    const n = Number(value);
    if (!n || n < 0) {
      setValue(String(product.price));
      return;
    }
    if (n !== product.price) onSave(n);
  };
  return (
    <div className="input-prefix input-prefix--sm">
      <span aria-hidden="true">₱</span>
      <input
        className="input num"
        type="number"
        min="1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label={`Price of ${product.name}`}
      />
    </div>
  );
}

function StockCell({ product, onSave }) {
  if (product.stock === null) return <span className="muted small">Made to order</span>;
  const set = (n) => onSave(Math.max(0, n));
  return (
    <div className="stepper stepper--sm" role="group" aria-label={`Stock of ${product.name}`}>
      <button type="button" onClick={() => set(product.stock - 1)} disabled={product.stock <= 0} aria-label="Remove one">
        <Minus size={14} />
      </button>
      <input
        type="number"
        min="0"
        className="num"
        defaultValue={product.stock}
        key={product.stock}
        onBlur={(e) => Number(e.target.value) !== product.stock && set(Number(e.target.value) || 0)}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label="Units in stock"
      />
      <button type="button" onClick={() => set(product.stock + 10)} aria-label="Add ten">
        <Plus size={14} />
      </button>
    </div>
  );
}

const EMPTY_FORM = { name: '', category: 'art', price: '', stock: '10', customizable: false, description: '' };

export default function AdminProducts() {
  const { products, updateProduct, addProduct, loading } = useAdmin();
  const { user } = useAuth();
  const canPrice = can(user, 'edit-prices');
  const canManage = can(user, 'manage-products');
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? 'all';
  const stock = params.get('stock') ?? 'all';
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products
      .filter((p) => category === 'all' || p.category === category)
      .filter((p) => {
        if (stock === 'hidden') return !p.active;
        if (stock === 'all') return true;
        const level = stockLevel(p.stock);
        return stock === 'low' ? level === 'low' || level === 'out' : level === stock;
      })
      .filter((p) => !term || p.name.toLowerCase().includes(term));
  }, [products, category, stock, q]);

  const save = async (product, patch, message) => {
    await updateProduct(product.id, patch);
    toast(message);
  };

  const submitNew = async (e) => {
    e.preventDefault();
    const found = {};
    if (form.name.trim().length < 3) found.name = 'Enter the product name.';
    if (!(Number(form.price) > 0)) found.price = 'Enter a price above ₱0.';
    if (!form.customizable && !(Number(form.stock) >= 0)) found.stock = 'Enter how many are on the shelf.';
    setErrors(found);
    if (Object.keys(found).length) return;
    const product = await addProduct({
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      stock: form.customizable ? null : Number(form.stock),
      customizable: form.customizable,
      description: form.description.trim() || 'New item at the Leuterio shop.',
    });
    toast(`${product.name} added. It is now in the shop.`);
    setAdding(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="page">
      <PageHeader
        title="Products & Stock"
        description={
          canManage
            ? 'Prices and stock here are what customers see in the shop. Changes save as soon as you leave the field.'
            : 'Update stock counts as items come in or sell at the counter. Prices and the product list are managed by the administrator.'
        }
        actions={
          canManage && (
            <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
              <Plus size={18} aria-hidden="true" /> Add product
            </button>
          )
        }
      />

      <div className="admin-filters">
        <div className="input-wrap admin-filters__search">
          <Search size={18} aria-hidden="true" />
          <input className="input" type="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        </div>
        <label className="admin-filters__select">
          <span className="sr-only">Stock</span>
          <select className="select" value={stock} onChange={(e) => set('stock', e.target.value)}>
            {STOCK_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="chip-row" role="group" aria-label="Filter by category">
        <button type="button" className="chip" aria-pressed={category === 'all'} onClick={() => set('category', 'all')}>
          All <span className="chip__count num">{products.length}</span>
        </button>
        {categories.map((c) => (
          <button key={c.id} type="button" className="chip" aria-pressed={category === c.id} onClick={() => set('category', c.id)}>
            {c.name} <span className="chip__count num">{products.filter((p) => p.category === c.id).length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="table-card sk-block" style={{ height: 320 }} aria-busy="true" />
      ) : shown.length ? (
        <div className="table-card">
          <table className="table admin-products">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Category</th>
                <th scope="col">Price</th>
                <th scope="col">Stock</th>
                <th scope="col">Status</th>
                <th scope="col">In shop</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => {
                const level = STOCK_TAG[stockLevel(p.stock)];
                return (
                  <tr key={p.id} className={p.active ? '' : 'is-hidden'}>
                    <td data-label="Product">
                      <span className="admin-product">
                        <span className="admin-product__img">
                          <ProductImage product={p} />
                        </span>
                        <span>
                          <span className="t-title">{p.name}</span>
                          <span className="t-sub">{p.id.startsWith('new-') ? 'Added by staff' : p.details?.[0]}</span>
                        </span>
                      </span>
                    </td>
                    <td data-label="Category">{getCategory(p.category)?.name}</td>
                    <td data-label="Price">
                      {canPrice ? (
                        <PriceCell key={p.price} product={p} onSave={(price) => save(p, { price }, `${p.name} now costs ${formatPeso(price)}.`)} />
                      ) : (
                        <span className="num t-strong">{formatPeso(p.price)}</span>
                      )}
                    </td>
                    <td data-label="Stock">
                      <StockCell product={p} onSave={(n) => save(p, { stock: n }, `${p.name}: ${n} in stock.`)} />
                    </td>
                    <td data-label="Status">
                      <span className={`stock ${level.cls}`}>{level.text}</span>
                    </td>
                    <td data-label="In shop">
                      <label className={`switch ${canManage ? '' : 'switch--locked'}`} title={canManage ? undefined : 'Only the administrator can hide or show products'}>
                        <input
                          type="checkbox"
                          disabled={!canManage}
                          checked={p.active}
                          onChange={(e) =>
                            save(p, { active: e.target.checked }, e.target.checked ? `${p.name} is back in the shop.` : `${p.name} is hidden from the shop.`)
                          }
                        />
                        <span className="switch__track" aria-hidden="true" />
                        <span className="switch__text">{p.active ? 'Shown' : 'Hidden'}</span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={SearchX} title="No products match" body="Try another search or clear the filters.">
          <button
            type="button"
            className="btn btn--ink"
            onClick={() => {
              setQ('');
              setParams({}, { replace: true });
            }}
          >
            Clear filters
          </button>
        </EmptyState>
      )}

      <Modal
        open={adding}
        title="Add a product"
        onClose={() => setAdding(false)}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button type="submit" form="add-product" className="btn btn--primary">
              Add product
            </button>
          </>
        }
      >
        <form id="add-product" className="form-grid" onSubmit={submitNew} noValidate>
          <div className="field">
            <label htmlFor="np-name">Product name</label>
            <input id="np-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} placeholder="Example: Poster Paint Set, 12 Colors" />
            {errors.name && <p className="error">{errors.name}</p>}
          </div>
          <div className="form-grid form-grid--2">
            <div className="field">
              <label htmlFor="np-cat">Category</label>
              <select id="np-cat" className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="np-price">Price</label>
              <div className="input-prefix">
                <span aria-hidden="true">₱</span>
                <input id="np-price" className="input num" type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} aria-invalid={!!errors.price} />
              </div>
              {errors.price && <p className="error">{errors.price}</p>}
            </div>
          </div>
          <label className="check">
            <input type="checkbox" checked={form.customizable} onChange={(e) => setForm({ ...form, customizable: e.target.checked })} />
            <span>
              <strong>Made to order</strong>
              <span className="small muted"> Customers describe their design; no stock count.</span>
            </span>
          </label>
          {!form.customizable && (
            <div className="field">
              <label htmlFor="np-stock">Units in stock</label>
              <input id="np-stock" className="input num" type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} aria-invalid={!!errors.stock} />
              {errors.stock && <p className="error">{errors.stock}</p>}
            </div>
          )}
          <div className="field">
            <label htmlFor="np-desc">
              Description <span className="muted">(optional)</span>
            </label>
            <textarea id="np-desc" className="textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <p className="tiny muted">A product photo can be added later. Until then the shop shows a placeholder tile.</p>
        </form>
      </Modal>
    </div>
  );
}
