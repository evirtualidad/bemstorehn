
'use client';

import { create } from 'zustand';
import { useSettingsStore } from './use-settings-store';
import { toast } from './use-toast';
import { produce } from 'immer';
import { type CartItem, type Product } from '@/lib/types';
import { persist, createJSONStorage } from 'zustand/middleware';

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


export const useCart = create<CartState>()(
  persist(
    (set, get) => {
      const calculateTotals = (items: CartItem[], shippingCost: number) => {
        const { taxRate } = useSettingsStore.getState();
        const itemsTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const total = itemsTotal + shippingCost;
        const subtotal = total / (1 + taxRate);
        const taxAmount = total - subtotal;
        return { total, subtotal, taxAmount };
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
          set(produce((state: CartState) => {
            const existingItem = state.items.find((item) => item.id === product.id);
            if (existingItem) {
              if (existingItem.quantity >= product.stock) {
                 setTimeout(() => toast({
                    title: 'Stock Máximo Alcanzado',
                    description: `No puedes añadir más de ${product.name}.`,
                    variant: 'destructive'
                }), 0);
                return;
              }
              existingItem.quantity += 1;
            } else {
               if (product.stock <= 0) {
                 setTimeout(() => toast({
                    title: 'Producto Agotado',
                    description: `${product.name} no está disponible.`,
                    variant: 'destructive'
                 }), 0);
                 return;
               }
              state.items.push({ ...product, quantity: 1 });
            }
            
            const { total, subtotal, taxAmount } = calculateTotals(state.items, state.shippingCost);
            state.total = total;
            state.subtotal = subtotal;
            state.taxAmount = taxAmount;
          }));
        },
        removeFromCart: (productId) => {
           set(produce((state: CartState) => {
              state.items = state.items.filter((item) => item.id !== productId);
              const { total, subtotal, taxAmount } = calculateTotals(state.items, state.shippingCost);
              state.total = total;
              state.subtotal = subtotal;
              state.taxAmount = taxAmount;
           }));
        },
        increaseQuantity: (productId) => {
          set(produce((state: CartState) => {
            const item = state.items.find(item => item.id === productId);
            if(item && item.quantity < item.stock) {
                item.quantity += 1;
                const { total, subtotal, taxAmount } = calculateTotals(state.items, state.shippingCost);
                state.total = total;
                state.subtotal = subtotal;
                state.taxAmount = taxAmount;
            }
          }));
        },
        decreaseQuantity: (productId) => {
          set(produce((state: CartState) => {
             const itemIndex = state.items.findIndex((item) => item.id === productId);
             if (itemIndex !== -1) {
                 if (state.items[itemIndex].quantity > 1) {
                    state.items[itemIndex].quantity -= 1;
                 } else {
                    state.items.splice(itemIndex, 1);
                 }
                const { total, subtotal, taxAmount } = calculateTotals(state.items, state.shippingCost);
                state.total = total;
                state.subtotal = subtotal;
                state.taxAmount = taxAmount;
             }
          }));
        },
        clearCart: () => {
          set({ items: [], total: 0, subtotal: 0, taxAmount: 0, shippingCost: 0 });
        },
        setShippingCost: (cost) => {
           set(produce((state: CartState) => {
              state.shippingCost = cost;
              const { total, subtotal, taxAmount } = calculateTotals(state.items, state.shippingCost);
              state.total = total;
              state.subtotal = subtotal;
              state.taxAmount = taxAmount;
           }));
        },
      }
    },
    {
      name: 'bem-store-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
