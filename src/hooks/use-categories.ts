
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { initialCategories } from '@/lib/categories';
import type { Category } from '@/lib/types';

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

export const useCategoriesStore = create<CategoriesState>()((set, get) => ({
    categories: [],
    isLoading: true,
    
    fetchCategories: () => {
        set({ categories: initialCategories, isLoading: false });
    },
    
    getCategoryById: (categoryId: string) => {
      return get().categories.find((c) => c.id === categoryId);
    },
    
    getCategoryByName: (categoryName: string) => {
      return get().categories.find((c) => c.name === categoryName);
    },

    addCategory: (categoryData) => {
        const newCategory = { ...categoryData, id: uuidv4() };
        initialCategories.push(newCategory);
        set({ categories: [...initialCategories] });
        toast({ title: 'Categoría añadida' });
    },

    updateCategory: (category) => {
        const index = initialCategories.findIndex(c => c.id === category.id);
        if (index !== -1) {
            initialCategories[index] = category;
            set({ categories: [...initialCategories] });
            toast({ title: 'Categoría actualizada' });
        }
    },

    deleteCategory: (categoryId: string) => {
        const index = initialCategories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            initialCategories.splice(index, 1);
            set({ categories: [...initialCategories] });
            toast({ title: 'Categoría eliminada' });
        }
    },
}));
