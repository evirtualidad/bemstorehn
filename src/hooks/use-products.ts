
'use client';

import { create } from 'zustand';
import { type Product, products as initialProducts } from '@/lib/products';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';

export type NewProductData = Omit<Product, 'id'> & { imageFile?: File };

type ProductsState = {
  products: Product[];
  isLoading: boolean;
  addProduct: (product: NewProductData) => Promise<string | null>;
  updateProduct: (product: Omit<Product, 'image'> & { id: string, image: string, imageFile?: File }) => Promise<void>;
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

      getProductById: (productId: string) => {
        return get().products.find((p) => p.id === productId);
      },

      addProduct: async (productData) => {
        const { imageFile, image, ...restData } = productData;
        
        toast({ title: 'Añadiendo producto...', description: 'Por favor espera.' });
        try {
            let imageUrl = image;
            if (imageFile) {
                imageUrl = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(imageFile);
                });
            }

            const newProduct = {
                id: uuidv4(),
                ...restData,
                image: imageUrl!,
            };

            set(produce((state) => {
                state.products.unshift(newProduct);
            }));
            
            toast({ title: 'Producto añadido', description: `${productData.name} ha sido añadido.` });
            return newProduct.id;
        } catch (error) {
            console.error("Error adding product: ", error);
            toast({ title: 'Error', description: 'No se pudo añadir el producto.', variant: 'destructive' });
            return null;
        }
      },

      updateProduct: async (product) => {
        const { id, imageFile, ...restData } = product;
        let imageUrl = product.image;

        toast({ title: 'Actualizando producto...', description: 'Por favor espera.' });
        try {
            if (imageFile) {
                 imageUrl = await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(imageFile);
                });
            }
            
            const updatedProduct = { ...restData, id, image: imageUrl };

            set(produce(state => {
                const index = state.products.findIndex(p => p.id === id);
                if (index !== -1) {
                    state.products[index] = updatedProduct;
                }
            }));

            toast({ title: 'Producto actualizado', description: `Los cambios en ${product.name} han sido guardados.` });
        } catch (error) {
             console.error("Error updating product: ", error);
             toast({ title: 'Error', description: 'No se pudo actualizar el producto.', variant: 'destructive' });
        }
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
    }
  )
);
