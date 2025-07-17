
'use client';

import { create } from 'zustand';
import type { Product } from '@/lib/products';
import { toast } from './use-toast';
import { produce } from 'immer';
import { products as initialProducts } from '@/lib/products';

type ProductsState = {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product | null>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  decreaseStock: (productId: string, quantity: number) => Promise<void>;
  increaseStock: (productId: string, quantity: number) => Promise<void>;
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  
  fetchProducts: async () => {
    // Only fetch initial products if the store is empty
    if (get().products.length > 0) {
      return;
    }
    set({ isLoading: true });
    // Simulate API call
    setTimeout(() => {
        set({ products: initialProducts, isLoading: false });
    }, 500);
  },

  getProductById: (productId: string) => {
    return get().products.find((p) => p.id === productId);
  },

  addProduct: async (productData) => {
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      ...productData,
    };
    set(produce((state: ProductsState) => {
      state.products.unshift(newProduct);
    }));
    toast({ title: 'Producto añadido', description: `${newProduct.name} ha sido añadido.` });
    return newProduct;
  },

  updateProduct: async (product) => {
    set(produce((state: ProductsState) => {
      const index = state.products.findIndex((p) => p.id === product.id);
      if (index !== -1) {
        state.products[index] = product;
      }
    }));
     toast({ title: 'Producto actualizado', description: `Los cambios en ${product.name} han sido guardados.` });
  },

  deleteProduct: async (productId) => {
    set(produce((state: ProductsState) => {
        state.products = state.products.filter((p) => p.id !== productId);
    }));
    toast({ title: 'Producto eliminado', variant: 'destructive' });
  },

  decreaseStock: async (productId: string, quantity: number) => {
    set(produce((state: ProductsState) => {
      const product = state.products.find(p => p.id === productId);
      if (product) {
        product.stock -= quantity;
      }
    }));
  },

  increaseStock: async (productId: string, quantity: number) => {
    set(produce((state: ProductsState) => {
      const product = state.products.find(p => p.id === productId);
      if (product) {
        product.stock += quantity;
      }
    }));
  },
}));
