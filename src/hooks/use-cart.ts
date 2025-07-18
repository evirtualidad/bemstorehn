
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
  toggleCart: () => void;
  clearCart: () => void;
  setShippingCost: (cost: number) => void;
};

const calculateCartTotals = (items: CartItem[], shippingCost: number, taxRate: number) => {
  const itemsTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalWithShipping = itemsTotal + shippingCost;
  const subtotal = totalWithShipping / (1 + taxRate);
  const taxAmount = totalWithShipping - subtotal;
  return { total: totalWithShipping, subtotal, taxAmount };
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
        const taxRate = useSettingsStore.getState().taxRate;
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
        
        set({ items: updatedItems, ...calculateCartTotals(updatedItems, shippingCost, taxRate) });
      },
      removeFromCart: (productId) => {
        const updatedItems = get().items.filter((item) => item.id !== productId);
        const taxRate = useSettingsStore.getState().taxRate;
        set({ items: updatedItems, ...calculateCartTotals(updatedItems, get().shippingCost, taxRate) });
      },
      increaseQuantity: (productId) => {
        const updatedItems = get().items.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
        const taxRate = useSettingsStore.getState().taxRate;
        set({ items: updatedItems, ...calculateCartTotals(updatedItems, get().shippingCost, taxRate) });
      },
      decreaseQuantity: (productId) => {
        const { items } = get();
        const taxRate = useSettingsStore.getState().taxRate;
        const existingItem = items.find((item) => item.id === productId);

        if (existingItem?.quantity === 1) {
          const updatedItems = items.filter((item) => item.id !== productId);
          set({ items: updatedItems, ...calculateCartTotals(updatedItems, get().shippingCost, taxRate) });
        } else {
          const updatedItems = items.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
          set({ items: updatedItems, ...calculateCartTotals(updatedItems, get().shippingCost, taxRate) });
        }
      },
      clearCart: () => set({ items: [], total: 0, subtotal: 0, taxAmount: 0, shippingCost: 0 }),
      setShippingCost: (cost) => {
          const taxRate = useSettingsStore.getState().taxRate;
          set((state) => ({
              shippingCost: cost,
              ...calculateCartTotals(state.items, cost, taxRate)
          }));
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
            const { items, shippingCost } = state;
            const taxRate = useSettingsStore.getState().taxRate;
            const { total, subtotal, taxAmount } = calculateCartTotals(items, shippingCost || 0, taxRate);
            state.total = total;
            state.subtotal = subtotal;
            state.taxAmount = taxAmount;
            state.shippingCost = shippingCost || 0;
        }
      }
    }
  )
);
