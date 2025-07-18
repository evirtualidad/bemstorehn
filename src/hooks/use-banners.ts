
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Banner {
  id: string; // uuid
  created_at?: string;
  title: string;
  description: string;
  image: string; // url
  aiHint?: string;
}

const mockBanners: Banner[] = [
    {
        id: 'banner_1',
        created_at: new Date().toISOString(),
        title: 'Colección Esencial de Verano',
        description: 'Descubre nuestros productos más vendidos para un look fresco y radiante.',
        image: 'https://placehold.co/1200x600.png',
        aiHint: 'summer cosmetics'
    },
    {
        id: 'banner_2',
        created_at: new Date().toISOString(),
        title: '20% de Descuento en Skincare',
        description: 'Cuida tu piel con nuestras mejores ofertas de la temporada.',
        image: 'https://placehold.co/1200x600.png',
        aiHint: 'skincare products'
    },
    {
        id: 'banner_3',
        created_at: new Date().toISOString(),
        title: 'Nuevos Tonos de Labiales',
        description: 'Colores vibrantes y de larga duración para cualquier ocasión.',
        image: 'https://placehold.co/1200x600.png',
        aiHint: 'lipstick collection'
    }
];

type BannersState = {
  banners: Banner[];
  isLoading: boolean;
  error: string | null;
  addBanner: (banner: Omit<Banner, 'id' | 'created_at'>) => Promise<void>;
  updateBanner: (banner: Banner) => Promise<void>;
  deleteBanner: (bannerId: string) => Promise<void>;
};

export const useBannersStore = create<BannersState>()(
  persist(
    (set, get) => ({
      banners: mockBanners,
      isLoading: false,
      error: null,

      addBanner: async (bannerData) => {
        const newBanner = {
            ...bannerData,
            id: uuidv4(),
            created_at: new Date().toISOString(),
        };

        set(produce((state: BannersState) => {
            state.banners.unshift(newBanner);
        }));
        toast({ title: 'Banner añadido', description: 'El nuevo banner se ha guardado.' });
      },

      updateBanner: async (banner) => {
        set(produce((state: BannersState) => {
            const index = state.banners.findIndex((b) => b.id === banner.id);
            if (index !== -1) {
                state.banners[index] = { ...state.banners[index], ...banner };
            }
        }));
        toast({ title: 'Banner actualizado', description: 'Los cambios se han guardado.' });
      },

      deleteBanner: async (bannerId: string) => {
        set(produce((state: BannersState) => {
            state.banners = state.banners.filter((b) => b.id !== bannerId);
        }));
        toast({ title: 'Banner eliminado', description: 'El banner ha sido eliminado.' });
      },
    }),
    {
      name: 'banners-storage-v2',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
