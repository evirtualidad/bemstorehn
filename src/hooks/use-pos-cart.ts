
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
  total: number;
  subtotal: number;
  taxAmount: number;
  shippingCost: number; 
  totalWithShipping: number;
  addToCart: (product: Product) => boolean;
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
              updatedItems = [...items, { ...product, quantity: 1 }];
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
        
        set({ items: updatedItems, ...calculateCartTotals(updatedItems, shippingCost) });
        return true;
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
          set({ items: updatedItems, ...calculateCartTotals(updatedItems, get().shippingCost) });
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
      name: 'bms-pos-cart-v2', // NEW, CLEAN STORAGE KEY
      storage: createJSONStorage(() => localStorage),
    }
  )
);
