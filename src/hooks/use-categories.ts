
'use client';

import { create } from 'zustand';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from './use-toast';

export interface Category {
  id: string;
  name: string;
  label: string;
}

const mockCategories: Category[] = [
    { id: 'cat_001', name: 'Skincare', label: 'Cuidado de la Piel' },
    { id: 'cat_002', name: 'Makeup', label: 'Maquillaje' },
    { id: 'cat_003', name: 'Haircare', label: 'Cuidado del Cabello' },
];


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
  categories: mockCategories,
  isLoading: false,
  error: null,

  fetchCategories: async (supabase: SupabaseClient) => {
    // This is a mock implementation.
    set({ isLoading: true });
    try {
        // const { data, error } = await supabase.from('categories').select('*').order('label', { ascending: true });
        // if (error) throw error;
        set({ categories: mockCategories, isLoading: false });
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
    // This is a mock implementation.
    console.log("Adding category (mock):", categoryData);
    const newCategory = { ...categoryData, id: `cat_${Date.now()}` };
    set((state) => ({ categories: [newCategory, ...state.categories] }));
  },

  updateCategory: async (supabase: SupabaseClient, category) => {
    // This is a mock implementation.
    console.log("Updating category (mock):", category);
    set((state) => ({
      categories: state.categories.map((c) => (c.id === category.id ? category : c)),
    }));
  },

  deleteCategory: async (supabase: SupabaseClient, categoryId) => {
    // This is a mock implementation.
    console.log("Deleting category (mock):", categoryId);
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== categoryId),
    }));
  },
}));
