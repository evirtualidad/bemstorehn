
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/lib/types';
import { useCategoriesStore } from './use-categories';

export type UploadProductData = Omit<Product, 'id' | 'created_at' | 'category' > & {
  imageFile?: File;
  category_id: string;
};

const PRODUCTS_STORAGE_PATH = 'products';

// Helper function to upload product image
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
    if (!imageUrl || !imageUrl.includes(PRODUCTS_STORAGE_PATH)) return; // Don't delete placeholders
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return;

    const { error } = await supabase.storage.from(PRODUCTS_STORAGE_PATH).remove([fileName]);
    if (error) {
         toast({ title: 'Error al eliminar imagen antigua', description: error.message, variant: 'destructive' });
    }
}


type ProductsState = {
  products: Product[];
  featuredProducts: Product[];
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
    (set, get) => ({
        products: [],
        featuredProducts: [],
        isLoading: true,

        fetchProducts: async () => {
          set({ isLoading: true });
          const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                category:categories ( name )
            `)
            .order('created_at', { ascending: false });

          if (error) {
              toast({ title: 'Error al cargar productos', description: error.message, variant: 'destructive' });
              set({ products: [], isLoading: false });
          } else {
              const formattedProducts = data.map(p => ({ ...p, category: (p.category as any)?.name || 'uncategorized', original_price: p.original_price === 0 ? undefined : p.original_price }));
              set({ 
                  products: formattedProducts, 
                  featuredProducts: formattedProducts.filter(p => p.featured),
                  isLoading: false 
                });
          }
        },

        getProductById: (productId: string) => {
          return get().products.find((p) => p.id === productId);
        },

        addProduct: async (productData) => {
            const { imageFile, ...rest } = productData;
            let imageUrl = `https://placehold.co/400x400.png?text=${encodeURIComponent(rest.name)}`;

            if (imageFile) {
                const uploadedUrl = await uploadProductImage(imageFile);
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                } else {
                    return null; // Stop if upload fails
                }
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
                 const categoryName = useCategoriesStore.getState().getCategoryById(newProduct.category_id)?.name || 'uncategorized';
                 const formattedProduct = { ...newProduct, category: categoryName };

                 set(produce((state: ProductsState) => {
                    state.products.unshift(formattedProduct);
                    if (formattedProduct.featured) {
                        state.featuredProducts.unshift(formattedProduct);
                    }
                 }));
                 toast({ title: 'Producto añadido', description: `${newProduct.name} ha sido añadido.` });
                 return newProduct.id;
            }
        },

        updateProduct: async (productData) => {
            const { imageFile, id, ...rest } = productData;
            let imageUrl = rest.image; // Keep original image by default

            if (imageFile) {
                const existingProduct = get().products.find(p => p.id === id);
                if (existingProduct?.image) {
                   await deleteProductImage(existingProduct.image);
                }
                const uploadedUrl = await uploadProductImage(imageFile);
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                } else {
                    return; // Stop if upload fails
                }
            }
            
            const dbPayload = {
              ...rest,
              image: imageUrl,
              original_price: rest.original_price ? Number(rest.original_price) : undefined,
            };

            const { data: updatedProduct, error } = await supabase
                .from('products')
                .update(dbPayload)
                .eq('id', id)
                .select()
                .single();
            
            if (error) {
                toast({ title: 'Error al actualizar producto', description: error.message, variant: 'destructive' });
            } else {
                const categoryName = useCategoriesStore.getState().getCategoryById(updatedProduct.category_id)?.name || 'uncategorized';
                const formattedProduct = { ...updatedProduct, category: categoryName };

                 set(produce((state: ProductsState) => {
                    const index = state.products.findIndex(p => p.id === id);
                    if (index !== -1) {
                        state.products[index] = formattedProduct;
                        state.featuredProducts = state.products.filter(p => p.featured);
                    }
                 }));
                 toast({ title: 'Producto actualizado', description: `Los cambios en ${updatedProduct.name} han sido guardados.` });
            }
        },

        deleteProduct: async (productId: string) => {
            const productToDelete = get().products.find(p => p.id === productId);
            if(productToDelete?.image) {
                await deleteProductImage(productToDelete.image);
            }

            const { error } = await supabase.from('products').delete().eq('id', productId);
            
            if (error) {
                toast({ title: 'Error al eliminar producto', description: error.message, variant: 'destructive' });
            } else {
                 set(produce((state: ProductsState) => {
                    state.products = state.products.filter(p => p.id !== productId);
                    state.featuredProducts = state.products.filter(p => p.featured);
                 }));
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
            } else {
                set(produce((state: ProductsState) => {
                    const p = state.products.find(p => p.id === productId);
                    if (p) p.stock = newStock;
                }));
            }
        },

        increaseStock: async (productId, quantity) => {
            const product = get().products.find(p => p.id === productId);
            if (!product) return;
            const newStock = product.stock + quantity;

            const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId);
             if (error) {
                toast({ title: 'Error al actualizar stock', description: error.message, variant: 'destructive' });
            } else {
                set(produce((state: ProductsState) => {
                    const p = state.products.find(p => p.id === productId);
                    if (p) p.stock = newStock;
                }));
            }
        },
    })
);


