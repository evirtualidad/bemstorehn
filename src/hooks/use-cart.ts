
'use client';

import type { Product } from '@/lib/products';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useSettingsStore } from './use-settings-store';

export type CartItem = {
  quantity: number;
} & Product;

type CartState = {
  items: CartItem[];
  total: number;
  subtotal: number;
  taxAmount: number;
  isOpen: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  toggleCart: () => void;
  clearCart: () => void;
};

const calculateCartTotals = (items: CartItem[]) => {
  const taxRate = useSettingsStore.getState().taxRate;
  const itemsTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotal = itemsTotal / (1 + taxRate);
  const taxAmount = itemsTotal - subtotal;
  return { total: itemsTotal, subtotal, taxAmount };
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      subtotal: 0,
      taxAmount: 0,
      isOpen: false,
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      addToCart: (product) => {
        const { items } = get();
        const existingItem = items.find((item) => item.id === product.id);

        let updatedItems;
        if (existingItem) {
          updatedItems = items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          updatedItems = [...items, { ...product, quantity: 1 }];
        }
        
        set({ items: updatedItems, ...calculateCartTotals(updatedItems) });
      },
      removeFromCart: (productId) => {
        const updatedItems = get().items.filter((item) => item.id !== productId);
        set({ items: updatedItems, ...calculateCartTotals(updatedItems) });
      },
      increaseQuantity: (productId) => {
        const updatedItems = get().items.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
        set({ items: updatedItems, ...calculateCartTotals(updatedItems) });
      },
      decreaseQuantity: (productId) => {
        const { items } = get();
        const existingItem = items.find((item) => item.id === productId);

        if (existingItem?.quantity === 1) {
          const updatedItems = items.filter((item) => item.id !== productId);
          set({ items: updatedItems, ...calculateCartTotals(updatedItems) });
        } else {
          const updatedItems = items.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
          set({ items: updatedItems, ...calculateCartTotals(updatedItems) });
        }
      },
      clearCart: () => set({ items: [], total: 0, subtotal: 0, taxAmount: 0 }),
    }),
    {
      name: 'cart-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      onRehydrateStorage: () => (state) => {
        if (state) {
            const { items } = state;
            const { total, subtotal, taxAmount } = calculateCartTotals(items);
            state.total = total;
            state.subtotal = subtotal;
            state.taxAmount = taxAmount;
        }
      }
    }
  )
);

    