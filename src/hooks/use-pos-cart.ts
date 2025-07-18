
'use client';

import type { Product } from '@/lib/products';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useSettingsStore } from './use-settings-store';
import { toast } from './use-toast';

export type PosCartItem = {
  quantity: number;
} & Product;

type CartState = {
  items: PosCartItem[];
  total: number; // Items total
  subtotal: number;
  taxAmount: number;
  shippingCost: number; 
  totalWithShipping: number; // Items total + shipping
  addToCart: (product: Product) => boolean;
  removeFromCart: (productId: string) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
  setShippingCost: (cost: number) => void;
};

// This function is now defined outside the hook to avoid closure issues.
// It takes taxRate as a direct argument.
const calculatePosCartTotals = (items: PosCartItem[], shippingCost: number, taxRate: number) => {
  const itemsTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalWithShipping = itemsTotal + shippingCost;
  const subtotal = totalWithShipping / (1 + taxRate);
  const taxAmount = totalWithShipping - subtotal;
  return { total: itemsTotal, subtotal, taxAmount, totalWithShipping };
};

export const usePosCart = create<CartState>()(
  persist(
    (set, get) => {
      // Function to recalculate and set the state
      const reCalculateAndSetState = (items: PosCartItem[], shippingCost: number) => {
        const taxRate = useSettingsStore.getState().taxRate;
        const totals = calculatePosCartTotals(items, shippingCost, taxRate);
        set({ items, ...totals, shippingCost });
      };

      return {
        items: [],
        total: 0,
        subtotal: 0,
        taxAmount: 0,
        shippingCost: 0,
        totalWithShipping: 0,
        
        addToCart: (product) => {
          const currentItems = get().items;
          const existingItem = currentItems.find((item) => item.id === product.id);

          let updatedItems;
          if (existingItem) {
            if (existingItem.quantity < product.stock) {
              updatedItems = currentItems.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              );
            } else {
              setTimeout(() => {
                  toast({
                      title: 'Stock Máximo Alcanzado',
                      description: `No puedes añadir más de ${product.name}.`,
                      variant: 'destructive',
                      duration: 3000,
                  });
              }, 0);
              return false;
            }
          } else {
            if (product.stock > 0) {
                updatedItems = [...currentItems, { ...product, quantity: 1 }];
            } else {
                setTimeout(() => {
                  toast({
                    title: 'Producto Agotado',
                    description: `${product.name} no tiene stock disponible.`,
                    variant: 'destructive',
                    duration: 3000,
                  });
                }, 0);
                return false;
            }
          }
          
          reCalculateAndSetState(updatedItems, get().shippingCost);
          return true;
        },
        removeFromCart: (productId) => {
          const updatedItems = get().items.filter((item) => item.id !== productId);
          reCalculateAndSetState(updatedItems, get().shippingCost);
        },
        increaseQuantity: (productId) => {
          const currentItems = get().items;
          const itemToUpdate = currentItems.find(item => item.id === productId);
          if (!itemToUpdate || itemToUpdate.quantity >= itemToUpdate.stock) return;

          const updatedItems = currentItems.map((item) =>
            item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
          );
          reCalculateAndSetState(updatedItems, get().shippingCost);
        },
        decreaseQuantity: (productId) => {
          const currentItems = get().items;
          const existingItem = currentItems.find((item) => item.id === productId);

          if (existingItem?.quantity === 1) {
            const updatedItems = currentItems.filter((item) => item.id !== productId);
            reCalculateAndSetState(updatedItems, get().shippingCost);
          } else {
            const updatedItems = currentItems.map((item) =>
              item.id === productId
                ? { ...item, quantity: Math.max(0, item.quantity - 1) }
                : item
            );
            reCalculateAndSetState(updatedItems, get().shippingCost);
          }
        },
        clearCart: () => {
          set({ items: [], total: 0, subtotal: 0, taxAmount: 0, shippingCost: 0, totalWithShipping: 0 });
        },
        setShippingCost: (cost) => {
          reCalculateAndSetState(get().items, cost);
        },
      }
    },
    {
      name: 'pos-cart-v2', // New, isolated storage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
