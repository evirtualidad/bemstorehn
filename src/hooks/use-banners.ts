
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { supabaseClient } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';

export interface Banner {
  id: string; // uuid from supabase
  created_at?: string;
  title: string;
  description: string;
  image: string; // url from supabase storage
  aiHint?: string;
}

type BannersState = {
  banners: Banner[];
  isLoading: boolean;
  error: string | null;
  fetchBanners: () => Promise<void>;
  addBanner: (banner: Omit<Banner, 'id' | 'created_at' | 'image'> & { image: File | string }) => Promise<void>;
  updateBanner: (banner: Omit<Banner, 'created_at'> & { image: File | string }) => Promise<void>;
  deleteBanner: (bannerId: string) => Promise<void>;
};

const BUCKET_NAME = 'banners';

const uploadBannerImage = async (file: File): Promise<string> => {
    const fileName = `${uuidv4()}-${file.name}`;
    const filePath = `${fileName}`;

    const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
    };
    const compressedFile = await imageCompression(file, compressionOptions);

    const { data, error } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(filePath, compressedFile);

    if (error) {
        throw new Error(`Error uploading image: ${error.message}`);
    }

    const { data: { publicUrl } } = supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

    return publicUrl;
};

export const useBannersStore = create<BannersState>((set, get) => ({
  banners: [],
  isLoading: false,
  error: null,

  fetchBanners: async () => {
    set({ isLoading: true });
    const { data, error } = await supabaseClient
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        set({ error: error.message, isLoading: false });
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
        set({ banners: data as Banner[], isLoading: false });
    }
  },

  addBanner: async (bannerData) => {
    set({ isLoading: true });
    try {
        let imageUrl = '';
        if (bannerData.image instanceof File) {
            imageUrl = await uploadBannerImage(bannerData.image);
        }

        const { image, ...restOfData } = bannerData;

        const { data, error } = await supabaseClient
            .from('banners')
            .insert([{ ...restOfData, image: imageUrl }])
            .select()
            .single();

        if (error) throw error;
        
        set(produce((state: BannersState) => {
            state.banners.unshift(data as Banner);
        }));

        toast({ title: 'Banner añadido', description: 'El nuevo banner se ha guardado.' });
    } catch (error: any) {
        toast({ title: 'Error al añadir banner', description: error.message, variant: 'destructive' });
    } finally {
        set({ isLoading: false });
    }
  },

  updateBanner: async (banner) => {
     set({ isLoading: true });
    try {
        let imageUrl = banner.image as string;
        if (banner.image instanceof File) {
            imageUrl = await uploadBannerImage(banner.image);
        }

        const { image, ...restOfData } = banner;

        const { data, error } = await supabaseClient
            .from('banners')
            .update({ ...restOfData, image: imageUrl })
            .eq('id', banner.id)
            .select()
            .single();
        
        if (error) throw error;

        set(produce((state: BannersState) => {
            const index = state.banners.findIndex((b) => b.id === banner.id);
            if (index !== -1) {
                state.banners[index] = data as Banner;
            }
        }));

        toast({ title: 'Banner actualizado', description: 'Los cambios se han guardado.' });
    } catch (error: any) {
        toast({ title: 'Error al actualizar banner', description: error.message, variant: 'destructive' });
    } finally {
        set({ isLoading: false });
    }
  },

  deleteBanner: async (bannerId: string) => {
    const originalBanners = get().banners;
    
    // Optimistic delete
    set(produce((state: BannersState) => {
        state.banners = state.banners.filter((b) => b.id !== bannerId);
    }));

    const { error } = await supabaseClient
        .from('banners')
        .delete()
        .eq('id', bannerId);

    if (error) {
        set({ banners: originalBanners });
        toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    } else {
        toast({ title: 'Banner eliminado', description: 'El banner ha sido eliminado.' });
    }
  },
}));
