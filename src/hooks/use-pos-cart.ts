
'use client';

import type { Product } from '@/lib/products';
import { create } from 'zustand';
import { useSettingsStore } from './use-settings-store';
import { toast } from './use-toast';

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

export const usePosCart = create<CartState>()((set, get) => {
    const calculatePosCartTotals = (items: PosCartItem[], shippingCost: number) => {
        const taxRate = useSettingsStore.getState().settings?.tax_rate ?? 0.15;
        const itemsTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const totalWithShipping = itemsTotal + shippingCost;
        const subtotal = totalWithShipping / (1 + taxRate);
        const taxAmount = totalWithShipping - subtotal;
        return {
            total: itemsTotal,
            totalWithShipping,
            subtotal,
            taxAmount
        };
    };

    const recalculateAndSetState = (items: PosCartItem[], shippingCost: number) => {
        const totals = calculatePosCartTotals(items, shippingCost);
        set({ items, ...totals });
    };

  return {
    items: [],
    total: 0,
    subtotal: 0,
    taxAmount: 0,
    shippingCost: 0,
    totalWithShipping: 0,
    
    addToCart: (product) => {
        let success = false;
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === product.id);

        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                const newItems = currentItems.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
                recalculateAndSetState(newItems, get().shippingCost);
                success = true;
            } else {
                toast({
                    title: 'Stock Máximo Alcanzado',
                    description: `No puedes añadir más de ${product.name}.`,
                    variant: 'destructive',
                    duration: 3000,
                });
                success = false;
            }
        } else {
            if (product.stock > 0) {
                const newItems = [...currentItems, { ...product, quantity: 1 }];
                recalculateAndSetState(newItems, get().shippingCost);
                success = true;
            } else {
                toast({
                    title: 'Producto Agotado',
                    description: `${product.name} no tiene stock disponible.`,
                    variant: 'destructive',
                    duration: 3000,
                });
                success = false;
            }
        }
        return success;
    },
    removeFromCart: (productId) => {
        const newItems = get().items.filter((item) => item.id !== productId);
        recalculateAndSetState(newItems, get().shippingCost);
    },
    increaseQuantity: (productId) => {
        const currentItems = get().items;
        const itemToIncrease = currentItems.find(item => item.id === productId);
        if (itemToIncrease && itemToIncrease.quantity < itemToIncrease.stock) {
            const newItems = currentItems.map(item => item.id === productId ? { ...item, quantity: item.quantity + 1 } : item);
            recalculateAndSetState(newItems, get().shippingCost);
        }
    },
    decreaseQuantity: (productId) => {
        const currentItems = get().items;
        const itemIndex = currentItems.findIndex((item) => item.id === productId);
        if (itemIndex !== -1) {
            let newItems;
            if (currentItems[itemIndex].quantity > 1) {
                newItems = currentItems.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
            } else {
                newItems = currentItems.filter(item => item.id !== productId);
            }
            recalculateAndSetState(newItems, get().shippingCost);
        }
    },
    clearCart: () => {
      set({ items: [], total: 0, subtotal: 0, taxAmount: 0, shippingCost: 0, totalWithShipping: 0 });
    },
    setShippingCost: (cost) => {
        set(state => {
            const totals = calculatePosCartTotals(state.items, cost);
            return { shippingCost: cost, ...totals };
        });
    },
  }
});
