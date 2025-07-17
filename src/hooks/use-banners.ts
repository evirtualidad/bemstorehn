
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';

export interface Banner {
  id: string;
  title: string;
  description: string;
  image: string;
  aiHint?: string;
}

// Mock Data
const mockBanners: Banner[] = [
    {
        id: 'banner-1',
        title: 'Nueva Colección de Verano',
        description: 'Descubre los colores vibrantes y las texturas ligeras de nuestra nueva colección.',
        image: 'https://placehold.co/1200x600.png',
        aiHint: 'summer cosmetics',
    },
    {
        id: 'banner-2',
        title: '20% de Descuento en Skincare',
        description: 'Cuida tu piel con nuestros productos estrella y obtén un 20% de descuento.',
        image: 'https://placehold.co/1200x600.png',
        aiHint: 'skincare sale',
    },
    {
        id: 'banner-3',
        title: 'Esenciales de Maquillaje',
        description: 'Todo lo que necesitas para un look perfecto, desde bases hasta labiales.',
        image: 'https://placehold.co/1200x600.png',
        aiHint: 'makeup essentials',
    }
];

type BannersState = {
  banners: Banner[];
  isLoading: boolean;
  error: string | null;
  fetchBanners: () => Promise<void>;
  addBanner: (banner: Omit<Banner, 'id'>) => Promise<void>;
  updateBanner: (banner: Banner) => Promise<void>;
  deleteBanner: (bannerId: string) => Promise<void>;
};

export const useBannersStore = create<BannersState>((set) => ({
  banners: [],
  isLoading: false,
  error: null,

  fetchBanners: async () => {
    set({ isLoading: true });
    // Simulate API call
    setTimeout(() => {
        set({ banners: mockBanners, isLoading: false });
    }, 500);
  },

  addBanner: async (bannerData) => {
    set(produce((state: BannersState) => {
        const newBanner: Banner = {
            id: `banner-${Date.now()}`,
            ...bannerData,
        };
        state.banners.unshift(newBanner);
    }));
    toast({ title: 'Banner añadido', description: 'El nuevo banner se ha guardado.' });
  },

  updateBanner: async (banner) => {
    set(produce((state: BannersState) => {
        const index = state.banners.findIndex((b) => b.id === banner.id);
        if (index !== -1) {
            state.banners[index] = banner;
        }
    }));
    toast({ title: 'Banner actualizado', description: 'Los cambios se han guardado.' });
  },

  deleteBanner: async (bannerId: string) => {
    set(produce((state: BannersState) => {
        state.banners = state.banners.filter((b) => b.id !== bannerId);
    }));
    toast({ title: 'Banner eliminado', description: 'El banner ha sido eliminado.', variant: 'destructive' });
  },
}));
