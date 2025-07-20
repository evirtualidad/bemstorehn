
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { initialBanners } from '@/lib/banners';

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

export const useBannersStore = create<BannersState>()((set) => ({
    banners: [],
    isLoading: true,
    
    fetchBanners: () => {
        set({ banners: initialBanners, isLoading: false });
    },

    addBanner: (bannerData) => {
      const newBanner: Banner = { ...bannerData, id: uuidv4() };
      initialBanners.unshift(newBanner);
      set({ banners: [...initialBanners] });
      toast({ title: 'Banner añadido' });
    },

    updateBanner: (banner) => {
      const index = initialBanners.findIndex(b => b.id === banner.id);
      if (index !== -1) {
          initialBanners[index] = banner;
          set({ banners: [...initialBanners] });
          toast({ title: 'Banner actualizado' });
      }
    },

    deleteBanner: (bannerId: string) => {
      const index = initialBanners.findIndex(b => b.id === bannerId);
      if (index !== -1) {
          initialBanners.splice(index, 1);
          set({ banners: [...initialBanners] });
          toast({ title: 'Banner eliminado' });
      }
    },
}));
