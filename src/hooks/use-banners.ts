
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isSupabaseConfigured } from '@/lib/supabase';

export interface Banner {
  id: string;
  title: string;
  description: string;
  image: string;
  aiHint?: string;
}

const initialBanners: Banner[] = [
    {
      id: 'banner-1',
      title: 'Colección Verano Radiante',
      description: 'Descubre nuestros nuevos iluminadores y bronzers para un look de verano perfecto.',
      image: 'https://placehold.co/1200x600.png',
      aiHint: 'summer cosmetics',
    },
    {
      id: 'banner-2',
      title: 'Cuidado de la Piel Natural',
      description: 'Ingredientes puros para una piel sana y luminosa. ¡Explora nuestra línea de skincare!',
      image: 'https://placehold.co/1200x600.png',
      aiHint: 'natural skincare',
    },
    {
      id: 'banner-3',
      title: 'Labiales que Enamoran',
      description: 'Nuevos tonos mate y gloss para cada ocasión. Larga duración y colores vibrantes.',
      image: 'https://placehold.co/1200x600.png',
      aiHint: 'lipstick collection',
    },
];


type BannersState = {
  banners: Banner[];
  isLoading: boolean;
  fetchBanners: () => Promise<void>;
  addBanner: (bannerData: Omit<Banner, 'id'>) => Promise<void>;
  updateBanner: (banner: Banner) => Promise<void>;
  deleteBanner: (bannerId: string) => Promise<void>;
};


export const useBannersStore = create<BannersState>()(
  persist(
    (set) => ({
      banners: initialBanners,
      isLoading: true,
      
      fetchBanners: async () => {
          if (!isSupabaseConfigured) {
            set({ banners: initialBanners, isLoading: false });
            return;
          }
          // Placeholder for fetching from Supabase in the future if needed
          set({ banners: initialBanners, isLoading: false });
      },

      addBanner: async (bannerData) => {
        const newBanner = { ...bannerData, id: uuidv4() };
        set(produce(state => {
            state.banners.unshift(newBanner);
        }));
        toast({ title: 'Banner añadido' });
      },

      updateBanner: async (banner) => {
        set(produce(state => {
            const index = state.banners.findIndex(b => b.id === banner.id);
            if (index !== -1) {
                state.banners[index] = banner;
            }
        }));
        toast({ title: 'Banner actualizado' });
      },

      deleteBanner: async (bannerId: string) => {
        set(produce(state => {
            state.banners = state.banners.filter(b => b.id !== bannerId);
        }));
        toast({ title: 'Banner eliminado' });
      },
    }),
    {
      name: 'banners-storage-v2',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = true;
          state.fetchBanners();
        }
      }
    }
  )
);
