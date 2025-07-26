
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/types';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UploadProductData = Omit<Product, 'id' | 'created_at' | 'category' > & {
  imageFile?: File;
  category_id: string;
};

const PRODUCTS_STORAGE_PATH = 'products';

const uploadProductImage = async (file: File): Promise<string | null> => {
    const fileName = `${uuidv4()}-${file.name}`;
    const { data, error } = await supabase.storage
        .from(PRODUCTS_STORAGE_PATH)
        .upload(fileName, file);

    if (error) {
        toast({ title: 'Error al subir imagen', description: error.message, variant: 'destructive' });
        return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
        .from(PRODUCTS_STORAGE_PATH)
        .getPublicUrl(data.path);

    return publicUrl;
};

const deleteProductImage = async (imageUrl: string) => {
    if (!imageUrl || !imageUrl.includes(PRODUCTS_STORAGE_PATH)) return;
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return;

    const { error } = await supabase.storage.from(PRODUCTS_STORAGE_PATH).remove([fileName]);
    if (error) {
         toast({ title: 'Error al eliminar imagen antigua', description: error.message, variant: 'destructive' });
    }
}

type ProductsState = {
  products: Product[];
  isLoading: boolean;
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
        isLoading: true,

        getProductById: (productId: string) => {
          return get().products.find((p) => p.id === productId);
        },

        addProduct: async (productData) => {
            const { imageFile, onSale, ...rest } = productData as any;
            let imageUrl = `https://placehold.co/400x400.png?text=${encodeURIComponent(rest.name)}`;

            if (imageFile) {
                const uploadedUrl = await uploadProductImage(imageFile);
                if (uploadedUrl) imageUrl = uploadedUrl;
                else return null;
            }
            
            const dbPayload = {
              ...rest,
              image: imageUrl,
              original_price: rest.original_price ? Number(rest.original_price) : undefined,
            };

            const { data: newProduct, error } = await supabase
                .from('products')
                .insert(dbPayload)
                .select()
                .single();

            if (error) {
                toast({ title: 'Error al añadir producto', description: error.message, variant: 'destructive' });
                return null;
            } else {
                 toast({ title: 'Producto añadido' });
                 return newProduct.id;
            }
        },

        updateProduct: async (productData) => {
            const { imageFile, id, onSale, ...rest } = productData as any;
            let imageUrl = rest.image;

            if (imageFile) {
                const existingProduct = get().products.find(p => p.id === id);
                if (existingProduct?.image) await deleteProductImage(existingProduct.image);
                const uploadedUrl = await uploadProductImage(imageFile);
                if (uploadedUrl) imageUrl = uploadedUrl;
                else return;
            }
            
            const dbPayload = {
              ...rest,
              image: imageUrl,
              original_price: rest.original_price && Number(rest.original_price) > 0 ? Number(rest.original_price) : null,
            };

            const { error } = await supabase
                .from('products')
                .update(dbPayload)
                .eq('id', id);
            
            if (error) {
                toast({ title: 'Error al actualizar producto', description: error.message, variant: 'destructive' });
            } else {
                 toast({ title: 'Producto actualizado' });
            }
        },

        deleteProduct: async (productId: string) => {
            const productToDelete = get().products.find(p => p.id === productId);
            if(productToDelete?.image) await deleteProductImage(productToDelete.image);

            const { error } = await supabase.from('products').delete().eq('id', productId);
            
            if (error) {
                toast({ title: 'Error al eliminar producto', description: error.message, variant: 'destructive' });
            } else {
                 toast({ title: 'Producto eliminado', variant: 'destructive' });
            }
        },

        decreaseStock: async (productId, quantity) => {
            const product = get().products.find(p => p.id === productId);
            if (!product) return;
            const newStock = product.stock - quantity;
            
            const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
            if (error) {
                toast({ title: 'Error al actualizar stock', description: error.message, variant: 'destructive' });
            }
        },

        increaseStock: async (productId, quantity) => {
            const product = get().products.find(p => p.id === productId);
            if (!product) return;
            const newStock = product.stock + quantity;

            const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
             if (error) {
                toast({ title: 'Error al actualizar stock', description: error.message, variant: 'destructive' });
            }
        },
    }),
    {
      name: 'bem-products-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoading = !state.products.length;
      }
    }
  )
);

// Subscribe to real-time changes
if (typeof window !== 'undefined') {
  supabase
    .channel('products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
      const { setState } = useProductsStore;

      if (payload.eventType === 'INSERT') {
        setState(produce(draft => {
            draft.products.unshift(payload.new as Product);
        }));
      }

      if (payload.eventType === 'UPDATE') {
        setState(produce(draft => {
            const index = draft.products.findIndex(p => p.id === payload.new.id);
            if (index !== -1) draft.products[index] = payload.new as Product;
        }));
      }

      if (payload.eventType === 'DELETE') {
        setState(produce(draft => {
            draft.products = draft.products.filter(p => p.id !== payload.old.id);
        }));
      }
    })
    .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
            if (error) {
                toast({ title: 'Error al sincronizar productos', description: error.message, variant: 'destructive' });
            } else {
                useProductsStore.setState({ products: data, isLoading: false });
            }
        }
    });
}
