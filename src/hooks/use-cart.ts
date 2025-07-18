
'use client';

import type { Product } from '@/lib/products';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useSettingsStore } from './use-settings-store';
import { toast } from './use-toast';

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

// This function is now defined outside the hook to avoid closure issues.
// It takes taxRate as a direct argument.
const calculateTotals = (items: CartItem[], shippingCost: number, taxRate: number) => {
  const itemsTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalWithShipping = itemsTotal + shippingCost;
  const subtotal = totalWithShipping / (1 + taxRate);
  const taxAmount = totalWithShipping - subtotal;
  return { total: totalWithShipping, subtotal, taxAmount };
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => {
      // Function to recalculate and set the state
      const recalculateAndSetState = (items: CartItem[], shippingCost: number) => {
        const taxRate = useSettingsStore.getState().taxRate;
        const totals = calculateTotals(items, shippingCost, taxRate);
        set({ items, ...totals });
      };

      return {
        items: [],
        total: 0,
        subtotal: 0,
        taxAmount: 0,
        shippingCost: 0,
        isOpen: false,
        toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
        addToCart: (product) => {
          const currentItems = get().items;
          const existingItem = currentItems.find((item) => item.id === product.id);

          let updatedItems;
          if (existingItem) {
             if (existingItem.quantity >= product.stock) {
                toast({
                    title: 'Stock Máximo Alcanzado',
                    description: `No puedes añadir más de ${product.name}.`,
                    variant: 'destructive'
                });
                return;
            }
            updatedItems = currentItems.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          } else {
             if (product.stock <= 0) {
                toast({
                    title: 'Producto Agotado',
                    description: `${product.name} no está disponible.`,
                    variant: 'destructive'
                });
                return;
            }
            updatedItems = [...currentItems, { ...product, quantity: 1 }];
          }
          
          recalculateAndSetState(updatedItems, get().shippingCost);
        },
        removeFromCart: (productId) => {
          const updatedItems = get().items.filter((item) => item.id !== productId);
          recalculateAndSetState(updatedItems, get().shippingCost);
        },
        increaseQuantity: (productId) => {
          const currentItems = get().items;
          const itemToUpdate = currentItems.find(item => item.id === productId);
          if (!itemToUpdate || itemToUpdate.quantity >= itemToUpdate.stock) return;

          const updatedItems = currentItems.map((item) =>
            item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
          );
          recalculateAndSetState(updatedItems, get().shippingCost);
        },
        decreaseQuantity: (productId) => {
          const currentItems = get().items;
          const existingItem = currentItems.find((item) => item.id === productId);

          if (existingItem?.quantity === 1) {
            const updatedItems = currentItems.filter((item) => item.id !== productId);
            recalculateAndSetState(updatedItems, get().shippingCost);
          } else {
            const updatedItems = currentItems.map((item) =>
              item.id === productId
                ? { ...item, quantity: Math.max(0, item.quantity - 1) }
                : item
            );
            recalculateAndSetState(updatedItems, get().shippingCost);
          }
        },
        clearCart: () => {
          set({ items: [], total: 0, subtotal: 0, taxAmount: 0, shippingCost: 0 });
        },
        setShippingCost: (cost) => {
          set({ shippingCost: cost });
          recalculateAndSetState(get().items, cost);
        },
      }
    },
    {
      name: 'store-cart-v2', // New, isolated storage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
