
'use client';

import { create } from 'zustand';
import type { Product } from '@/lib/products';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { products as mockProducts } from '@/lib/products';

type ProductsState = {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'> & { image: File | string }) => Promise<Product | null>;
  updateProduct: (product: Product & { image: File | string }) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  decreaseStock: (productId: string, quantity: number) => Promise<void>;
  increaseStock: (productId: string, quantity: number) => Promise<void>;
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  
  fetchProducts: async () => {
    set({ isLoading: true });
    // Simulate network delay
    setTimeout(() => {
        set({ products: mockProducts, isLoading: false });
    }, 500);
  },

  getProductById: (productId: string) => {
    return get().products.find((p) => p.id === productId);
  },

  addProduct: async (productData) => {
    let imageUrl = '';
    if (productData.image instanceof File) {
        // Create a temporary local URL for the image
        imageUrl = URL.createObjectURL(productData.image);
    } else {
        imageUrl = productData.image; // It's already a placeholder URL
    }
    
    const newProduct: Product = {
      ...productData,
      id: uuidv4(),
      image: imageUrl,
    };
    
    set(produce((state: ProductsState) => {
        state.products.unshift(newProduct);
    }));
    toast({ title: 'Producto añadido (Simulado)', description: `${newProduct.name} ha sido añadido.` });
    return newProduct;
  },

  updateProduct: async (product) => {
     let imageUrl = product.image as string;
      if (product.image instanceof File) {
          imageUrl = URL.createObjectURL(product.image);
      }

    set(produce((state: ProductsState) => {
        const index = state.products.findIndex((p) => p.id === product.id);
        if (index !== -1) {
            state.products[index] = { ...product, image: imageUrl };
        }
    }));
    toast({ title: 'Producto actualizado (Simulado)', description: `Los cambios en ${product.name} han sido guardados.` });
  },

  deleteProduct: async (productId: string) => {
    set(produce((state: ProductsState) => {
        state.products = state.products.filter((p) => p.id !== productId);
    }));
    toast({ title: 'Producto eliminado (Simulado)', variant: 'destructive' });
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
}));

useProductsStore.getState().fetchProducts();
