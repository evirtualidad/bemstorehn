'use client';

import { create } from 'zustand';
import type { Product } from '@/lib/products';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';

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
  isLoading: true,
  error: null,
  
  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
      if (error) throw error;
      set({ products: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      useToast.getState().toast({
        title: 'Error al cargar productos',
        description: error.message,
        variant: 'destructive',
      });
    }
  },

  getProductById: (productId: string) => {
    return get().products.find((p) => p.id === productId);
  },

  addProduct: async (productData) => {
    try {
      const { data, error } = await supabase.from('products').insert([productData]).select();
      if (error) throw error;
      const newProduct = data[0];
      set((state) => ({ products: [newProduct, ...state.products] }));
      return newProduct;
    } catch (error: any) {
       useToast.getState().toast({
        title: 'Error al añadir producto',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  },

  updateProduct: async (product) => {
    try {
      const { error } = await supabase.from('products').update(product).eq('id', product.id);
      if (error) throw error;
      set((state) => ({
        products: state.products.map((p) => (p.id === product.id ? product : p)),
      }));
    } catch (error: any) {
       useToast.getState().toast({
        title: 'Error al actualizar producto',
        description: error.message,
        variant: 'destructive',
      });
    }
  },

  deleteProduct: async (productId) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      set((state) => ({
        products: state.products.filter((p) => p.id !== productId),
      }));
    } catch (error: any) {
       useToast.getState().toast({
        title: 'Error al eliminar producto',
        description: error.message,
        variant: 'destructive',
      });
    }
  },

  decreaseStock: async (productId: string, quantity: number) => {
     try {
        const { data, error } = await supabase.rpc('decrease_stock', { p_id: productId, p_quantity: quantity });
        if (error) throw error;
        get().fetchProducts(); // Re-fetch to ensure consistency
    } catch (error: any) {
        console.error("Failed to decrease stock:", error.message);
        // Optionally show a toast to the user
    }
  },

  increaseStock: async (productId: string, quantity: number) => {
     try {
        const { data, error } = await supabase.rpc('increase_stock', { p_id: productId, p_quantity: quantity });
        if (error) throw error;
        get().fetchProducts(); // Re-fetch to ensure consistency
    } catch (error: any) {
        console.error("Failed to increase stock:", error.message);
    }
  },
}));
