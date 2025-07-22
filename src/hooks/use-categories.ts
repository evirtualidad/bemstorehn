
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import type { Category } from '@/lib/types';
import { supabase } from '@/lib/supabase';

type CategoriesState = {
  categories: Category[];
  isLoading: boolean;
  fetchCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'created_at'>) => Promise<void>;
  updateCategory: (category: Omit<Category, 'created_at'>) => Promise<void>;
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
            const { data, error } = await supabase.from('categories').select('*').order('label', { ascending: true });
            if (error) {
                toast({ title: 'Error al cargar categorías', description: error.message, variant: 'destructive' });
                set({ categories: [], isLoading: false });
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
            const { data: newCategory, error } = await supabase
                .from('categories')
                .insert(categoryData)
                .select()
                .single();

            if (error) {
                toast({ title: 'Error al añadir categoría', description: error.message, variant: 'destructive' });
            } else {
                set(produce((state: CategoriesState) => {
                    state.categories.push(newCategory);
                    state.categories.sort((a, b) => a.label.localeCompare(b.label));
                }));
                toast({ title: 'Categoría añadida' });
            }
        },

        updateCategory: async (category) => {
            const { data: updatedCategory, error } = await supabase
                .from('categories')
                .update({ name: category.name, label: category.label })
                .eq('id', category.id)
                .select()
                .single();
            
            if (error) {
                toast({ title: 'Error al actualizar categoría', description: error.message, variant: 'destructive' });
            } else {
                 set(produce((state: CategoriesState) => {
                    const index = state.categories.findIndex(c => c.id === category.id);
                    if (index !== -1) {
                        state.categories[index] = updatedCategory;
                        state.categories.sort((a, b) => a.label.localeCompare(b.label));
                    }
                 }));
                 toast({ title: 'Categoría actualizada' });
            }
        },

        deleteCategory: async (categoryId: string) => {
            const { error } = await supabase.from('categories').delete().eq('id', categoryId);
            if (error) {
                 toast({ title: 'Error al eliminar categoría', description: `Asegúrate que ningún producto esté usando esta categoría. ${error.message}`, variant: 'destructive' });
            } else {
                set(produce((state: CategoriesState) => {
                    state.categories = state.categories.filter(c => c.id !== categoryId);
                }));
                toast({ title: 'Categoría eliminada', variant: 'destructive' });
            }
        },
    })
);
