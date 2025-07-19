
'use client';

import { create } from 'zustand';
import type { Product as ProductType } from '@/lib/products';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UploadProductData } from '@/lib/products';

export type Product = ProductType;

// --- Helper function for Supabase Storage ---
const BUCKET_NAME = 'product-images';

async function uploadProductImage(file: File): Promise<string | null> {
    if (!isSupabaseConfigured) return null;

    const fileName = `${uuidv4()}-${file.name}`;
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file);

    if (error) {
        toast({ title: 'Error al subir imagen', description: error.message, variant: 'destructive' });
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);
        
    return publicUrl;
}

async function deleteProductImage(imageUrl: string): Promise<void> {
    if (!isSupabaseConfigured || !imageUrl) return;
    try {
        const url = new URL(imageUrl);
        const path = url.pathname.split(`/${BUCKET_NAME}/`)[1];
        if (path) {
            await supabase.storage.from(BUCKET_NAME).remove([path]);
        }
    } catch (error) {
        // Ignore errors (e.g., if it's a placehold.co URL)
        console.warn("Could not parse or delete image URL:", imageUrl);
    }
}


type ProductsState = {
  products: Product[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (productData: UploadProductData) => Promise<string | null>;
  updateProduct: (product: UploadProductData & { id: string }) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  decreaseStock: (productId: string, quantity: number) => Promise<void>;
  increaseStock: (productId: string, quantity: number) => Promise<void>;
};


export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: [],
      isLoading: false,

      fetchProducts: async () => {
          if (!isSupabaseConfigured) {
              set({ isLoading: false });
              return;
          }
          set({ isLoading: true });
          const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
          if (error) {
              toast({ title: 'Error al cargar productos', description: error.message, variant: 'destructive'});
          } else {
              set({ products: data as Product[] });
          }
          set({ isLoading: false });
      },

      getProductById: (productId: string) => {
        return get().products.find((p) => p.id === productId);
      },

      addProduct: async (productData) => {
        if (!isSupabaseConfigured) {
            toast({ title: 'Función no disponible sin Supabase'});
            return null;
        }

        toast({ title: 'Añadiendo producto...' });
        
        let imageUrl = productData.image; // Use existing placeholder
        if (productData.imageFile) {
            const uploadedUrl = await uploadProductImage(productData.imageFile);
            if (uploadedUrl) {
                imageUrl = uploadedUrl;
            } else {
                return null; // Stop if upload fails
            }
        }
        
        const { imageFile, ...dbData } = { ...productData, image: imageUrl };

        const { data, error } = await supabase.from('products').insert(dbData).select().single();

        if (error) {
            toast({ title: 'Error al añadir producto', description: error.message, variant: 'destructive' });
            // Clean up uploaded image if DB insert fails
            if (imageUrl && productData.imageFile) {
                await deleteProductImage(imageUrl);
            }
            return null;
        }
        
        set(produce((state) => {
            state.products.unshift(data as Product);
        }));
        
        toast({ title: 'Producto añadido', description: `${productData.name} ha sido añadido.` });
        return data.id;
      },

      updateProduct: async (productData) => {
         if (!isSupabaseConfigured) {
            toast({ title: 'Función no disponible sin Supabase'});
            return;
        }
        toast({ title: 'Actualizando producto...' });

        const originalProduct = get().products.find(p => p.id === productData.id);
        let imageUrl = productData.image;

        if (productData.imageFile) {
            const uploadedUrl = await uploadProductImage(productData.imageFile);
            if (uploadedUrl) {
                // If upload succeeds, delete the old image
                if (originalProduct?.image) {
                    await deleteProductImage(originalProduct.image);
                }
                imageUrl = uploadedUrl;
            } else {
                return; // Stop if upload fails
            }
        }
        
        const { imageFile, ...dbData } = { ...productData, image: imageUrl };
        
        const { data, error } = await supabase
            .from('products')
            .update(dbData)
            .eq('id', productData.id)
            .select()
            .single();

        if (error) {
            toast({ title: 'Error al actualizar', description: error.message, variant: 'destructive' });
        } else {
            set(produce(state => {
                const index = state.products.findIndex(p => p.id === productData.id);
                if (index !== -1) {
                    state.products[index] = data as Product;
                }
            }));
            toast({ title: 'Producto actualizado', description: `Los cambios en ${productData.name} han sido guardados.` });
        }
      },

      deleteProduct: async (productId: string) => {
        if (!isSupabaseConfigured) {
            toast({ title: 'Función no disponible sin Supabase'});
            return;
        }

        const productToDelete = get().products.find(p => p.id === productId);

        const { error } = await supabase.from('products').delete().eq('id', productId);
        
        if (error) {
            toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive'});
        } else {
            if (productToDelete?.image) {
                await deleteProductImage(productToDelete.image);
            }
            set(produce(state => {
                state.products = state.products.filter(p => p.id !== productId);
            }));
            toast({ title: 'Producto eliminado', variant: 'destructive' });
        }
      },

      decreaseStock: async (productId, quantity) => {
          if (!isSupabaseConfigured) {
              // Local fallback
              set(produce(state => {
                const product = state.products.find(p => p.id === productId);
                if (product) product.stock -= quantity;
              }));
              return;
          }
          const { error } = await supabase.rpc('decrease_stock', { product_id: productId, quantity_to_decrease: quantity });
          if (error) {
              toast({ title: 'Error al actualizar stock', description: error.message, variant: 'destructive'});
          } else {
              set(produce(state => {
                  const product = state.products.find(p => p.id === productId);
                  if (product) product.stock -= quantity;
              }));
          }
      },

      increaseStock: async (productId, quantity) => {
         if (!isSupabaseConfigured) {
              // Local fallback
              set(produce(state => {
                const product = state.products.find(p => p.id === productId);
                if (product) product.stock += quantity;
              }));
              return;
          }
           const { error } = await supabase.rpc('increase_stock', { product_id: productId, quantity_to_increase: quantity });
            if (error) {
                toast({ title: 'Error al devolver stock', description: error.message, variant: 'destructive'});
            } else {
                set(produce(state => {
                    const product = state.products.find(p => p.id === productId);
                    if (product) product.stock += quantity;
                }));
            }
      },
    }),
    {
      name: 'products-storage-v2', // Updated name to avoid conflicts with old structure
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state, error) => {
        if (state) {
          state.isLoading = false;
          // When rehydrating, immediately fetch fresh data from Supabase if configured
          if (isSupabaseConfigured) {
             state.fetchProducts();
          }
        }
      }
    }
  )
);
