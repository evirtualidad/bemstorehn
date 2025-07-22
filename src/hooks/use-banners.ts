
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import type { Banner } from '@/lib/types';

const BANNERS_STORAGE_PATH = 'banners';

type BannersState = {
  banners: Banner[];
  isLoading: boolean;
  fetchBanners: () => Promise<void>;
  addBanner: (bannerData: Omit<Banner, 'id' | 'created_at' | 'image'> & { imageFile?: File }) => Promise<void>;
  updateBanner: (bannerData: Omit<Banner, 'created_at'> & { imageFile?: File }) => Promise<void>;
  deleteBanner: (bannerId: string) => Promise<void>;
};

const uploadBannerImage = async (file: File): Promise<string | null> => {
    const fileName = `${uuidv4()}-${file.name}`;
    const { data, error } = await supabase.storage
        .from(BANNERS_STORAGE_PATH)
        .upload(fileName, file);

    if (error) {
        toast({ title: 'Error al subir imagen', description: error.message, variant: 'destructive' });
        return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
        .from(BANNERS_STORAGE_PATH)
        .getPublicUrl(data.path);

    return publicUrl;
}

const deleteBannerImage = async (imageUrl: string) => {
    if (!imageUrl || !imageUrl.includes(BANNERS_STORAGE_PATH)) return; // Don't delete placeholders or invalid URLs
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return;

    const { error } = await supabase.storage.from(BANNERS_STORAGE_PATH).remove([fileName]);
    if (error) {
         toast({ title: 'Error al eliminar imagen antigua', description: error.message, variant: 'destructive' });
    }
}


export const useBannersStore = create<BannersState>()(
    (set, get) => ({
        banners: [],
        isLoading: true,
        
        fetchBanners: async () => {
            set({ isLoading: true });
            const { data, error } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
            if (error) {
                toast({ title: 'Error al cargar banners', description: error.message, variant: 'destructive' });
                set({ banners: [], isLoading: false });
            } else {
                set({ banners: data as Banner[], isLoading: false });
            }
        },

        addBanner: async (bannerData) => {
          const { imageFile, ...rest } = bannerData;
          let imageUrl = `https://placehold.co/1200x600.png?text=${encodeURIComponent(rest.title || 'Nuevo Banner')}`;

          if (imageFile) {
              const uploadedUrl = await uploadBannerImage(imageFile);
              if (uploadedUrl) {
                  imageUrl = uploadedUrl;
              } else {
                  return; // Stop if upload fails
              }
          }
          
          const { data: newBanner, error } = await supabase
            .from('banners')
            .insert({ ...rest, image: imageUrl })
            .select()
            .single();

          if (error) {
              toast({ title: 'Error al añadir banner', description: error.message, variant: 'destructive' });
          } else {
              set(produce((state: BannersState) => {
                  state.banners.unshift(newBanner as Banner);
              }));
              toast({ title: 'Banner añadido' });
          }
        },

        updateBanner: async (bannerData) => {
            const { imageFile, id, ...rest } = bannerData;
            let imageUrl = rest.image; // Keep original image by default

            if (imageFile) {
                const existingBanner = get().banners.find(b => b.id === id);
                if (existingBanner?.image) {
                   await deleteBannerImage(existingBanner.image);
                }
                const uploadedUrl = await uploadBannerImage(imageFile);
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                } else {
                    return; // Stop if upload fails
                }
            }
            
            const { data: updatedBanner, error } = await supabase
                .from('banners')
                .update({ ...rest, image: imageUrl })
                .eq('id', id)
                .select()
                .single();
            
            if (error) {
                toast({ title: 'Error al actualizar banner', description: error.message, variant: 'destructive' });
            } else {
                 set(produce((state: BannersState) => {
                    const index = state.banners.findIndex(b => b.id === id);
                    if (index !== -1) {
                        state.banners[index] = updatedBanner as Banner;
                    }
                 }));
                 toast({ title: 'Banner actualizado' });
            }
        },

        deleteBanner: async (bannerId: string) => {
            const bannerToDelete = get().banners.find(b => b.id === bannerId);
            if(bannerToDelete?.image) {
                await deleteBannerImage(bannerToDelete.image);
            }

            const { error } = await supabase.from('banners').delete().eq('id', bannerId);
            
            if (error) {
                toast({ title: 'Error al eliminar banner', description: error.message, variant: 'destructive' });
            } else {
                 set(produce((state: BannersState) => {
                    state.banners = state.banners.filter(b => b.id !== bannerId);
                 }));
                 toast({ title: 'Banner eliminado', variant: 'destructive' });
            }
        },
    })
);
