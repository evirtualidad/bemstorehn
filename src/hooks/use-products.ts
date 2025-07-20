
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { products as initialProducts } from '@/lib/products';
import { type Product } from '@/lib/types';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UploadProductData = Omit<Product, 'id' | 'created_at'> & {
  imageFile?: File;
};

type ProductsState = {
  products: Product[];
  featuredProducts: Product[];
  isLoading: boolean;
  fetchProducts: () => void;
  addProduct: (productData: UploadProductData) => string | null;
  updateProduct: (product: UploadProductData & { id: string }) => void;
  deleteProduct: (productId: string) => void;
  getProductById: (productId: string) => Product | undefined;
  decreaseStock: (productId: string, quantity: number) => void;
  increaseStock: (productId: string, quantity: number) => void;
};


export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
        products: initialProducts,
        featuredProducts: initialProducts.filter(p => p.featured),
        isLoading: true,

        fetchProducts: () => {
          // With persist, we just need to recalculate derived state
          set(produce((state: ProductsState) => {
            state.featuredProducts = state.products.filter(p => p.featured);
            state.isLoading = false;
          }));
        },

        getProductById: (productId: string) => {
          return get().products.find((p) => p.id === productId);
        },

        addProduct: (productData) => {
          const { imageFile, ...rest } = productData;
          
          const newProduct: Product = {
              ...rest,
              id: uuidv4(),
              created_at: new Date().toISOString(),
              image: productData.image || 'https://placehold.co/400x400.png',
          };
          
          if (imageFile instanceof File) {
              newProduct.image = URL.createObjectURL(imageFile);
          }
          
          set(produce((state: ProductsState) => {
              state.products.unshift(newProduct);
              if (newProduct.featured) {
                state.featuredProducts.unshift(newProduct);
              }
          }));
          
          toast({ title: 'Producto añadido', description: `${newProduct.name} ha sido añadido.` });
          return newProduct.id;
        },

        updateProduct: (productData) => {
            const { imageFile, ...rest } = productData;
            
            set(produce((state: ProductsState) => {
              const productIndex = state.products.findIndex(p => p.id === productData.id);
              if (productIndex !== -1) {
                  const updatedProduct = { ...state.products[productIndex], ...rest };
                  if (imageFile instanceof File) {
                      updatedProduct.image = URL.createObjectURL(imageFile);
                  }
                  state.products[productIndex] = updatedProduct;
                  state.featuredProducts = state.products.filter(p => p.featured);
              }
            }));

            toast({ title: 'Producto actualizado', description: `Los cambios en ${productData.name} han sido guardados.` });
        },

        deleteProduct: (productId: string) => {
            set(produce((state: ProductsState) => {
                state.products = state.products.filter(p => p.id !== productId);
                state.featuredProducts = state.products.filter(p => p.featured);
            }));
            toast({ title: 'Producto eliminado', variant: 'destructive' });
        },

        decreaseStock: (productId, quantity) => {
            set(produce((state: ProductsState) => {
              const product = state.products.find(p => p.id === productId);
              if (product) {
                  product.stock -= quantity;
              }
            }));
        },

        increaseStock: (productId, quantity) => {
            set(produce((state: ProductsState) => {
              const product = state.products.find(p => p.id === productId);
              if (product) {
                  product.stock += quantity;
              }
            }));
        },
    }),
    {
      name: 'bem-products-storage',
      storage: createJSONStorage(() => localStorage),
       onRehydrateStorage: () => (state) => {
        if (state) {
            state.isLoading = false;
        }
      },
    }
  )
);
