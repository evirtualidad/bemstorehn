
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { supabase } from '@/lib/supabase';

export interface Category {
  id: string; 
  name: string; 
  label: string; 
}

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
  (set, get) => ({
    categories: [],
    isLoading: true,
    
    fetchCategories: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase.from('categories').select('*');
        if (error) {
            toast({ title: 'Error', description: 'No se pudieron cargar las categorías.', variant: 'destructive' });
            console.error(error);
            set({ isLoading: false });
            return;
        }
        set({ categories: data, isLoading: false });
    },
    
    getCategoryById: (categoryId: string) => {
      return get().categories.find((c) => c.id === categoryId);
    },
    
    getCategoryByName: (categoryName: string) => {
      return get().categories.find((c) => c.name === categoryName);
    },

    addCategory: async (categoryData) => {
        const { data: newCategory, error } = await supabase
            .from('categories')
            .insert([categoryData])
            .select()
            .single();

        if (error) {
            toast({ title: 'Error', description: 'No se pudo añadir la categoría.', variant: 'destructive' });
            console.error(error);
            return;
        }

        set(produce(state => {
            state.categories.push(newCategory);
        }));
        toast({ title: 'Categoría añadida' });
    },

    updateCategory: async (category) => {
        const { data: updatedCategory, error } = await supabase
            .from('categories')
            .update(category)
            .eq('id', category.id)
            .select()
            .single();

        if (error) {
            toast({ title: 'Error', description: 'No se pudo actualizar la categoría.', variant: 'destructive' });
            console.error(error);
            return;
        }

        set(produce(state => {
            const index = state.categories.findIndex(c => c.id === category.id);
            if (index !== -1) {
                state.categories[index] = updatedCategory;
            }
        }));
        toast({ title: 'Categoría actualizada' });
    },

    deleteCategory: async (categoryId: string) => {
        const { error } = await supabase.from('categories').delete().eq('id', categoryId);
        
        if (error) {
             toast({ title: 'Error', description: 'No se pudo eliminar la categoría.', variant: 'destructive' });
             console.error(error);
             return;
        }
        set(produce(state => {
            state.categories = state.categories.filter(c => c.id !== categoryId);
        }));
        toast({ title: 'Categoría eliminada' });
    },
  })
);
