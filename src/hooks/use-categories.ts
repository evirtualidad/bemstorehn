
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';

export interface Category {
  id: string; // Firestore document ID
  name: string; // The unique name/slug for the category
  label: string; // The display label
}

type CategoriesState = {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => () => void; // Returns unsubscribe function
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
      error: null,
      
      getCategoryById: (categoryId: string) => {
        return get().categories.find((c) => c.id === categoryId);
      },
      
      getCategoryByName: (categoryName: string) => {
        return get().categories.find((c) => c.name === categoryName);
      },

      fetchCategories: () => {
        const q = query(collection(db, 'categories'), orderBy('label'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
          set({ categories, isLoading: false });
        }, (error) => {
          console.error("Firebase Error: ", error);
          set({ error: "No se pudieron cargar las categorías.", isLoading: false });
        });
        return unsubscribe;
      },

      addCategory: async (categoryData) => {
        await addDoc(collection(db, 'categories'), categoryData);
        toast({ title: 'Categoría añadida' });
      },

      updateCategory: async (category) => {
        const { id, ...data } = category;
        const docRef = doc(db, 'categories', id);
        await updateDoc(docRef, data);
        toast({ title: 'Categoría actualizada' });
      },

      deleteCategory: async (categoryId: string) => {
        await deleteDoc(doc(db, 'categories', categoryId));
        toast({ title: 'Categoría eliminada' });
      },
    })
);

// Start listening to category changes when the store is initialized
useCategoriesStore.getState().fetchCategories();
