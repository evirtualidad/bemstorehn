
'use client';

import { create } from 'zustand';
import type { Product } from '@/lib/products';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from './use-toast';

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
  products: [],
  isLoading: false,
  error: null,
  
  fetchProducts: async (supabase: SupabaseClient) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
      if (error) throw error;
      set({ products: data, isLoading: false });
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
    try {
      const { data, error } = await supabase.from('products').insert([productData]).select();
      if (error) throw error;
      const newProduct = data[0];
      set((state) => ({ products: [newProduct, ...state.products] }));
      return newProduct;
    } catch (error: any) {
        toast({
            title: 'Error al añadir producto',
            description: error.message,
            variant: 'destructive',
        });
        return null;
    }
  },

  updateProduct: async (supabase: SupabaseClient, product) => {
     try {
      const { data, error } = await supabase.from('products').update(product).eq('id', product.id).select();
      if (error) throw error;
      set((state) => ({
        products: state.products.map((p) => (p.id === product.id ? data[0] : p)),
      }));
    } catch (error: any) {
        toast({
            title: 'Error al actualizar producto',
            description: error.message,
            variant: 'destructive',
        });
    }
  },

  deleteProduct: async (supabase: SupabaseClient, productId) => {
     try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      set((state) => ({
        products: state.products.filter((p) => p.id !== productId),
      }));
    } catch (error: any) {
        toast({
            title: 'Error al eliminar producto',
            description: error.message,
            variant: 'destructive',
        });
    }
  },

  decreaseStock: async (supabase: SupabaseClient, productId: string, quantity: number) => {
    const product = get().products.find(p => p.id === productId);
    if (!product) return;
    const newStock = product.stock - quantity;
    try {
        const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
        if (error) throw error;
        set(state => ({
            products: state.products.map(p => 
                p.id === productId ? { ...p, stock: newStock } : p
            )
        }));
    } catch (error: any) {
        toast({
            title: 'Error al actualizar stock',
            description: error.message,
            variant: 'destructive',
        });
    }
  },

  increaseStock: async (supabase: SupabaseClient, productId: string, quantity: number) => {
    const product = get().products.find(p => p.id === productId);
    if (!product) return;
    const newStock = product.stock + quantity;
     try {
        const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
        if (error) throw error;
        set(state => ({
            products: state.products.map(p => 
                p.id === productId ? { ...p, stock: newStock } : p
            )
        }));
    } catch (error: any) {
        toast({
            title: 'Error al actualizar stock',
            description: error.message,
            variant: 'destructive',
        });
    }
  },
}));
