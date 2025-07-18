
'use client';

import { create } from 'zustand';
import type { Product } from '@/lib/products';
import { toast } from './use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

type ProductsState = {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => () => void; // Returns the unsubscribe function
  addProduct: (product: Omit<Product, 'id' | 'image'> & { imageFile: File }) => Promise<string | null>;
  updateProduct: (product: Omit<Product, 'image'> & { id: string, image: string, imageFile?: File }) => Promise<void>;
  deleteProduct: (product: Product) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  decreaseStock: (productId: string, quantity: number) => Promise<void>;
  increaseStock: (productId: string, quantity: number) => Promise<void>;
};

export const useProductsStore = create<ProductsState>()(
    (set, get) => ({
      products: [],
      isLoading: true,
      error: null,

      getProductById: (productId: string) => {
        return get().products.find((p) => p.id === productId);
      },

      fetchProducts: () => {
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

      addProduct: async (productData) => {
        const { imageFile, ...restData } = productData;
        toast({ title: 'Subiendo producto...', description: 'Por favor espera.' });

        try {
            // 1. Upload image to Firebase Storage
            const imagePath = `products/${Date.now()}_${imageFile.name}`;
            const storageRef = ref(storage, imagePath);
            await uploadBytes(storageRef, imageFile);
            const imageUrl = await getDownloadURL(storageRef);

            // 2. Add product to Firestore
            const newProductData = {
                ...restData,
                image: imageUrl,
                imagePath: imagePath // Store the path for future deletion
            };
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
        const { id, imageFile, ...restData } = product;
        let imageUrl = product.image;
        let imagePath = product.imagePath;

        toast({ title: 'Actualizando producto...', description: 'Por favor espera.' });
        
        try {
            // If a new image file is provided, upload it and delete the old one
            if (imageFile) {
                // Delete old image if it exists
                if (imagePath) {
                    const oldImageRef = ref(storage, imagePath);
                    await deleteObject(oldImageRef).catch(err => console.error("Could not delete old image, continuing...", err));
                }

                // Upload new image
                imagePath = `products/${Date.now()}_${imageFile.name}`;
                const newStorageRef = ref(storage, imagePath);
                await uploadBytes(newStorageRef, imageFile);
                imageUrl = await getDownloadURL(newStorageRef);
            }
            
            const docRef = doc(db, 'products', id);
            await updateDoc(docRef, {
                ...restData,
                image: imageUrl,
                imagePath: imagePath,
            });
            toast({ title: 'Producto actualizado', description: `Los cambios en ${product.name} han sido guardados.` });
        } catch (error) {
             console.error("Error updating product: ", error);
             toast({ title: 'Error', description: 'No se pudo actualizar el producto.', variant: 'destructive' });
        }
      },

      deleteProduct: async (product) => {
        try {
            // Delete image from storage
            if (product.imagePath) {
                const imageRef = ref(storage, product.imagePath);
                await deleteObject(imageRef);
            }
            // Delete document from Firestore
            await deleteDoc(doc(db, 'products', product.id));
            toast({ title: 'Producto eliminado', variant: 'destructive' });
        } catch (error) {
             console.error("Error deleting product: ", error);
             toast({ title: 'Error', description: 'No se pudo eliminar el producto.', variant: 'destructive' });
        }
      },

      decreaseStock: async (productId: string, quantity: number) => {
        const productRef = doc(db, 'products', productId);
        await updateDoc(productRef, {
            stock: increment(-quantity)
        });
      },

      increaseStock: async (productId: string, quantity: number) => {
        const productRef = doc(db, 'products', productId);
        await updateDoc(productRef, {
            stock: increment(quantity)
        });
      },
    })
);

// Start listening for product changes
useProductsStore.getState().fetchProducts();
