
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { initialBanners } from '@/lib/banners';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Banner {
  id: string;
  title: string;
  description: string;
  image: string;
  aiHint?: string;
}

type BannersState = {
  banners: Banner[];
  isLoading: boolean;
  fetchBanners: () => void;
  addBanner: (bannerData: Omit<Banner, 'id'>) => void;
  updateBanner: (banner: Banner) => void;
  deleteBanner: (bannerId: string) => void;
};

export const useBannersStore = create<BannersState>()(
  persist(
    (set, get) => ({
        banners: initialBanners,
        isLoading: false,
        
        fetchBanners: () => {
            // Data is now loaded from localStorage by persist middleware
            set({ isLoading: false });
        },

        addBanner: (bannerData) => {
          const newBanner: Banner = { ...bannerData, id: uuidv4() };
          set(state => ({ banners: [newBanner, ...state.banners] }));
          toast({ title: 'Banner añadido' });
        },

        updateBanner: (banner) => {
          set(state => ({
            banners: state.banners.map(b => b.id === banner.id ? banner : b)
          }));
          toast({ title: 'Banner actualizado' });
        },

        deleteBanner: (bannerId: string) => {
          set(state => ({
            banners: state.banners.filter(b => b.id !== bannerId)
          }));
          toast({ title: 'Banner eliminado' });
        },
    }),
    {
      name: 'bem-banners-storage',
      storage: createJSONStorage(() => localStorage),
       onRehydrateStorage: () => (state) => {
        if (state) {
            state.isLoading = false;
        }
      },
    }
  )
);
