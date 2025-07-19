
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

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
  fetchBanners: () => Promise<void>;
  addBanner: (bannerData: Omit<Banner, 'id' | 'image'> & { imageFile: File, aiHint?: string }) => Promise<void>;
  updateBanner: (banner: Banner & { imageFile?: File }) => Promise<void>;
  deleteBanner: (bannerId: string) => Promise<void>;
};

// Helper to upload image to Supabase Storage
const uploadBannerImage = async (file: File, bannerId?: string): Promise<string> => {
    const fileName = `${bannerId || uuidv4()}/${file.name}`;
    const { data, error } = await supabase.storage
        .from('banners')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true, // Overwrite if file with same name exists
        });

    if (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(data.path);

    return publicUrl;
};

export const useBannersStore = create<BannersState>((set) => ({
  banners: [],
  isLoading: true,
  
  fetchBanners: async () => {
      set({ isLoading: true });
      const { data, error } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
      if (error) {
          toast({ title: 'Error', description: 'No se pudieron cargar los banners.', variant: 'destructive' });
          console.error(error);
          set({ isLoading: false });
          return;
      }
      set({ banners: data as Banner[], isLoading: false });
  },

  addBanner: async ({ imageFile, ...bannerData }) => {
    try {
        const imageUrl = await uploadBannerImage(imageFile);
        
        const { data: newBanner, error } = await supabase
            .from('banners')
            .insert([{ ...bannerData, image: imageUrl }])
            .select()
            .single();
            
        if (error) throw error;
        
        set(produce(state => {
            state.banners.unshift(newBanner as Banner);
        }));
        toast({ title: 'Banner añadido' });
    } catch(error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        console.error(error);
    }
  },

  updateBanner: async ({ imageFile, ...banner }) => {
    try {
        let imageUrl = banner.image;
        if (imageFile) {
            imageUrl = await uploadBannerImage(imageFile, banner.id);
        }
        
        const { data: updatedBanner, error } = await supabase
            .from('banners')
            .update({ ...banner, image: imageUrl })
            .eq('id', banner.id)
            .select()
            .single();

        if (error) throw error;

        set(produce(state => {
            const index = state.banners.findIndex(b => b.id === banner.id);
            if (index !== -1) {
                state.banners[index] = updatedBanner as Banner;
            }
        }));
        toast({ title: 'Banner actualizado' });
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        console.error(error);
    }
  },

  deleteBanner: async (bannerId: string) => {
    try {
        const { error } = await supabase.from('banners').delete().eq('id', bannerId);
        if (error) throw error;

        set(produce(state => {
            state.banners = state.banners.filter(b => b.id !== bannerId);
        }));
        toast({ title: 'Banner eliminado' });
    } catch (error: any) {
        toast({ title: 'Error', description: 'No se pudo eliminar el banner.', variant: 'destructive' });
        console.error(error);
    }
  },
}));
