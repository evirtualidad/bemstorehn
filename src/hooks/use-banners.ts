
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Banner {
  id: string; // Firestore document ID or mock UUID
  created_at?: string; 
  title: string;
  description: string;
  image: string; // URL from Firebase Storage or a placeholder
  imagePath?: string; // Path in Firebase Storage
  aiHint?: string;
}

// A helper type for adding a new banner, `imageFile` is used for upload
export type NewBannerData = Omit<Banner, 'id'> & { imageFile?: File };

type BannersState = {
  banners: Banner[];
  isLoading: boolean;
  error: string | null;
  fetchBanners: () => () => void;
  addBanner: (bannerData: NewBannerData) => Promise<void>;
  updateBanner: (banner: Banner & { imageFile?: File }) => Promise<void>;
  deleteBanner: (bannerId: string) => Promise<void>;
};

// Mock data for local development without Firebase
const getInitialBanners = (): Banner[] => [
    {
      id: 'banner_1',
      title: 'Cosmética Natural, Resultados Reales',
      description: 'Descubre el poder de la naturaleza en tu piel. Ingredientes puros para un brillo saludable.',
      image: 'https://placehold.co/1200x600.png',
      aiHint: 'natural cosmetics',
    },
    {
      id: 'banner_2',
      title: 'Ofertas de Verano',
      description: '¡Hasta 25% de descuento en productos seleccionados! Prepara tu piel para el sol.',
      image: 'https://placehold.co/1200x600.png',
      aiHint: 'summer sale skincare',
    },
    {
      id: 'banner_3',
      title: 'Lanzamiento: Serum Renovador',
      description: 'Experimenta una piel visiblemente más joven y radiante con nuestro nuevo serum de noche.',
      image: 'https://placehold.co/1200x600.png',
      aiHint: 'skincare serum bottle',
    },
];

export const useBannersStore = create<BannersState>()(
  persist(
    (set, get) => ({
      banners: getInitialBanners(),
      isLoading: true,
      error: null,

      fetchBanners: () => {
        if (!db) {
          console.log("SIMULATION: Firebase not configured, using mock banners.");
          set({ banners: getInitialBanners(), isLoading: false });
          return () => {}; // Return an empty unsubscribe function
        }

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

        if (!db || !storage) {
            console.log("SIMULATION: Adding mock banner.");
            const newBanner: Banner = {
                id: uuidv4(),
                ...restData,
                image: imageFile ? URL.createObjectURL(imageFile) : 'https://placehold.co/1200x600.png',
                created_at: new Date().toISOString(),
            };
            set(produce(state => { state.banners.unshift(newBanner); }));
            toast({ title: 'Banner de simulación añadido.' });
            return;
        }

        if (!imageFile) {
            toast({ title: 'Error', description: 'Se requiere un archivo de imagen.', variant: 'destructive' });
            return;
        }

        toast({ title: 'Subiendo banner...', description: 'Por favor espera.' });
        
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
      },

      updateBanner: async (banner) => {
        const { id, imageFile, ...restData } = banner;
        
        if (!db || !storage) {
            console.log("SIMULATION: Updating mock banner.");
            set(produce(state => {
                const index = state.banners.findIndex(b => b.id === id);
                if (index !== -1) {
                    const updatedBanner = { ...state.banners[index], ...restData };
                    if (imageFile) {
                        updatedBanner.image = URL.createObjectURL(imageFile);
                    }
                    state.banners[index] = updatedBanner;
                }
            }));
            toast({ title: 'Banner de simulación actualizado.' });
            return;
        }

        let imageUrl = banner.image;
        let imagePath = banner.imagePath;

        toast({ title: 'Actualizando banner...', description: 'Por favor espera.' });

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
      },

      deleteBanner: async (bannerId: string) => {
        const bannerToDelete = get().banners.find(b => b.id === bannerId);

        if (!db || !storage) {
            console.log("SIMULATION: Deleting mock banner.");
            set(produce(state => {
                state.banners = state.banners.filter(b => b.id !== bannerId);
            }));
            toast({ title: 'Banner de simulación eliminado.' });
            return;
        }

        if (!bannerToDelete) return;

        // Delete image from storage
        if (bannerToDelete.imagePath) {
            const imageRef = ref(storage, bannerToDelete.imagePath);
            await deleteObject(imageRef).catch(err => console.error("Failed to delete banner image:", err));
        }
        
        // Delete document from firestore
        await deleteDoc(doc(db, 'banners', bannerId));
        toast({ title: 'Banner eliminado', description: 'El banner ha sido eliminado.' });
      },
    }),
    {
      name: 'banners-storage-v1', // Unique key for local storage
      storage: createJSONStorage(() => localStorage),
       // Only persist if Firebase is not configured
      skipHydration: !!db,
    }
  )
);
