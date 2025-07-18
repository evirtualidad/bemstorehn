
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';

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
  fetchBanners: () => Promise<void>;
  addBanner: (banner: Omit<Banner, 'id' | 'created_at' | 'image'> & { image: File | string }) => Promise<void>;
  updateBanner: (banner: Omit<Banner, 'created_at'> & { image: File | string }) => Promise<void>;
  deleteBanner: (bannerId: string) => Promise<void>;
};

export const useBannersStore = create<BannersState>((set, get) => ({
  banners: [],
  isLoading: false,
  error: null,

  fetchBanners: async () => {
    set({ isLoading: true });
    // Simulate network delay
    setTimeout(() => {
        set({ banners: mockBanners, isLoading: false });
    }, 500);
  },

  addBanner: async (bannerData) => {
    let imageUrl = '';
    if (bannerData.image instanceof File) {
        imageUrl = URL.createObjectURL(bannerData.image);
    } else {
        imageUrl = bannerData.image; // It's a placeholder string
    }
    
    const newBanner = {
        ...bannerData,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        image: imageUrl
    };

    set(produce((state: BannersState) => {
        state.banners.unshift(newBanner);
    }));
    toast({ title: 'Banner añadido (Simulado)', description: 'El nuevo banner se ha guardado.' });
  },

  updateBanner: async (banner) => {
    let imageUrl = banner.image as string;
    if (banner.image instanceof File) {
      imageUrl = URL.createObjectURL(banner.image);
    }

    set(produce((state: BannersState) => {
        const index = state.banners.findIndex((b) => b.id === banner.id);
        if (index !== -1) {
            state.banners[index] = { ...banner, image: imageUrl, created_at: state.banners[index].created_at };
        }
    }));
    toast({ title: 'Banner actualizado (Simulado)', description: 'Los cambios se han guardado.' });
  },

  deleteBanner: async (bannerId: string) => {
    set(produce((state: BannersState) => {
        state.banners = state.banners.filter((b) => b.id !== bannerId);
    }));
    toast({ title: 'Banner eliminado (Simulado)', description: 'El banner ha sido eliminado.' });
  },
}));

useBannersStore.getState().fetchBanners();
