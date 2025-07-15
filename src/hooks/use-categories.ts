
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Category {
  id: string;
  name: string;
  label: string;
}

const initialCategories: Category[] = [
    { id: 'cat_1', name: 'Skincare', label: 'Cuidado de la Piel' },
    { id: 'cat_2', name: 'Makeup', label: 'Maquillaje' },
    { id: 'cat_3', name: 'Haircare', label: 'Cuidado del Cabello' },
];

type CategoriesState = {
  categories: Category[];
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  getCategoryById: (categoryId: string) => Category | undefined;
  getCategoryByName: (categoryName: string) => Category | undefined;
};

export const useCategoriesStore = create<CategoriesState>()(
  persist(
    (set, get) => ({
      categories: initialCategories,
      addCategory: (category) => {
        set((state) => ({ categories: [category, ...state.categories] }));
      },
      updateCategory: (category) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === category.id ? category : c
          ),
        }));
      },
      deleteCategory: (categoryId) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== categoryId),
        }));
      },
      getCategoryById: (categoryId: string) => {
        return get().categories.find((c) => c.id === categoryId);
      },
      getCategoryByName: (categoryName: string) => {
        return get().categories.find((c) => c.name === categoryName);
      },
    }),
    {
      name: 'categories-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
