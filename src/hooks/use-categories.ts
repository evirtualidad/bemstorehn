
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { supabaseClient } from '@/lib/supabase';

export interface Category {
  id: string; // uuid
  created_at?: string;
  name: string;
  label: string;
}

type CategoriesState = {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'created_at'>) => Promise<void>;
  updateCategory: (category: Omit<Category, 'created_at'>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getCategoryById: (categoryId: string) => Category | undefined;
  getCategoryByName: (categoryName: string) => Category | undefined;
};

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true });
    const { data, error } = await supabaseClient
      .from('categories')
      .select('*')
      .order('label', { ascending: true });

    if (error) {
      set({ error: error.message, isLoading: false });
      toast({ title: 'Error', description: 'No se pudieron cargar las categorías.', variant: 'destructive' });
    } else {
      set({ categories: data, isLoading: false });
    }
  },
  
  getCategoryById: (categoryId: string) => {
    return get().categories.find((c) => c.id === categoryId);
  },
  
  getCategoryByName: (categoryName: string) => {
    return get().categories.find((c) => c.name === categoryName);
  },

  addCategory: async (categoryData) => {
    set({ isLoading: true });
    const { data, error } = await supabaseClient
      .from('categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) {
      set({ error: error.message, isLoading: false });
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      set(produce((state: CategoriesState) => {
        state.categories.push(data as Category);
        state.categories.sort((a,b) => a.label.localeCompare(b.label));
      }));
      toast({ title: 'Categoría añadida' });
    }
    set({ isLoading: false });
  },

  updateCategory: async (category) => {
    set({ isLoading: true });
    const { data, error } = await supabaseClient
      .from('categories')
      .update({ name: category.name, label: category.label })
      .eq('id', category.id)
      .select()
      .single();
    
    if (error) {
      set({ error: error.message, isLoading: false });
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      set(produce((state: CategoriesState) => {
          const index = state.categories.findIndex((c) => c.id === category.id);
          if (index !== -1) {
              state.categories[index] = data as Category;
              state.categories.sort((a,b) => a.label.localeCompare(b.label));
          }
      }));
      toast({ title: 'Categoría actualizada' });
    }
    set({ isLoading: false });
  },

  deleteCategory: async (categoryId: string) => {
    const originalCategories = get().categories;
    // Optimistic delete
    set(produce((state: CategoriesState) => {
       state.categories = state.categories.filter((c) => c.id !== categoryId);
    }));

    const { error } = await supabaseClient
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      set({ categories: originalCategories });
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Categoría eliminada' });
    }
  },
}));
