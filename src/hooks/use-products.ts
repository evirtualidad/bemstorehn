
'use client';

import { create } from 'zustand';
import type { Product as ProductType } from '@/lib/products';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';


export type Product = ProductType;
export type NewProductData = Omit<Product, 'id'>;

const initialProducts: Product[] = [
    // Skincare
    {
      id: 'prod-1',
      name: 'Suero Facial Vitamina C',
      image: 'https://placehold.co/400x400.png',
      aiHint: 'vitamin c serum',
      price: 750,
      description: 'Potente suero antioxidante con Vitamina C y Ácido Hialurónico para una piel radiante y uniforme.',
      category: 'skincare',
      stock: 15,
      featured: true,
    },
    {
      id: 'prod-2',
      name: 'Crema Hidratante con Ceramidas',
      image: 'https://placehold.co/400x400.png',
      aiHint: 'moisturizer jar',
      price: 650,
      description: 'Restaura la barrera de la piel y proporciona hidratación profunda sin dejar sensación grasa.',
      category: 'skincare',
      stock: 20,
    },
    // Maquillaje
    {
      id: 'prod-3',
      name: 'Base de Maquillaje Mate',
      image: 'https://placehold.co/400x400.png',
      aiHint: 'foundation bottle',
      price: 950,
      originalPrice: 1100,
      description: 'Cobertura completa con acabado mate de larga duración que controla el brillo durante todo el día.',
      category: 'makeup',
      stock: 12,
      featured: true,
    },
    {
      id: 'prod-4',
      name: 'Paleta de Sombras "Tierra"',
      image: 'https://placehold.co/400x400.png',
      aiHint: 'eyeshadow palette',
      price: 1200,
      description: '12 tonos tierra altamente pigmentados con acabados mate y satinados para looks versátiles.',
      category: 'makeup',
      stock: 8,
    },
    // Cabello
    {
      id: 'prod-5',
      name: 'Aceite Reparador de Puntas',
      image: 'https://placehold.co/400x400.png',
      aiHint: 'hair oil',
      price: 550,
      description: 'Mezcla de aceites de argán y coco para nutrir, reparar y proteger las puntas abiertas.',
      category: 'hair',
      stock: 25,
    },
    // Cuerpo
    {
      id: 'prod-6',
      name: 'Exfoliante Corporal de Café',
      image: 'https://placehold.co/400x400.png',
      aiHint: 'body scrub',
      price: 480,
      description: 'Exfolia suavemente, mejora la circulación y deja la piel suave y renovada.',
      category: 'body',
      stock: 18,
    },
];

type ProductsState = {
  products: Product[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (product: NewProductData) => Promise<string | null>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  decreaseStock: (productId: string, quantity: number) => Promise<void>;
  increaseStock: (productId: string, quantity: number) => Promise<void>;
};


export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      isLoading: false,

      fetchProducts: async () => {
          set({ isLoading: false });
      },

      getProductById: (productId: string) => {
        return get().products.find((p) => p.id === productId);
      },

      addProduct: async (productData) => {
        toast({ title: 'Añadiendo producto...' });
        const newProduct: Product = {
            ...productData,
            id: uuidv4(),
        };

        set(produce((state) => {
            state.products.unshift(newProduct);
        }));
        
        toast({ title: 'Producto añadido', description: `${productData.name} ha sido añadido.` });
        return newProduct.id;
      },

      updateProduct: async (product) => {
        toast({ title: 'Actualizando producto...' });
        set(produce(state => {
            const index = state.products.findIndex(p => p.id === product.id);
            if (index !== -1) {
                state.products[index] = product;
            }
        }));
        toast({ title: 'Producto actualizado', description: `Los cambios en ${product.name} han sido guardados.` });
      },

      deleteProduct: async (productId: string) => {
        set(produce(state => {
            state.products = state.products.filter(p => p.id !== productId);
        }));
        toast({ title: 'Producto eliminado', variant: 'destructive' });
      },

      decreaseStock: async (productId, quantity) => {
          set(produce(state => {
              const product = state.products.find(p => p.id === productId);
              if (product) {
                  product.stock -= quantity;
              }
          }));
      },

      increaseStock: async (productId, quantity) => {
         set(produce(state => {
            const product = state.products.find(p => p.id === productId);
            if (product) {
                product.stock += quantity;
            }
        }));
      },
    }),
    {
      name: 'products-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
        }
      }
    }
  )
);
