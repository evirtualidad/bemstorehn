
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
  _isHydrated: boolean;
  setIsHydrated: (value: boolean) => void;
};

const useProductsStoreBase = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      _isHydrated: false,
      setIsHydrated: (value: boolean) => set({ _isHydrated: value }),
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
      name: 'products-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
       onRehydrateStorage: () => (state) => {
        if (state) state.setIsHydrated(true)
      },
    }
  )
);

// This is a wrapper to ensure we only use the store once it has been hydrated
// on the client side. This prevents hydration mismatches.
export const useProductsStore = () => {
    const store = useProductsStoreBase();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(store._isHydrated);
    }, [store._isHydrated]);
    
    return { ...store, isHydrated };
}
