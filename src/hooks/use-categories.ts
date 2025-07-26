
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import type { Category } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { persist, createJSONStorage } from 'zustand/middleware';

type CategoriesState = {
  categories: Category[];
  isLoading: boolean;
  addCategory: (category: Omit<Category, 'id' | 'created_at'>) => Promise<void>;
  updateCategory: (category: Omit<Category, 'created_at'>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getCategoryById: (categoryId: string) => Category | undefined;
  getCategoryByName: (categoryName: string) => Category | undefined;
};

export const useCategoriesStore = create<CategoriesState>()(
  persist(
    (set, get) => ({
        categories: [],
        isLoading: true,
        
        getCategoryById: (categoryId: string) => {
          return get().categories.find((c) => c.id === categoryId);
        },
        
        getCategoryByName: (categoryName: string) => {
          return get().categories.find((c) => c.name === categoryName);
        },

        addCategory: async (categoryData) => {
            const { error } = await supabase
                .from('categories')
                .insert(categoryData);

            if (error) {
                toast({ title: 'Error al añadir categoría', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Categoría añadida' });
            }
        },

        updateCategory: async (category) => {
            const { error } = await supabase
                .from('categories')
                .update({ name: category.name, label: category.label })
                .eq('id', category.id);
            
            if (error) {
                toast({ title: 'Error al actualizar categoría', description: error.message, variant: 'destructive' });
            } else {
                 toast({ title: 'Categoría actualizada' });
            }
        },

        deleteCategory: async (categoryId: string) => {
            const { error } = await supabase.from('categories').delete().eq('id', categoryId);
            if (error) {
                 toast({ title: 'Error al eliminar categoría', description: `Asegúrate que ningún producto esté usando esta categoría. ${error.message}`, variant: 'destructive' });
            } else {
                toast({ title: 'Categoría eliminada', variant: 'destructive' });
            }
        },
    }),
    {
      name: 'bem-categories-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoading = !state.categories.length;
      }
    }
  )
);

// Subscribe to real-time changes
if (typeof window !== 'undefined') {
  supabase
    .channel('categories')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
      const { setState } = useCategoriesStore;

      if (payload.eventType === 'INSERT') {
        setState(produce(draft => {
            draft.categories.push(payload.new as Category);
            draft.categories.sort((a, b) => a.label.localeCompare(b.label));
        }));
      }

      if (payload.eventType === 'UPDATE') {
        setState(produce(draft => {
            const index = draft.categories.findIndex(c => c.id === payload.new.id);
            if (index !== -1) draft.categories[index] = payload.new as Category;
            draft.categories.sort((a, b) => a.label.localeCompare(b.label));
        }));
      }

      if (payload.eventType === 'DELETE') {
        setState(produce(draft => {
            draft.categories = draft.categories.filter(c => c.id !== payload.old.id);
        }));
      }
    })
    .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            const { data, error } = await supabase.from('categories').select('*').order('label', { ascending: true });
            if (error) {
                toast({ title: 'Error al sincronizar categorías', description: error.message, variant: 'destructive' });
            } else {
                useCategoriesStore.setState({ categories: data, isLoading: false });
            }
        }
    });
}
