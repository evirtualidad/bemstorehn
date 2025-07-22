
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
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

// --- NEW UPLOAD/DELETE LOGIC ---

// Uploads an image using the banner's ID as the filename for easy association.
const uploadBannerImage = async (bannerId: string, file: File): Promise<string | null> => {
    const { data, error } = await supabase.storage
        .from(BANNERS_STORAGE_PATH)
        .upload(bannerId, file, {
            cacheControl: '3600',
            upsert: true // Overwrite if a file with the same name exists
        });

    if (error) {
        toast({ title: 'Error al subir imagen', description: error.message, variant: 'destructive' });
        return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
        .from(BANNERS_STORAGE_PATH)
        .getPublicUrl(bannerId);

    return publicUrl;
}

// Deletes the image associated with a banner ID.
const deleteBannerImage = async (bannerId: string) => {
    const { error } = await supabase.storage
        .from(BANNERS_STORAGE_PATH)
        .remove([bannerId]);
        
    if (error) {
        toast({ title: 'Error al eliminar imagen', description: `No se pudo eliminar la imagen del banner ${bannerId}. Puede que ya no exista.`, variant: 'destructive' });
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
          
          if (!imageFile) {
              toast({ title: 'Imagen requerida', description: 'Por favor, selecciona un archivo de imagen.', variant: 'destructive' });
              return;
          }

          // Step 1: Insert banner record without image URL to get the ID
          const { data: newBannerData, error: insertError } = await supabase
            .from('banners')
            .insert({ ...rest, image: '' }) // Placeholder image URL
            .select('id')
            .single();

          if (insertError || !newBannerData) {
              toast({ title: 'Error al crear banner (Paso 1)', description: insertError.message, variant: 'destructive' });
              return;
          }

          const newBannerId = newBannerData.id;

          // Step 2: Upload image using the new banner ID
          const imageUrl = await uploadBannerImage(newBannerId, imageFile);

          if (!imageUrl) {
              // If upload fails, clean up the record we just created
              await supabase.from('banners').delete().eq('id', newBannerId);
              toast({ title: 'Error al crear banner (Paso 2)', description: 'La subida de la imagen falló. Se canceló la operación.', variant: 'destructive' });
              return;
          }

          // Step 3: Update the banner record with the final image URL
          const { data: finalBanner, error: updateError } = await supabase
            .from('banners')
            .update({ image: imageUrl })
            .eq('id', newBannerId)
            .select()
            .single();
          
           if (updateError) {
              toast({ title: 'Error al crear banner (Paso 3)', description: updateError.message, variant: 'destructive' });
              // Clean up storage and db record if final update fails
              await deleteBannerImage(newBannerId);
              await supabase.from('banners').delete().eq('id', newBannerId);
              return;
          }

          set(produce((state: BannersState) => {
              state.banners.unshift(finalBanner as Banner);
          }));
          toast({ title: 'Banner añadido con éxito' });
        },

        updateBanner: async (bannerData) => {
            const { imageFile, id, ...rest } = bannerData;
            let imageUrl = rest.image; 

            // If a new image file is provided, upload it using the existing banner ID
            if (imageFile) {
                const uploadedUrl = await uploadBannerImage(id, imageFile);
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
            // Step 1: Delete the associated image from storage
            await deleteBannerImage(bannerId);

            // Step 2: Delete the banner record from the database
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
