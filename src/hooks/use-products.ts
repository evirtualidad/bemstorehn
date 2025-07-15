
'use client';

import { products as initialProducts, type Product } from '@/lib/products';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useState, useEffect } from 'react';

type ProductsState = {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  getProductById: (productId: string) => Product | undefined;
  decreaseStock: (productId: string, quantity: number) => void;
};

const useProductsStoreBase = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      addProduct: (product) => {
        set((state) => ({ products: [product, ...state.products] }));
      },
      updateProduct: (product) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === product.id ? product : p
          ),
        }));
      },
      deleteProduct: (productId) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== productId),
        }));
      },
      getProductById: (productId: string) => {
        return get().products.find((p) => p.id === productId);
      },
      decreaseStock: (productId: string, quantity: number) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, stock: Math.max(0, p.stock - quantity) } : p
          ),
        }));
      }
    }),
    {
      name: 'products-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Custom hook to ensure hydration is complete before using the store
export const useProductsStore = () => {
  const store = useProductsStoreBase();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // This effect runs only on the client side
    // We can mark the store as hydrated here
    setIsHydrated(true);
  }, []);

  return { ...store, isHydrated };
};
