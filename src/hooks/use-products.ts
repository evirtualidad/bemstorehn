
'use client';

import { create } from 'zustand';
import type { Product } from '@/lib/products';
import { toast } from './use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { products as mockProducts } from '@/lib/products';
import { persist, createJSONStorage } from 'zustand/middleware';

// Helper type for adding a new product
export type NewProductData = Omit<Product, 'id' | 'image' | 'aiHint'> & { imageFile: File, aiHint?: string };

type ProductsState = {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => () => void;
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
      products: mockProducts,
      isLoading: true,
      error: null,

      fetchProducts: () => {
        if (!db) {
            console.log("SIMULATION: Firebase not configured, using mock products.");
            set({ products: mockProducts, isLoading: false });
            return () => {}; // Return an empty unsubscribe function
        }
        
        set({ isLoading: true });
        const q = query(collection(db, 'products'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            set({ products, isLoading: false });
        }, (error) => {
            console.error("Firebase Error fetching products:", error);
            set({ error: "No se pudieron cargar los productos.", isLoading: false });
        });
        return unsubscribe;
      },

      getProductById: (productId: string) => {
        return get().products.find((p) => p.id === productId);
      },

      addProduct: async (productData) => {
        const { imageFile, ...restData } = productData;
        
        if (!db || !storage) {
            console.log("SIMULATION: Adding mock product.");
            const newProduct: Product = {
                id: uuidv4(),
                ...restData,
                image: URL.createObjectURL(imageFile),
            };
            set(produce(state => { state.products.push(newProduct) }));
            toast({ title: 'Producto (sim) añadido.' });
            return newProduct.id;
        }

        toast({ title: 'Subiendo producto...', description: 'Por favor espera.' });
        try {
            const imagePath = `products/${Date.now()}_${imageFile.name}`;
            const storageRef = ref(storage, imagePath);
            await uploadBytes(storageRef, imageFile);
            const imageUrl = await getDownloadURL(storageRef);

            const newProductData = { ...restData, image: imageUrl, imagePath };
            const docRef = await addDoc(collection(db, 'products'), newProductData);
            
            toast({ title: 'Producto añadido', description: `${productData.name} ha sido añadido.` });
            return docRef.id;
        } catch (error) {
            console.error("Error adding product: ", error);
            toast({ title: 'Error', description: 'No se pudo añadir el producto.', variant: 'destructive' });
            return null;
        }
      },

      updateProduct: async (product) => {
         if (!db || !storage) {
            console.log("SIMULATION: Updating mock product.");
            const { imageFile, ...restData } = product;
            set(produce(state => {
                const index = state.products.findIndex(p => p.id === product.id);
                if (index !== -1) {
                    const updatedProduct = { ...state.products[index], ...restData };
                    if (imageFile) {
                        updatedProduct.image = URL.createObjectURL(imageFile);
                    }
                    state.products[index] = updatedProduct;
                }
            }));
            toast({ title: 'Producto (sim) actualizado.' });
            return;
        }
        
        const { id, imageFile, ...restData } = product;
        let imageUrl = product.image;
        let imagePath = product.imagePath;

        toast({ title: 'Actualizando producto...', description: 'Por favor espera.' });
        try {
            if (imageFile) {
                if (imagePath) {
                    const oldImageRef = ref(storage, imagePath);
                    await deleteObject(oldImageRef).catch(err => console.error("Could not delete old image, continuing...", err));
                }
                imagePath = `products/${Date.now()}_${imageFile.name}`;
                const newStorageRef = ref(storage, imagePath);
                await uploadBytes(newStorageRef, imageFile);
                imageUrl = await getDownloadURL(newStorageRef);
            }
            
            const docRef = doc(db, 'products', id);
            await updateDoc(docRef, { ...restData, image: imageUrl, imagePath: imagePath });
            toast({ title: 'Producto actualizado', description: `Los cambios en ${product.name} han sido guardados.` });
        } catch (error) {
             console.error("Error updating product: ", error);
             toast({ title: 'Error', description: 'No se pudo actualizar el producto.', variant: 'destructive' });
        }
      },

      deleteProduct: async (productId: string) => {
        const productToDelete = get().products.find(p => p.id === productId);

        if (!db || !storage) {
            console.log("SIMULATION: Deleting mock product.");
            set(produce(state => {
                state.products = state.products.filter(p => p.id !== productId);
            }));
            toast({ title: 'Producto (sim) eliminado.', variant: 'destructive' });
            return;
        }
        
        if (!productToDelete) return;

        try {
            if (productToDelete.imagePath) {
                await deleteObject(ref(storage, productToDelete.imagePath));
            }
            await deleteDoc(doc(db, 'products', productId));
            toast({ title: 'Producto eliminado', variant: 'destructive' });
        } catch (error) {
             console.error("Error deleting product: ", error);
             toast({ title: 'Error', description: 'No se pudo eliminar el producto.', variant: 'destructive' });
        }
      },

      decreaseStock: async (productId, quantity) => {
        if (!db) {
             set(produce(state => {
                 const product = state.products.find(p => p.id === productId);
                 if (product) product.stock -= quantity;
             }));
             return;
        }
        await updateDoc(doc(db, 'products', productId), { stock: increment(-quantity) });
      },

      increaseStock: async (productId, quantity) => {
         if (!db) {
             set(produce(state => {
                 const product = state.products.find(p => p.id === productId);
                 if (product) product.stock += quantity;
             }));
             return;
        }
        await updateDoc(doc(db, 'products', productId), { stock: increment(quantity) });
      },
    }),
    {
      name: 'products-storage-v1', // Unique key for local storage
      storage: createJSONStorage(() => localStorage),
       // Only persist if Firebase is not configured
      skipHydration: !!db,
    }
  )
);
