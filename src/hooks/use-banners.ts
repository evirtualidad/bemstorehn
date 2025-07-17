
'use client';

import { create } from 'zustand';
import { SupabaseClient } from '@supabase/supabase-js';
import { useToast } from './use-toast';

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
  error: string | null;
  fetchBanners: (supabase: SupabaseClient) => Promise<void>;
  addBanner: (supabase: SupabaseClient, banner: Omit<Banner, 'id'>) => Promise<void>;
  updateBanner: (supabase: SupabaseClient, banner: Banner) => Promise<void>;
  deleteBanner: (supabase: SupabaseClient, bannerId: string) => Promise<void>;
};

export const useBannersStore = create<BannersState>((set) => ({
  banners: [],
  isLoading: true,
  error: null,

  fetchBanners: async (supabase: SupabaseClient) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      set({ banners: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      useToast.getState().toast({
        title: 'Error al cargar banners',
        description: error.message,
        variant: 'destructive',
      });
    }
  },

  addBanner: async (supabase: SupabaseClient, bannerData) => {
    try {
      const { data, error } = await supabase.from('banners').insert([bannerData]).select();
      if (error) throw error;
      const newBanner = data[0];
      set((state) => ({ banners: [newBanner, ...state.banners] }));
    } catch (error: any) {
       useToast.getState().toast({
        title: 'Error al añadir banner',
        description: error.message,
        variant: 'destructive',
      });
    }
  },

  updateBanner: async (supabase: SupabaseClient, banner) => {
    try {
      const { error } = await supabase.from('banners').update(banner).eq('id', banner.id);
      if (error) throw error;
      set((state) => ({
        banners: state.banners.map((b) => (b.id === banner.id ? banner : b)),
      }));
    } catch (error: any) {
      useToast.getState().toast({
        title: 'Error al actualizar banner',
        description: error.message,
        variant: 'destructive',
      });
    }
  },

  deleteBanner: async (supabase: SupabaseClient, bannerId) => {
    try {
      const { error } = await supabase.from('banners').delete().eq('id', bannerId);
      if (error) throw error;
      set((state) => ({
        banners: state.banners.filter((b) => b.id !== bannerId),
      }));
    } catch (error: any)      {
      useToast.getState().toast({
        title: 'Error al eliminar banner',
        description: error.message,
        variant: 'destructive',
      });
    }
  },
}));
