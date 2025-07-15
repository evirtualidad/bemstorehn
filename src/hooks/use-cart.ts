
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
  shippingCost: number;
  isOpen: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  setShippingCost: (cost: number) => void;
  toggleCart: () => void;
  clearCart: () => void;
};

const calculateCartTotals = (items: CartItem[], shippingCost: number) => {
  const taxRate = useSettingsStore.getState().taxRate;
  const itemsTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotal = itemsTotal / (1 + taxRate);
  const taxAmount = itemsTotal - subtotal;
  const total = itemsTotal + shippingCost;
  return { total, subtotal, taxAmount };
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      subtotal: 0,
      taxAmount: 0,
      shippingCost: 0,
      isOpen: false,
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      addToCart: (product) => {
        const { items, shippingCost } = get();
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
        
        set({ items: updatedItems, ...calculateCartTotals(updatedItems, shippingCost) });
      },
      removeFromCart: (productId) => {
        const { shippingCost } = get();
        const updatedItems = get().items.filter((item) => item.id !== productId);
        set({ items: updatedItems, ...calculateCartTotals(updatedItems, shippingCost) });
      },
      increaseQuantity: (productId) => {
        const { shippingCost } = get();
        const updatedItems = get().items.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
        set({ items: updatedItems, ...calculateCartTotals(updatedItems, shippingCost) });
      },
      decreaseQuantity: (productId) => {
        const { items, shippingCost } = get();
        const existingItem = items.find((item) => item.id === productId);

        if (existingItem?.quantity === 1) {
          const updatedItems = items.filter((item) => item.id !== productId);
          set({ items: updatedItems, ...calculateCartTotals(updatedItems, shippingCost) });
        } else {
          const updatedItems = items.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
          set({ items: updatedItems, ...calculateCartTotals(updatedItems, shippingCost) });
        }
      },
      setShippingCost: (cost: number) => {
        const { items } = get();
        set({ shippingCost: cost, ...calculateCartTotals(items, cost) });
      },
      clearCart: () => set({ items: [], total: 0, subtotal: 0, taxAmount: 0, shippingCost: 0 }),
    }),
    {
      name: 'cart-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      onRehydrateStorage: () => (state) => {
        if (state) {
            const { items, shippingCost } = state;
            const { total, subtotal, taxAmount } = calculateCartTotals(items, shippingCost);
            state.total = total;
            state.subtotal = subtotal;
            state.taxAmount = taxAmount;
        }
      }
    }
  )
);
