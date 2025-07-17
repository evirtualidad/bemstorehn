'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';

export interface Category {
  id: string;
  name: string;
  label: string;
}

type CategoriesState = {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getCategoryById: (categoryId: string) => Category | undefined;
  getCategoryByName: (categoryName: string) => Category | undefined;
};

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  isLoading: true,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.from('categories').select('*').order('label', { ascending: true });
      if (error) throw error;
      set({ categories: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      useToast.getState().toast({
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

  addCategory: async (categoryData) => {
    try {
      const { data, error } = await supabase.from('categories').insert([categoryData]).select();
      if (error) throw error;
      const newCategory = data[0];
      set((state) => ({ categories: [newCategory, ...state.categories] }));
    } catch (error: any) {
      useToast.getState().toast({
        title: 'Error al añadir categoría',
        description: error.message,
        variant: 'destructive',
      });
    }
  },

  updateCategory: async (category) => {
    try {
      const { error } = await supabase.from('categories').update(category).eq('id', category.id);
      if (error) throw error;
      set((state) => ({
        categories: state.categories.map((c) => (c.id === category.id ? category : c)),
      }));
    } catch (error: any) {
      useToast.getState().toast({
        title: 'Error al actualizar categoría',
        description: error.message,
        variant: 'destructive',
      });
    }
  },

  deleteCategory: async (categoryId) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (error) throw error;
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== categoryId),
      }));
    } catch (error: any) {
      useToast.getState().toast({
        title: 'Error al eliminar categoría',
        description: error.message,
        variant: 'destructive',
      });
    }
  },
}));
