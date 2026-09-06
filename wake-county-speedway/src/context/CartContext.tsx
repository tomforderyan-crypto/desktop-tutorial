import React, { createContext, useContext, useMemo, useState } from 'react';
import type { MerchProduct } from '../api/merchCatalog';

export interface CartLine {
  product: MerchProduct;
  size?: string;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (product: MerchProduct, size: string | undefined, quantity: number) => void;
  removeLine: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clear: () => void;
  subtotalUsd: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  function addItem(product: MerchProduct, size: string | undefined, quantity: number) {
    setLines((prev) => {
      const existingIndex = prev.findIndex((l) => l.product.id === product.id && l.size === size);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + quantity };
        return next;
      }
      return [...prev, { product, size, quantity }];
    });
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuantity(index: number, quantity: number) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, quantity } : line)));
  }

  function clear() {
    setLines([]);
  }

  const subtotalUsd = useMemo(
    () => lines.reduce((sum, l) => sum + l.product.priceUsd * l.quantity, 0),
    [lines]
  );
  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  return (
    <CartContext.Provider value={{ lines, addItem, removeLine, updateQuantity, clear, subtotalUsd, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
