
'use client';

import { create } from 'zustand';
import type { Product } from '@/lib/products';
import { toast } from './use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, increment, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { produce } from 'immer';

// Helper type for adding a new product
export type NewProductData = Omit<Product, 'id'> & { imageFile?: File };

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
    (set, get) => ({
      products: [],
      isLoading: true,
      error: null,

      fetchProducts: () => {
        set({ isLoading: true });
        const q = query(collection(db, 'products'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            set({ products, isLoading: false, error: null });
        }, (error) => {
            console.error("Firebase Error fetching products:", error);
            set({ error: "No se pudieron cargar los productos.", isLoading: false });
            toast({ title: 'Error de Red', description: 'No se pudieron cargar los productos desde Firebase.', variant: 'destructive' });
        });
        return unsubscribe;
      },

      getProductById: (productId: string) => {
        return get().products.find((p) => p.id === productId);
      },

      addProduct: async (productData) => {
        const { imageFile, ...restData } = productData;
        
        toast({ title: 'Añadiendo producto...', description: 'Por favor espera.' });
        try {
            let imageUrl = productData.image;
            let imagePath: string | undefined = undefined;

            if (imageFile) {
                imagePath = `products/${Date.now()}_${imageFile.name}`;
                const storageRef = ref(storage, imagePath);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            const newProductDataForDb = { 
              ...restData, 
              image: imageUrl, 
              imagePath: imagePath, 
              created_at: serverTimestamp() 
            };
            
            // Clean up optional fields so they are not `undefined` or `null` in Firestore
            if (!newProductDataForDb.aiHint) {
              delete (newProductDataForDb as Partial<typeof newProductDataForDb>).aiHint;
            }
            if (newProductDataForDb.originalPrice === null || newProductDataForDb.originalPrice === undefined) {
              delete (newProductDataForDb as any).originalPrice;
            }
            if (newProductDataForDb.imagePath === undefined) {
              delete (newProductDataForDb as any).imagePath;
            }

            const docRef = await addDoc(collection(db, 'products'), newProductDataForDb);
            
            toast({ title: 'Producto añadido', description: `${productData.name} ha sido añadido.` });
            return docRef.id;
        } catch (error) {
            console.error("Error adding product: ", error);
            toast({ title: 'Error', description: 'No se pudo añadir el producto.', variant: 'destructive' });
            return null;
        }
      },

      updateProduct: async (product) => {
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
            const dataToUpdate = { ...restData, image: imageUrl, imagePath: imagePath };

            if (dataToUpdate.originalPrice === null || dataToUpdate.originalPrice === undefined) {
                delete (dataToUpdate as any).originalPrice;
            }
            if (!dataToUpdate.aiHint) {
              delete (dataToUpdate as Partial<typeof dataToUpdate>).aiHint;
            }
            if (dataToUpdate.imagePath === undefined) {
              delete (dataToUpdate as any).imagePath;
            }

            await updateDoc(docRef, dataToUpdate);
            toast({ title: 'Producto actualizado', description: `Los cambios en ${product.name} han sido guardados.` });
        } catch (error) {
             console.error("Error updating product: ", error);
             toast({ title: 'Error', description: 'No se pudo actualizar el producto.', variant: 'destructive' });
        }
      },

      deleteProduct: async (productId: string) => {
        const productToDelete = get().products.find(p => p.id === productId);
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
        await updateDoc(doc(db, 'products', productId), { stock: increment(-quantity) });
      },

      increaseStock: async (productId, quantity) => {
        await updateDoc(doc(db, 'products', productId), { stock: increment(quantity) });
      },
    })
);

// Initialize the store by fetching data
useProductsStore.getState().fetchProducts();
