
'use client';

import type { Product } from '@/lib/products';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useSettingsStore } from './use-settings-store';
import { toast } from './use-toast';
import { produce } from 'immer';


export type PosCartItem = {
  quantity: number;
} & Product;

type CartState = {
  items: PosCartItem[];
  total: number; // Items total (pre-shipping/tax)
  subtotal: number;
  taxAmount: number;
  shippingCost: number; 
  totalWithShipping: number; // Final total
  addToCart: (product: Product) => boolean;
  removeFromCart: (productId: string) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
  setShippingCost: (cost: number) => void;
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
            let success = false;
            set(produce((state: CartState) => {
                const existingItem = state.items.find((item) => item.id === product.id);

                if (existingItem) {
                    if (existingItem.quantity < product.stock) {
                        existingItem.quantity += 1;
                        success = true;
                    } else {
                        setTimeout(() => toast({
                            title: 'Stock Máximo Alcanzado',
                            description: `No puedes añadir más de ${product.name}.`,
                            variant: 'destructive',
                            duration: 3000,
                        }), 0);
                        success = false;
                    }
                } else {
                    if (product.stock > 0) {
                        state.items.push({ ...product, quantity: 1 });
                        success = true;
                    } else {
                        setTimeout(() => toast({
                            title: 'Producto Agotado',
                            description: `${product.name} no tiene stock disponible.`,
                            variant: 'destructive',
                            duration: 3000,
                        }), 0);
                        success = false;
                    }
                }

                if (success) {
                    const { taxRate } = useSettingsStore.getState();
                    const itemsTotal = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
                    state.total = itemsTotal;
                    state.totalWithShipping = itemsTotal + state.shippingCost;
                    state.subtotal = state.totalWithShipping / (1 + taxRate);
                    state.taxAmount = state.totalWithShipping - state.subtotal;
                }
            }));
            return success;
        },
        removeFromCart: (productId) => {
          set(produce((state: CartState) => {
            state.items = state.items.filter((item) => item.id !== productId);
            const { taxRate } = useSettingsStore.getState();
            const itemsTotal = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
            state.total = itemsTotal;
            state.totalWithShipping = itemsTotal + state.shippingCost;
            state.subtotal = state.totalWithShipping / (1 + taxRate);
            state.taxAmount = state.totalWithShipping - state.subtotal;
          }));
        },
        increaseQuantity: (productId) => {
          set(produce((state: CartState) => {
            const item = state.items.find(item => item.id === productId);
            if(item && item.quantity < item.stock) {
                item.quantity += 1;
                const { taxRate } = useSettingsStore.getState();
                const itemsTotal = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
                state.total = itemsTotal;
                state.totalWithShipping = itemsTotal + state.shippingCost;
                state.subtotal = state.totalWithShipping / (1 + taxRate);
                state.taxAmount = state.totalWithShipping - state.subtotal;
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
                const { taxRate } = useSettingsStore.getState();
                const itemsTotal = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
                state.total = itemsTotal;
                state.totalWithShipping = itemsTotal + state.shippingCost;
                state.subtotal = state.totalWithShipping / (1 + taxRate);
                state.taxAmount = state.totalWithShipping - state.subtotal;
             }
          }));
        },
        clearCart: () => {
          set({ items: [], total: 0, subtotal: 0, taxAmount: 0, shippingCost: 0, totalWithShipping: 0 });
        },
        setShippingCost: (cost) => {
          set(produce((state: CartState) => {
              state.shippingCost = cost;
              const { taxRate } = useSettingsStore.getState();
              const itemsTotal = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
              state.total = itemsTotal;
              state.totalWithShipping = itemsTotal + state.shippingCost;
              state.subtotal = state.totalWithShipping / (1 + taxRate);
              state.taxAmount = state.totalWithShipping - state.subtotal;
          }));
        },
      }
    }),
    {
      name: 'pos-cart-v2', // Unique key for the POS cart
      storage: createJSONStorage(() => localStorage),
    }
  )
);
