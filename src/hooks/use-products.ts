
'use client';

import { products as initialProducts, type Product } from '@/lib/products';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useState, useEffect } from 'react';

type ProductsState = {
  products: Product[];
  isHydrated: boolean;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  getProductById: (productId: string) => Product | undefined;
  decreaseStock: (productId: string, quantity: number) => void;
  increaseStock: (productId: string, quantity: number) => void;
  setHydrated: () => void;
};

const useProductsStoreBase = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      isHydrated: false,
      setHydrated: () => set({ isHydrated: true }),
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
      },
      increaseStock: (productId: string, quantity: number) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, stock: p.stock + quantity } : p
          ),
        }));
      }
    }),
    {
      name: 'products-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
            state.setHydrated();
        }
      }
    }
  )
);

export const useProductsStore = () => {
  const store = useProductsStoreBase();
  const [hydratedStore, setHydratedStore] = useState(store);

  useEffect(() => {
    const unsub = useProductsStoreBase.persist.onRehydrate(() => {
        setHydratedStore(useProductsStoreBase.getState());
    });
    
    // Fallback if onRehydrate is not called (e.g. no stored state)
    if (!store.isHydrated) {
        useProductsStoreBase.getState().setHydrated();
    }
    
    // Also update on any state change after hydration
    const unsubEvery = useProductsStoreBase.subscribe(state => {
        if(state.isHydrated){
            setHydratedStore(state);
        }
    });

    return () => {
      unsub();
      unsubEvery();
    };
  }, [store.isHydrated]);

  return hydratedStore;
};
