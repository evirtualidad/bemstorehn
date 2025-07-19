
'use client';

import { create } from 'zustand';
import type { Product as ProductType } from '@/lib/products';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

export type Product = ProductType;
export type NewProductData = Omit<Product, 'id' | 'image'> & { imageFile?: File };

type ProductsState = {
  products: Product[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (product: NewProductData) => Promise<string | null>;
  updateProduct: (product: Omit<Product, 'image'> & { id: string, image: string, imageFile?: File }) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  decreaseStock: (productId: string, quantity: number) => Promise<void>;
  increaseStock: (productId: string, quantity: number) => Promise<void>;
};

const uploadProductImage = async (file: File, productId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}.${fileExt}`;
    const filePath = `${productId}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);
        
    return publicUrl;
};

export const useProductsStore = create<ProductsState>()(
  (set, get) => ({
    products: [],
    isLoading: true,

    fetchProducts: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) {
            toast({ title: 'Error', description: 'No se pudieron cargar los productos.', variant: 'destructive' });
            set({ isLoading: false });
            return;
        }
        set({ products: data, isLoading: false });
    },

    getProductById: (productId: string) => {
      return get().products.find((p) => p.id === productId);
    },

    addProduct: async (productData) => {
      const { imageFile, ...restData } = productData;
      toast({ title: 'Añadiendo producto...' });
      
      try {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([restData])
          .select()
          .single();

        if (error) throw error;
        
        let imageUrl = `https://placehold.co/400x400.png?text=${encodeURIComponent(newProduct.name)}`;
        if (imageFile) {
            imageUrl = await uploadProductImage(imageFile, newProduct.id);
            const { error: updateError } = await supabase
                .from('products')
                .update({ image: imageUrl })
                .eq('id', newProduct.id);
            if (updateError) throw updateError;
            newProduct.image = imageUrl;
        }

        set(produce((state) => {
            state.products.unshift(newProduct);
        }));
        
        toast({ title: 'Producto añadido', description: `${productData.name} ha sido añadido.` });
        return newProduct.id;
      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return null;
      }
    },

    updateProduct: async (product) => {
      const { id, imageFile, ...restData } = product;
      let imageUrl = product.image;
      toast({ title: 'Actualizando producto...' });
      
      try {
        if (imageFile) {
           imageUrl = await uploadProductImage(imageFile, id);
        }
        
        const { data: updatedProduct, error } = await supabase
            .from('products')
            .update({ ...restData, image: imageUrl })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        set(produce(state => {
            const index = state.products.findIndex(p => p.id === id);
            if (index !== -1) {
                state.products[index] = updatedProduct;
            }
        }));

        toast({ title: 'Producto actualizado', description: `Los cambios en ${product.name} han sido guardados.` });
      } catch (error: any) {
         toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    },

    deleteProduct: async (productId: string) => {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) {
            toast({ title: 'Error', description: 'No se pudo eliminar el producto.', variant: 'destructive' });
            return;
        }
        set(produce(state => {
            state.products = state.products.filter(p => p.id !== productId);
        }));
        toast({ title: 'Producto eliminado', variant: 'destructive' });
    },

    decreaseStock: async (productId, quantity) => {
        const product = get().products.find(p => p.id === productId);
        if (!product) return;
        const newStock = product.stock - quantity;

        const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
        if (error) {
            console.error("Failed to update stock in DB");
            return;
        }
        set(produce(state => {
            const product = state.products.find(p => p.id === productId);
            if (product) {
                product.stock = newStock;
            }
        }));
    },

    increaseStock: async (productId, quantity) => {
       const product = get().products.find(p => p.id === productId);
       if (!product) return;
       const newStock = product.stock + quantity;

       const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
       if (error) {
           console.error("Failed to update stock in DB");
           return;
       }
       set(produce(state => {
          const product = state.products.find(p => p.id === productId);
          if (product) {
              product.stock = newStock;
          }
      }));
    },
  })
);
