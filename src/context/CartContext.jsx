import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { storage } from '../services/storage';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

// Each cart line is keyed by product and customization note, so two custom
// shirts with different designs stay as separate lines.
const lineId = (productId, note = '') => `${productId}::${note.trim()}`;

export function CartProvider({ children }) {
  const { user } = useAuth();
  const storageKey = user ? `cart.${user.id}` : null;
  // Read synchronously so pages like Checkout see the saved cart on their first render after a reload.
  const [items, setItems] = useState(() => (storageKey ? storage.get(storageKey, []) : []));

  useEffect(() => {
    setItems(storageKey ? storage.get(storageKey, []) : []);
  }, [storageKey]);

  const persist = useCallback(
    (updater) => {
      setItems((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (storageKey) storage.set(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const add = useCallback(
    (product, qty = 1, { note = '', designFile = null } = {}) => {
      const id = lineId(product.id, note);
      persist((prev) => {
        const existing = prev.find((l) => l.id === id);
        if (existing) return prev.map((l) => (l.id === id ? { ...l, qty: Math.min(99, l.qty + qty) } : l));
        return [
          ...prev,
          { id, productId: product.id, name: product.name, price: product.price, image: product.image, qty, note: note.trim(), designFile },
        ];
      });
    },
    [persist]
  );

  const setQty = useCallback(
    (id, qty) => persist((prev) => prev.map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(99, qty)) } : l))),
    [persist]
  );
  const remove = useCallback((id) => persist((prev) => prev.filter((l) => l.id !== id)), [persist]);
  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, l) => n + l.qty, 0),
      subtotal: items.reduce((sum, l) => sum + l.price * l.qty, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, add, setQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
