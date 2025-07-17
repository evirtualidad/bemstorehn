
'use client';

import { create } from 'zustand';
import type { Product } from '@/lib/products';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from './use-toast';
import { products as mockProducts } from '@/lib/products';

type ProductsState = {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: (supabase: SupabaseClient) => Promise<void>;
  addProduct: (supabase: SupabaseClient, product: Omit<Product, 'id'>) => Promise<Product | null>;
  updateProduct: (supabase: SupabaseClient, product: Product) => Promise<void>;
  deleteProduct: (supabase: SupabaseClient, productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  decreaseStock: (supabase: SupabaseClient, productId: string, quantity: number) => Promise<void>;
  increaseStock: (supabase: SupabaseClient, productId: string, quantity: number) => Promise<void>;
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: mockProducts,
  isLoading: false,
  error: null,
  
  fetchProducts: async (supabase: SupabaseClient) => {
    // This is a mock implementation. It will be replaced with a real DB call.
    set({ isLoading: true });
    try {
      // const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
      // if (error) throw error;
      set({ products: mockProducts, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast({
        title: 'Error al cargar productos',
        description: error.message,
        variant: 'destructive',
      });
    }
  },

  getProductById: (productId: string) => {
    return get().products.find((p) => p.id === productId);
  },

  addProduct: async (supabase: SupabaseClient, productData) => {
    // This is a mock implementation.
    console.log("Adding product (mock):", productData);
    const newProduct = { ...productData, id: `prod_${Date.now()}` };
    set((state) => ({ products: [newProduct, ...state.products] }));
    return newProduct;
  },

  updateProduct: async (supabase: SupabaseClient, product) => {
    // This is a mock implementation.
    console.log("Updating product (mock):", product);
    set((state) => ({
      products: state.products.map((p) => (p.id === product.id ? product : p)),
    }));
  },

  deleteProduct: async (supabase: SupabaseClient, productId) => {
    // This is a mock implementation.
    console.log("Deleting product (mock):", productId);
    set((state) => ({
      products: state.products.filter((p) => p.id !== productId),
    }));
  },

  decreaseStock: async (supabase: SupabaseClient, productId: string, quantity: number) => {
    // This is a mock implementation.
    console.log(`Decreasing stock for ${productId} by ${quantity} (mock)`);
    set(state => ({
      products: state.products.map(p => 
        p.id === productId ? { ...p, stock: p.stock - quantity } : p
      )
    }));
  },

  increaseStock: async (supabase: SupabaseClient, productId: string, quantity: number) => {
    // This is a mock implementation.
     console.log(`Increasing stock for ${productId} by ${quantity} (mock)`);
    set(state => ({
      products: state.products.map(p => 
        p.id === productId ? { ...p, stock: p.stock + quantity } : p
      )
    }));
  },
}));
