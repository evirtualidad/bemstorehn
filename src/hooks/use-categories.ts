
'use client';

import { create } from 'zustand';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from './use-toast';

export interface Category {
  id: string;
  name: string;
  label: string;
}

type CategoriesState = {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: (supabase: SupabaseClient) => Promise<void>;
  addCategory: (supabase: SupabaseClient, category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (supabase: SupabaseClient, category: Category) => Promise<void>;
  deleteCategory: (supabase: SupabaseClient, categoryId: string) => Promise<void>;
  getCategoryById: (categoryId: string) => Category | undefined;
  getCategoryByName: (categoryName: string) => Category | undefined;
};

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async (supabase: SupabaseClient) => {
    set({ isLoading: true });
    try {
        const { data, error } = await supabase.from('categories').select('*').order('label', { ascending: true });
        if (error) throw error;
        set({ categories: data, isLoading: false });
    } catch (error: any) {
        set({ error: error.message, isLoading: false });
        toast({
            title: 'Error al cargar categorías',
            description: error.message,
            variant: 'destructive',
        });
    }
  },
  
  getCategoryById: (categoryId: string) => {
    return get().categories.find((c) => c.id === categoryId);
  },
  
  getCategoryByName: (categoryName: string) => {
    return get().categories.find((c) => c.name === categoryName);
  },

  addCategory: async (supabase: SupabaseClient, categoryData) => {
    try {
        const { data, error } = await supabase.from('categories').insert([categoryData]).select();
        if (error) throw error;
        set((state) => ({ categories: [data[0], ...state.categories] }));
    } catch(error: any) {
        toast({
            title: 'Error al añadir categoría',
            description: error.message,
            variant: 'destructive',
        });
    }
  },

  updateCategory: async (supabase: SupabaseClient, category) => {
    try {
        const { data, error } = await supabase.from('categories').update(category).eq('id', category.id).select();
        if (error) throw error;
        set((state) => ({
            categories: state.categories.map((c) => (c.id === category.id ? data[0] : c)),
        }));
    } catch(error: any) {
         toast({
            title: 'Error al actualizar categoría',
            description: error.message,
            variant: 'destructive',
        });
    }
  },

  deleteCategory: async (supabase: SupabaseClient, categoryId: string) => {
    try {
        const { error } = await supabase.from('categories').delete().eq('id', categoryId);
        if (error) throw error;
        set((state) => ({
            categories: state.categories.filter((c) => c.id !== categoryId),
        }));
    } catch (error: any) {
        toast({
            title: 'Error al eliminar categoría',
            description: error.message,
            variant: 'destructive',
        });
    }
  },
}));
