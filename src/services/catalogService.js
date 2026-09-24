// Product and digital-service catalog for the customer shop. Prices, stock,
// and visibility come from the inventory store, so staff edits in the admin
// panel show up here. Swap the bodies for GET /api/products etc. later.
import { categories } from '../data/products';
import { digitalServices } from '../data/digitalServices';
import { allProducts } from './inventoryStore';
import { delay } from './storage';

const SORTS = {
  featured: (a, b) => Number(!!b.featured) - Number(!!a.featured),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name),
};

const shopProducts = () => allProducts().filter((p) => p.active);

export async function getProducts({ search = '', category = 'all', sort = 'featured' } = {}) {
  await delay(220);
  const q = search.trim().toLowerCase();
  return shopProducts()
    .filter((p) => category === 'all' || p.category === category)
    .filter((p) => !q || `${p.name} ${p.description}`.toLowerCase().includes(q))
    .sort(SORTS[sort] ?? SORTS.featured);
}

export async function getProduct(id) {
  await delay(180);
  const all = shopProducts();
  const product = all.find((p) => p.id === id);
  if (!product) throw new Error('This product is no longer in the catalog.');
  const related = all.filter((p) => p.category === product.category && p.id !== id).slice(0, 4);
  return { product, related };
}

export const getCategories = () => categories;
export const getDigitalServices = () => digitalServices;
export const countByCategory = () => {
  const list = shopProducts();
  return categories.reduce((acc, c) => ({ ...acc, [c.id]: list.filter((p) => p.category === c.id).length }), {
    all: list.length,
  });
};
