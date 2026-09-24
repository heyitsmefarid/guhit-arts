// Product catalog as the shop currently has it: the base catalog from
// data/products.js, plus products staff added, with staff edits (price, stock,
// visibility) applied on top. Shared by the shop, checkout, and admin panel.
import { storage } from './storage';
import { products as baseProducts } from '../data/products';
import { INITIAL_STOCK } from '../data/inventory';

const OVERRIDES = 'inventory';
const ADDED = 'customProducts';

const overrides = () => storage.get(OVERRIDES, {});
const added = () => storage.get(ADDED, []);

// Every product with its current price, stock (null = made to order), and visibility.
export function allProducts() {
  const o = overrides();
  return [...baseProducts, ...added()].map((p) => {
    const edit = o[p.id] ?? {};
    const stock = p.customizable ? null : (edit.stock ?? INITIAL_STOCK[p.id] ?? p.stock ?? 0);
    return { ...p, price: edit.price ?? p.price, stock, active: edit.active ?? p.active ?? true };
  });
}

export const findProduct = (id) => allProducts().find((p) => p.id === id) ?? null;

export function updateProduct(id, patch) {
  const o = overrides();
  o[id] = { ...(o[id] ?? {}), ...patch };
  storage.set(OVERRIDES, o);
  return findProduct(id);
}

export function addProduct(product) {
  storage.set(ADDED, [...added(), product]);
  return findProduct(product.id);
}

// Takes sold items off the shelf. Made-to-order items are not counted.
export function deductStock(items) {
  const current = allProducts();
  const o = overrides();
  for (const line of items) {
    const p = current.find((x) => x.id === line.productId);
    if (!p || p.stock === null) continue;
    o[p.id] = { ...(o[p.id] ?? {}), stock: Math.max(0, p.stock - line.qty) };
  }
  storage.set(OVERRIDES, o);
}
