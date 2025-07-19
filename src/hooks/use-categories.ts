
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface Category {
  id: string; 
  name: string; 
  label: string; 
}

const initialCategories: Category[] = [
    { id: 'cat-1', name: 'skincare', label: 'Skincare' },
    { id: 'cat-2', name: 'makeup', label: 'Maquillaje' },
    { id: 'cat-3', name: 'hair', label: 'Cabello' },
    { id: 'cat-4', name: 'body', label: 'Cuerpo' },
];

type CategoriesState = {
  categories: Category[];
  isLoading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getCategoryById: (categoryId: string) => Category | undefined;
  getCategoryByName: (categoryName: string) => Category | undefined;
};

export const useCategoriesStore = create<CategoriesState>()(
  persist(
    (set, get) => ({
        categories: initialCategories,
        isLoading: false,
        
        fetchCategories: async () => {
            set({ isLoading: true });
            if (!isSupabaseConfigured) {
                set({ categories: initialCategories, isLoading: false });
                return;
            }
            const { data, error } = await supabase.from('categories').select('*');
            if(error) {
                toast({ title: 'Error al cargar categorías', description: error.message, variant: 'destructive' });
                set({ categories: initialCategories, isLoading: false });
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
            const newCategory = { ...categoryData, id: uuidv4() };
            set(produce(state => {
                state.categories.push(newCategory);
            }));
            toast({ title: 'Categoría añadida' });
        },

        updateCategory: async (category) => {
            set(produce(state => {
                const index = state.categories.findIndex(c => c.id === category.id);
                if (index !== -1) {
                    state.categories[index] = category;
                }
            }));
            toast({ title: 'Categoría actualizada' });
        },

        deleteCategory: async (categoryId: string) => {
            set(produce(state => {
                state.categories = state.categories.filter(c => c.id !== categoryId);
            }));
            toast({ title: 'Categoría eliminada' });
        },
    }),
    {
      name: 'categories-storage-v3',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
