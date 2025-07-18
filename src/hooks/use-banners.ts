
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface Banner {
  id: string; // Firestore document ID
  created_at?: string; // Kept for compatibility, but Firestore has timestamps
  title: string;
  description: string;
  image: string; // URL from Firebase Storage
  imagePath: string; // Path in Firebase Storage
  aiHint?: string;
}

type BannersState = {
  banners: Banner[];
  isLoading: boolean;
  error: string | null;
  fetchBanners: () => () => void; // Returns the unsubscribe function
  addBanner: (banner: Omit<Banner, 'id' | 'imagePath'> & { imageFile: File }) => Promise<void>;
  updateBanner: (banner: Omit<Banner, 'imagePath'> & { imageFile?: File }) => Promise<void>;
  deleteBanner: (banner: Banner) => Promise<void>;
};

export const useBannersStore = create<BannersState>((set) => ({
  banners: [],
  isLoading: true,
  error: null,

  fetchBanners: () => {
    const q = query(collection(db, 'banners'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const banners: Banner[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
      set({ banners, isLoading: false });
    }, (error) => {
      console.error("Firebase Error: ", error);
      set({ error: "No se pudieron cargar los banners.", isLoading: false });
    });
    return unsubscribe;
  },

  addBanner: async (bannerData) => {
    const { imageFile, ...restData } = bannerData;
    toast({ title: 'Subiendo banner...', description: 'Por favor espera.' });
    
    // Upload image
    const imagePath = `banners/${Date.now()}_${imageFile.name}`;
    const storageRef = ref(storage, imagePath);
    await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(storageRef);

    // Add banner to Firestore
    await addDoc(collection(db, 'banners'), {
      ...restData,
      image: imageUrl,
      imagePath: imagePath,
      created_at: new Date().toISOString(),
    });

    toast({ title: 'Banner añadido', description: 'El nuevo banner se ha guardado.' });
  },

  updateBanner: async (banner) => {
    const { id, imageFile, ...restData } = banner;
    let imageUrl = banner.image;
    let imagePath = banner.imagePath;

    toast({ title: 'Actualizando banner...', description: 'Por favor espera.' });

    // If a new image is provided, upload it and delete the old one
    if (imageFile) {
        // Delete old image
        if (imagePath) {
            const oldImageRef = ref(storage, imagePath);
            await deleteObject(oldImageRef).catch(err => console.error("Error deleting old image:", err));
        }
        // Upload new image
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
  },

  deleteBanner: async (banner) => {
    // Delete image from storage
    if (banner.imagePath) {
        const imageRef = ref(storage, banner.imagePath);
        await deleteObject(imageRef).catch(err => console.error("Failed to delete banner image:", err));
    }
    
    // Delete document from firestore
    await deleteDoc(doc(db, 'banners', banner.id));
    toast({ title: 'Banner eliminado', description: 'El banner ha sido eliminado.' });
  },
}));

// Initialize the listener when the app loads
useBannersStore.getState().fetchBanners();
