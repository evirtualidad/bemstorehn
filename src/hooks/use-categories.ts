
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Category {
  id: string; // Firestore document ID or mock UUID
  name: string; // The unique name/slug for the category
  label: string; // The display label
}

type CategoriesState = {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => () => void;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getCategoryById: (categoryId: string) => Category | undefined;
  getCategoryByName: (categoryName: string) => Category | undefined;
};

// Mock data for local development without Firebase
const getInitialCategories = (): Category[] => [
    { id: 'cat_1', name: 'skincare', label: 'Cuidado de la Piel' },
    { id: 'cat_2', name: 'makeup', label: 'Maquillaje' },
    { id: 'cat_3', name: 'haircare', label: 'Cuidado del Cabello' },
];

export const useCategoriesStore = create<CategoriesState>()(
  persist(
    (set, get) => ({
      categories: getInitialCategories(),
      isLoading: true,
      error: null,
      
      fetchCategories: () => {
        if (!db) {
            console.log("SIMULATION: Firebase not configured, using mock categories.");
            set({ categories: getInitialCategories(), isLoading: false });
            return () => {}; // Return an empty unsubscribe function
        }

        set({ isLoading: true });
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

      getCategoryById: (categoryId: string) => {
        return get().categories.find((c) => c.id === categoryId);
      },
      
      getCategoryByName: (categoryName: string) => {
        return get().categories.find((c) => c.name === categoryName);
      },

      addCategory: async (categoryData) => {
        if (!db) {
            const newCategory = { id: uuidv4(), ...categoryData };
            set(produce(state => { state.categories.push(newCategory) }));
            toast({ title: 'Categoría de simulación añadida.' });
            return;
        }
        await addDoc(collection(db, 'categories'), { ...categoryData, created_at: serverTimestamp() });
        toast({ title: 'Categoría añadida' });
      },

      updateCategory: async (category) => {
        if (!db) {
            set(produce(state => {
                const index = state.categories.findIndex(c => c.id === category.id);
                if (index !== -1) state.categories[index] = category;
            }));
            toast({ title: 'Categoría de simulación actualizada.' });
            return;
        }
        const { id, ...data } = category;
        const docRef = doc(db, 'categories', id);
        await updateDoc(docRef, data);
        toast({ title: 'Categoría actualizada' });
      },

      deleteCategory: async (categoryId: string) => {
        if (!db) {
            set(produce(state => {
                state.categories = state.categories.filter(c => c.id !== categoryId);
            }));
            toast({ title: 'Categoría de simulación eliminada.' });
            return;
        }
        await deleteDoc(doc(db, 'categories', categoryId));
        toast({ title: 'Categoría eliminada' });
      },
    }),
    {
      name: 'categories-storage-v1', // Unique key for local storage
      storage: createJSONStorage(() => localStorage),
       // Only persist if Firebase is not configured
      skipHydration: !!db,
    }
  )
);
