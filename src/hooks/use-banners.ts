
'use client';

import { create } from 'zustand';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from './use-toast';

export interface Banner {
  id: string;
  title: string;
  description: string;
  image: string;
  aiHint?: string;
}

const mockBanners: Banner[] = [
    {
      id: 'banner_001',
      title: 'Colección Verano Radiante',
      description: 'Descubre nuestros nuevos productos para un look fresco y luminoso esta temporada.',
      image: 'https://placehold.co/1200x600.png',
      aiHint: 'summer cosmetics',
    },
    {
      id: 'banner_002',
      title: '20% de Descuento en Skincare',
      description: 'Cuida tu piel con los mejores ingredientes y aprovecha nuestras ofertas especiales.',
      image: 'https://placehold.co/1200x600.png',
      aiHint: 'skincare sale',
    },
];

type BannersState = {
  banners: Banner[];
  isLoading: boolean;
  error: string | null;
  fetchBanners: (supabase: SupabaseClient) => Promise<void>;
  addBanner: (supabase: SupabaseClient, banner: Omit<Banner, 'id'>) => Promise<void>;
  updateBanner: (supabase: SupabaseClient, banner: Banner) => Promise<void>;
  deleteBanner: (supabase: SupabaseClient, bannerId: string) => Promise<void>;
};

export const useBannersStore = create<BannersState>((set) => ({
  banners: mockBanners,
  isLoading: false,
  error: null,

  fetchBanners: async (supabase: SupabaseClient) => {
    // This is a mock implementation.
    set({ isLoading: true });
    try {
        // const { data, error } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
        // if (error) throw error;
        set({ banners: mockBanners, isLoading: false });
    } catch (error: any) {
        set({ error: error.message, isLoading: false });
        toast({
            title: 'Error al cargar banners',
            description: error.message,
            variant: 'destructive',
        });
    }
  },

  addBanner: async (supabase: SupabaseClient, bannerData) => {
    // This is a mock implementation.
    console.log("Adding banner (mock):", bannerData);
    const newBanner = { ...bannerData, id: `banner_${Date.now()}` };
    set((state) => ({ banners: [newBanner, ...state.banners] }));
  },

  updateBanner: async (supabase: SupabaseClient, banner) => {
    // This is a mock implementation.
    console.log("Updating banner (mock):", banner);
    set((state) => ({
      banners: state.banners.map((b) => (b.id === banner.id ? banner : b)),
    }));
  },

  deleteBanner: async (supabase: SupabaseClient, bannerId) => {
    // This is a mock implementation.
    console.log("Deleting banner (mock):", bannerId);
    set((state) => ({
      banners: state.banners.filter((b) => b.id !== bannerId),
    }));
  },
}));
