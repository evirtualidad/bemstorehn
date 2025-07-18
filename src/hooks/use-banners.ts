
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export interface Banner {
  id: string; // Firestore document ID
  created_at?: any; // Firestore ServerTimestamp
  title: string;
  description: string;
  image: string; // URL from Firebase Storage
  imagePath?: string; // Path in Firebase Storage
  aiHint?: string;
}

// A helper type for adding a new banner, `imageFile` is used for upload
export type NewBannerData = Omit<Banner, 'id' | 'created_at'> & { imageFile: File };

type BannersState = {
  banners: Banner[];
  isLoading: boolean;
  error: string | null;
  fetchBanners: () => () => void;
  addBanner: (bannerData: NewBannerData) => Promise<void>;
  updateBanner: (banner: Banner & { imageFile?: File }) => Promise<void>;
  deleteBanner: (bannerId: string) => Promise<void>;
};


export const useBannersStore = create<BannersState>()(
    (set, get) => ({
      banners: [],
      isLoading: true,
      error: null,

      fetchBanners: () => {
        set({ isLoading: true });
        const q = query(collection(db, 'banners'), orderBy('created_at', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const banners: Banner[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
            set({ banners, isLoading: false, error: null });
        }, (error) => {
            console.error("Firebase Error: ", error);
            set({ error: "No se pudieron cargar los banners.", isLoading: false });
            toast({ title: 'Error de Red', description: 'No se pudieron cargar los banners desde Firebase.', variant: 'destructive' });
        });
        return unsubscribe;
      },

      addBanner: async (bannerData) => {
        const { imageFile, ...restData } = bannerData;

        if (!imageFile) {
            toast({ title: 'Error', description: 'Se requiere un archivo de imagen.', variant: 'destructive' });
            return;
        }

        toast({ title: 'Subiendo banner...', description: 'Por favor espera.' });
        
        try {
            // Upload image to Firebase Storage
            const imagePath = `banners/${Date.now()}_${imageFile.name}`;
            const storageRef = ref(storage, imagePath);
            await uploadBytes(storageRef, imageFile);
            const imageUrl = await getDownloadURL(storageRef);

            // Add banner to Firestore
            await addDoc(collection(db, 'banners'), {
              ...restData,
              image: imageUrl,
              imagePath: imagePath,
              created_at: serverTimestamp(),
            });

            toast({ title: 'Banner añadido', description: 'El nuevo banner se ha guardado.' });
        } catch(error) {
            console.error("Error adding banner:", error);
            toast({ title: 'Error al añadir banner', description: 'No se pudo completar la operación.', variant: 'destructive'});
        }
      },

      updateBanner: async (banner) => {
        const { id, imageFile, ...restData } = banner;
        
        let imageUrl = banner.image;
        let imagePath = banner.imagePath;

        toast({ title: 'Actualizando banner...', description: 'Por favor espera.' });

        try {
            // If a new image is provided, upload it and delete the old one
            if (imageFile) {
                if (imagePath) {
                    const oldImageRef = ref(storage, imagePath);
                    await deleteObject(oldImageRef).catch(err => console.error("Error deleting old image:", err));
                }
                imagePath = `banners/${Date.now()}_${imageFile.name}`;
                const newImageRef = ref(storage, imagePath);
                await uploadBytes(newImageRef, imageFile);
                imageUrl = await getDownloadURL(newImageRef);
            }
            
            const docRef = doc(db, 'banners', id);
            await updateDoc(docRef, {
                ...restData,
                image: imageUrl,
                imagePath: imagePath,
            });

            toast({ title: 'Banner actualizado', description: 'Los cambios se han guardado.' });
        } catch(error) {
             console.error("Error updating banner:", error);
            toast({ title: 'Error al actualizar banner', description: 'No se pudo completar la operación.', variant: 'destructive'});
        }
      },

      deleteBanner: async (bannerId: string) => {
        const bannerToDelete = get().banners.find(b => b.id === bannerId);
        if (!bannerToDelete) return;

        toast({ title: 'Eliminando banner...', description: 'Por favor espera.' });

        try {
            // Delete image from storage
            if (bannerToDelete.imagePath) {
                const imageRef = ref(storage, bannerToDelete.imagePath);
                await deleteObject(imageRef).catch(err => console.error("Failed to delete banner image:", err));
            }
            
            // Delete document from firestore
            await deleteDoc(doc(db, 'banners', bannerId));
            toast({ title: 'Banner eliminado', description: 'El banner ha sido eliminado.' });
        } catch(error) {
            console.error("Error deleting banner:", error);
            toast({ title: 'Error al eliminar banner', description: 'No se pudo completar la operación.', variant: 'destructive'});
        }
      },
    })
);

// Initialize the store by fetching data
useBannersStore.getState().fetchBanners();
