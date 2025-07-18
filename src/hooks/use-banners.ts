
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Banner {
  id: string;
  title: string;
  description: string;
  image: string;
  aiHint?: string;
}

const initialBanners: Banner[] = [
    {
        id: 'banner_1',
        title: 'Novedades de Verano',
        description: 'Descubre nuestra nueva colección de temporada, llena de color y frescura.',
        image: 'https://placehold.co/1200x600.png',
        aiHint: 'summer cosmetics',
    },
    {
        id: 'banner_2',
        title: '20% de Descuento en Skincare',
        description: 'Cuida tu piel con los mejores productos y aprovecha nuestras ofertas especiales.',
        image: 'https://placehold.co/1200x600.png',
        aiHint: 'skincare products',
    },
    {
        id: 'banner_3',
        title: 'Esenciales de Maquillaje',
        description: 'Todo lo que necesitas para un look perfecto, desde bases hasta labiales.',
        image: 'https://placehold.co/1200x600.png',
        aiHint: 'makeup essentials',
    },
];

type BannersState = {
  banners: Banner[];
  isLoading: boolean;
  addBanner: (bannerData: Omit<Banner, 'id'>) => Promise<void>;
  updateBanner: (banner: Banner) => Promise<void>;
  deleteBanner: (bannerId: string) => Promise<void>;
};

export const useBannersStore = create<BannersState>()(
  persist(
    (set, get) => ({
      banners: initialBanners,
      isLoading: false,

      addBanner: async (bannerData) => {
        const newBanner: Banner = {
          id: uuidv4(),
          ...bannerData,
        };
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
      name: 'banners-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
