
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Category {
  id: string; // Firestore document ID
  name: string; // The unique name/slug for the category
  label: string; // The display label
}

const initialCategories: Category[] = [
    { id: 'cat_1', name: 'skincare', label: 'Cuidado de la Piel' },
    { id: 'cat_2', name: 'makeup', label: 'Maquillaje' },
    { id: 'cat_3', name: 'haircare', label: 'Cuidado del Cabello' },
];

type CategoriesState = {
  categories: Category[];
  isLoading: boolean;
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
      name: 'categories-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
