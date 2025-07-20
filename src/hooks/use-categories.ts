
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { initialCategories } from '@/lib/categories';
import type { Category } from '@/lib/types';
import { persist, createJSONStorage } from 'zustand/middleware';

type CategoriesState = {
  categories: Category[];
  isLoading: boolean;
  fetchCategories: () => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  getCategoryById: (categoryId: string) => Category | undefined;
  getCategoryByName: (categoryName: string) => Category | undefined;
};

export const useCategoriesStore = create<CategoriesState>()(
  persist(
    (set, get) => ({
        categories: initialCategories,
        isLoading: true,
        
        fetchCategories: () => {
            // Data is now loaded from localStorage by persist middleware
            set({ isLoading: false });
        },
        
        getCategoryById: (categoryId: string) => {
          return get().categories.find((c) => c.id === categoryId);
        },
        
        getCategoryByName: (categoryName: string) => {
          return get().categories.find((c) => c.name === categoryName);
        },

        addCategory: (categoryData) => {
            const newCategory = { ...categoryData, id: uuidv4() };
            set(state => ({ categories: [...state.categories, newCategory] }));
            toast({ title: 'Categoría añadida' });
        },

        updateCategory: (category) => {
            set(state => ({
              categories: state.categories.map(c => c.id === category.id ? category : c)
            }));
            toast({ title: 'Categoría actualizada' });
        },

        deleteCategory: (categoryId: string) => {
            set(state => ({
              categories: state.categories.filter(c => c.id !== categoryId)
            }));
            toast({ title: 'Categoría eliminada' });
        },
    }),
    {
      name: 'bem-categories-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
            state.isLoading = false;
        }
      },
    }
  )
);
