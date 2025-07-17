
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';

export interface Category {
  id: string;
  name: string;
  label: string;
}

// Mock Data
const mockCategories: Category[] = [
    { id: 'cat-1', name: 'skincare', label: 'Cuidado de la Piel' },
    { id: 'cat-2', name: 'makeup', label: 'Maquillaje' },
    { id: 'cat-3', name: 'haircare', label: 'Cuidado del Cabello' },
];

type CategoriesState = {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getCategoryById: (categoryId: string) => Category | undefined;
  getCategoryByName: (categoryName: string) => Category | undefined;
};

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true });
    // Simulate API call
    setTimeout(() => {
        set({ categories: mockCategories, isLoading: false });
    }, 300);
  },
  
  getCategoryById: (categoryId: string) => {
    return get().categories.find((c) => c.id === categoryId);
  },
  
  getCategoryByName: (categoryName: string) => {
    return get().categories.find((c) => c.name === categoryName);
  },

  addCategory: async (categoryData) => {
    set(produce((state: CategoriesState) => {
        const newCategory: Category = {
            id: `cat-${Date.now()}`,
            ...categoryData,
        };
        state.categories.push(newCategory);
        state.categories.sort((a,b) => a.label.localeCompare(b.label));
    }));
     toast({ title: 'Categoría añadida' });
  },

  updateCategory: async (category) => {
    set(produce((state: CategoriesState) => {
        const index = state.categories.findIndex((c) => c.id === category.id);
        if (index !== -1) {
            state.categories[index] = category;
            state.categories.sort((a,b) => a.label.localeCompare(b.label));
        }
    }));
    toast({ title: 'Categoría actualizada' });
  },

  deleteCategory: async (categoryId: string) => {
     set(produce((state: CategoriesState) => {
        state.categories = state.categories.filter((c) => c.id !== categoryId);
    }));
    toast({ title: 'Categoría eliminada', variant: 'destructive' });
  },
}));
