
'use client';

import type { Product } from '@/lib/products';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useSettingsStore } from './use-settings-store';

export type PosCartItem = {
  quantity: number;
} & Product;

type CartState = {
  items: PosCartItem[];
  total: number;
  subtotal: number;
  taxAmount: number;
  shippingCost: number; 
  totalWithShipping: number;
  setItems: (items: PosCartItem[]) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
  setShippingCost: (cost: number) => void;
};

const calculateCartTotals = (items: PosCartItem[], shippingCost: number) => {
  const taxRate = useSettingsStore.getState().taxRate;
  const itemsTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalWithShipping = itemsTotal + shippingCost;
  const subtotal = totalWithShipping / (1 + taxRate);
  const taxAmount = totalWithShipping - subtotal;
  return { total: itemsTotal, subtotal, taxAmount, totalWithShipping };
};

export const usePosCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      subtotal: 0,
      taxAmount: 0,
      shippingCost: 0,
      totalWithShipping: 0,
      setItems: (items) => {
          const { shippingCost } = get();
          const { total, subtotal, taxAmount, totalWithShipping } = calculateCartTotals(items, shippingCost);
          set({ items, total, subtotal, taxAmount, totalWithShipping });
      },
      addToCart: (product) => {
        const { items, shippingCost } = get();
        const existingItem = items.find((item) => item.id === product.id);

        let updatedItems;
        if (existingItem) {
          if (existingItem.quantity < product.stock) {
            updatedItems = items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          } else {
            // Potentially show a toast here if you want to notify the user
            return; // Do nothing if stock limit is reached
          }
        } else {
          updatedItems = [...items, { ...product, quantity: 1 }];
        }
        
        set({ items: updatedItems, ...calculateCartTotals(updatedItems, shippingCost) });
      },
      removeFromCart: (productId) => {
        const updatedItems = get().items.filter((item) => item.id !== productId);
        set({ items: updatedItems, ...calculateCartTotals(updatedItems, get().shippingCost) });
      },
      increaseQuantity: (productId) => {
        const { items, shippingCost } = get();
        const itemToUpdate = items.find(item => item.id === productId);
        if (!itemToUpdate || itemToUpdate.quantity >= itemToUpdate.stock) return;

        const updatedItems = items.map((item) =>
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
      clearCart: () => set({ items: [], total: 0, subtotal: 0, taxAmount: 0, shippingCost: 0, totalWithShipping: 0 }),
      setShippingCost: (cost) => {
          set((state) => ({
              shippingCost: cost,
              ...calculateCartTotals(state.items, cost)
          }));
      },
    }),
    {
      name: 'pos-cart-storage', // Different name from the customer cart
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
            const { items, shippingCost } = state;
            const { total, subtotal, taxAmount, totalWithShipping } = calculateCartTotals(items, shippingCost || 0);
            state.total = total;
            state.subtotal = subtotal;
            state.taxAmount = taxAmount;
            state.shippingCost = shippingCost || 0;
            state.totalWithShipping = totalWithShipping;
        }
      }
    }
  )
);
