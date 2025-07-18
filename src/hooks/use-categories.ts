
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Category {
  id: string; // uuid
  created_at?: string;
  name: string;
  label: string;
}

const mockCategories: Category[] = [
    { id: 'cat_1', name: 'skincare', label: 'Cuidado de la Piel' },
    { id: 'cat_2', name: 'makeup', label: 'Maquillaje' },
    { id: 'cat_3', name: 'haircare', label: 'Cuidado del Cabello' },
];

type CategoriesState = {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  addCategory: (category: Omit<Category, 'id' | 'created_at'>) => Promise<void>;
  updateCategory: (category: Omit<Category, 'created_at'>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getCategoryById: (categoryId: string) => Category | undefined;
  getCategoryByName: (categoryName: string) => Category | undefined;
};

export const useCategoriesStore = create<CategoriesState>()(
  persist(
    (set, get) => ({
      categories: mockCategories,
      isLoading: false,
      error: null,
      
      getCategoryById: (categoryId: string) => {
        return get().categories.find((c) => c.id === categoryId);
      },
      
      getCategoryByName: (categoryName: string) => {
        return get().categories.find((c) => c.name === categoryName);
      },

      addCategory: async (categoryData) => {
        const newCategory = { ...categoryData, id: uuidv4(), created_at: new Date().toISOString() };
        set(produce((state: CategoriesState) => {
          state.categories.push(newCategory);
          state.categories.sort((a,b) => a.label.localeCompare(b.label));
        }));
        toast({ title: 'Categoría añadida' });
      },

      updateCategory: async (category) => {
        set(produce((state: CategoriesState) => {
            const index = state.categories.findIndex((c) => c.id === category.id);
            if (index !== -1) {
                state.categories[index] = { ...state.categories[index], ...category };
                state.categories.sort((a,b) => a.label.localeCompare(b.label));
            }
        }));
        toast({ title: 'Categoría actualizada' });
      },

      deleteCategory: async (categoryId: string) => {
        set(produce((state: CategoriesState) => {
          state.categories = state.categories.filter((c) => c.id !== categoryId);
        }));
        toast({ title: 'Categoría eliminada' });
      },
    }),
    {
      name: 'categories-storage-v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
