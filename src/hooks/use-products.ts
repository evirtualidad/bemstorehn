
'use client';

import { create } from 'zustand';
import type { Product } from '@/lib/products';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { products as mockProducts } from '@/lib/products';
import { persist, createJSONStorage } from 'zustand/middleware';

type ProductsState = {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product | null>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  decreaseStock: (productId: string, quantity: number) => Promise<void>;
  increaseStock: (productId: string, quantity: number) => Promise<void>;
};

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: mockProducts,
      isLoading: false,
      error: null,

      getProductById: (productId: string) => {
        return get().products.find((p) => p.id === productId);
      },

      addProduct: async (productData) => {
        const newProduct: Product = {
          ...productData,
          id: uuidv4(),
        };
        
        set(produce((state: ProductsState) => {
            state.products.unshift(newProduct);
        }));
        toast({ title: 'Producto añadido', description: `${newProduct.name} ha sido añadido.` });
        return newProduct;
      },

      updateProduct: async (product) => {
        set(produce((state: ProductsState) => {
            const index = state.products.findIndex((p) => p.id === product.id);
            if (index !== -1) {
                state.products[index] = { ...state.products[index], ...product };
            }
        }));
        toast({ title: 'Producto actualizado', description: `Los cambios en ${product.name} han sido guardados.` });
      },

      deleteProduct: async (productId: string) => {
        set(produce((state: ProductsState) => {
            state.products = state.products.filter((p) => p.id !== productId);
        }));
        toast({ title: 'Producto eliminado', variant: 'destructive' });
      },

      decreaseStock: async (productId: string, quantity: number) => {
        set(produce((state: ProductsState) => {
            const product = state.products.find(p => p.id === productId);
            if (product) {
                if(product.stock >= quantity) {
                    product.stock -= quantity;
                } else {
                    console.error(`Stock insuficiente para ${product.name}`);
                }
            }
        }));
      },

      increaseStock: async (productId: string, quantity: number) => {
        set(produce((state: ProductsState) => {
            const product = state.products.find(p => p.id === productId);
            if (product) {
                product.stock += quantity;
            }
        }));
      },
    }),
    {
      name: 'products-storage-v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
