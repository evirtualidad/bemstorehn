
'use client';

import { create } from 'zustand';
import type { Product } from '@/lib/products';
import { toast } from './use-toast';
import { produce } from 'immer';
import { supabaseClient } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';

type StockUpdate = {
  id: string;
  quantity: number;
}

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
  updateMultipleStocks: (updates: StockUpdate[]) => Promise<void>;
};

const BUCKET_NAME = 'products';

const uploadProductImage = async (file: File): Promise<string> => {
    const fileName = `${uuidv4()}-${file.name}`;
    const filePath = `${fileName}`;

    const compressionOptions = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
    };
    const compressedFile = await imageCompression(file, compressionOptions);

    const { data, error } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(filePath, compressedFile);

    if (error) {
        throw new Error(`Error uploading image: ${error.message}`);
    }

    const { data: { publicUrl } } = supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

    return publicUrl;
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  
  fetchProducts: async () => {
    set({ isLoading: true });
    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        set({ error: error.message, isLoading: false });
        toast({ title: 'Error', description: 'No se pudieron cargar los productos.', variant: 'destructive' });
    } else {
        set({ products: data as Product[], isLoading: false });
    }
  },

  getProductById: (productId: string) => {
    return get().products.find((p) => p.id === productId);
  },

  addProduct: async (productData) => {
    set({ isLoading: true });
    try {
        let imageUrl = '';
        if (productData.image instanceof File) {
            imageUrl = await uploadProductImage(productData.image);
        }

        const { image, ...restOfData } = productData;

        const { data, error } = await supabaseClient
            .from('products')
            .insert([{ ...restOfData, image: imageUrl }])
            .select()
            .single();
        
        if (error) throw error;
        
        const newProduct = data as Product;
        set(produce((state: ProductsState) => {
            state.products.unshift(newProduct);
        }));
        toast({ title: 'Producto añadido', description: `${newProduct.name} ha sido añadido.` });
        return newProduct;
    } catch (error: any) {
        toast({ title: 'Error al añadir producto', description: error.message, variant: 'destructive' });
        return null;
    } finally {
        set({ isLoading: false });
    }
  },

  updateProduct: async (product) => {
    set({ isLoading: true });
    try {
        let imageUrl = product.image as string;
        if (product.image instanceof File) {
            imageUrl = await uploadProductImage(product.image);
        }

        const { image, ...restOfData } = product;

        const { data, error } = await supabaseClient
            .from('products')
            .update({ ...restOfData, image: imageUrl })
            .eq('id', product.id)
            .select()
            .single();

        if (error) throw error;
        
        const updatedProduct = data as Product;
        set(produce((state: ProductsState) => {
            const index = state.products.findIndex((p) => p.id === product.id);
            if (index !== -1) {
                state.products[index] = updatedProduct;
            }
        }));
        toast({ title: 'Producto actualizado', description: `Los cambios en ${product.name} han sido guardados.` });
    } catch (error: any) {
        toast({ title: 'Error al actualizar producto', description: error.message, variant: 'destructive' });
    } finally {
        set({ isLoading: false });
    }
  },

  deleteProduct: async (productId: string) => {
    const originalProducts = get().products;
    set(produce((state: ProductsState) => {
        state.products = state.products.filter((p) => p.id !== productId);
    }));

    const { error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', productId);

    if (error) {
        set({ products: originalProducts });
        toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    } else {
        toast({ title: 'Producto eliminado', variant: 'destructive' });
    }
  },

  updateMultipleStocks: async (updates: StockUpdate[]) => {
    const { data: products, error: fetchError } = await supabaseClient
      .from('products')
      .select('id, stock')
      .in('id', updates.map(u => u.id));

    if (fetchError) throw new Error("Could not fetch products for stock update");
    
    const stockUpdatePromises = updates.map(update => {
        const product = products.find(p => p.id === update.id);
        if (!product) return Promise.resolve();

        const newStock = product.stock - update.quantity;
        return supabaseClient.from('products').update({ stock: newStock }).eq('id', update.id);
    });

    const results = await Promise.all(stockUpdatePromises);
    const someFailed = results.some(res => res.error);

    if (someFailed) {
      console.error("Some stock updates failed", results.map(r => r.error).filter(Boolean));
      throw new Error("Una o más actualizaciones de stock fallaron.");
    }
    
    // Optimistically update local state
    set(produce((state: ProductsState) => {
        updates.forEach(update => {
            const product = state.products.find(p => p.id === update.id);
            if (product) {
                product.stock -= update.quantity;
            }
        });
    }));
  },

  decreaseStock: async (productId: string, quantity: number) => {
    const product = get().products.find(p => p.id === productId);
    if (!product) return;

    const newStock = product.stock - quantity;
    
    await supabaseClient
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);
    
    set(produce((state: ProductsState) => {
        const p = state.products.find(p => p.id === productId);
        if (p) p.stock = newStock;
    }));
  },

  increaseStock: async (productId: string, quantity: number) => {
     const product = get().products.find(p => p.id === productId);
    if (!product) return;

    const newStock = product.stock + quantity;
    
    await supabaseClient
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);
    
    set(produce((state: ProductsState) => {
        const p = state.products.find(p => p.id === productId);
        if (p) p.stock = newStock;
    }));
  },
}));
