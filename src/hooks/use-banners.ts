
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { supabase } from '@/lib/supabase';
import type { Banner } from '@/lib/types';
import { persist, createJSONStorage } from 'zustand/middleware';

const BANNERS_STORAGE_PATH = 'banners';

type BannersState = {
  banners: Banner[];
  isLoading: boolean;
  addBanner: (bannerData: Omit<Banner, 'id' | 'created_at' | 'image'> & { imageFile?: File }) => Promise<void>;
  updateBanner: (bannerData: Omit<Banner, 'created_at'> & { imageFile?: File }) => Promise<void>;
  deleteBanner: (bannerId: string) => Promise<void>;
};

const uploadBannerImage = async (bannerId: string, file: File): Promise<string | null> => {
    const { data, error } = await supabase.storage
        .from(BANNERS_STORAGE_PATH)
        .upload(bannerId, file, {
            cacheControl: '3600',
            upsert: true
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

const deleteBannerImage = async (bannerId: string) => {
    const { error } = await supabase.storage
        .from(BANNERS_STORAGE_PATH)
        .remove([bannerId]);
        
    if (error) {
        toast({ title: 'Error al eliminar imagen', description: `No se pudo eliminar la imagen del banner ${bannerId}. Puede que ya no exista.`, variant: 'destructive' });
    }
}


export const useBannersStore = create<BannersState>()(
  persist(
    (set, get) => ({
        banners: [],
        isLoading: true,
        
        // Removed fetchBanners as real-time subscription will handle initial load and updates.

        addBanner: async (bannerData) => {
          const { imageFile, ...rest } = bannerData;
          
          if (!imageFile) {
              toast({ title: 'Imagen requerida', description: 'Por favor, selecciona un archivo de imagen.', variant: 'destructive' });
              return;
          }

          const { data: newBannerData, error: insertError } = await supabase
            .from('banners')
            .insert({ ...rest, image: '' }) 
            .select('id')
            .single();

          if (insertError || !newBannerData) {
              toast({ title: 'Error al crear banner (Paso 1)', description: insertError.message, variant: 'destructive' });
              return;
          }

          const newBannerId = newBannerData.id;
          const imageUrl = await uploadBannerImage(newBannerId, imageFile);

          if (!imageUrl) {
              await supabase.from('banners').delete().eq('id', newBannerId);
              toast({ title: 'Error al crear banner (Paso 2)', description: 'La subida de la imagen falló. Se canceló la operación.', variant: 'destructive' });
              return;
          }

          const { error: updateError } = await supabase
            .from('banners')
            .update({ image: imageUrl })
            .eq('id', newBannerId);
          
           if (updateError) {
              toast({ title: 'Error al crear banner (Paso 3)', description: updateError.message, variant: 'destructive' });
              await deleteBannerImage(newBannerId);
              await supabase.from('banners').delete().eq('id', newBannerId);
              return;
          }

          // The real-time listener will automatically add the banner to the state.
          toast({ title: 'Banner añadido con éxito' });
        },

        updateBanner: async (bannerData) => {
            const { imageFile, id, ...rest } = bannerData;
            let imageUrl = rest.image; 

            if (imageFile) {
                const uploadedUrl = await uploadBannerImage(id, imageFile);
                if (uploadedUrl) imageUrl = uploadedUrl;
                else return;
            }
            
            const { error } = await supabase
                .from('banners')
                .update({ ...rest, image: imageUrl })
                .eq('id', id);
            
            if (error) {
                toast({ title: 'Error al actualizar banner', description: error.message, variant: 'destructive' });
            } else {
                 // The real-time listener will automatically update the banner in the state.
                 toast({ title: 'Banner actualizado' });
            }
        },

        deleteBanner: async (bannerId: string) => {
            await deleteBannerImage(bannerId);
            const { error } = await supabase.from('banners').delete().eq('id', bannerId);
            
            if (error) {
                toast({ title: 'Error al eliminar banner', description: error.message, variant: 'destructive' });
            } else {
                 // The real-time listener will automatically remove the banner from the state.
                 toast({ title: 'Banner eliminado', variant: 'destructive' });
            }
        },
    }),
    {
      name: 'bem-banners-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoading = !state.banners.length;
      }
    }
  )
);

// Subscribe to real-time changes
if (typeof window !== 'undefined') {
  supabase
    .channel('banners')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, (payload) => {
      const { getState, setState } = useBannersStore;

      if (payload.eventType === 'INSERT') {
        setState(produce(draft => {
            draft.banners.unshift(payload.new as Banner);
            draft.banners.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        }));
      }

      if (payload.eventType === 'UPDATE') {
        setState(produce(draft => {
            const index = draft.banners.findIndex(b => b.id === payload.new.id);
            if (index !== -1) draft.banners[index] = payload.new as Banner;
        }));
      }

      if (payload.eventType === 'DELETE') {
        setState(produce(draft => {
            draft.banners = draft.banners.filter(b => b.id !== payload.old.id);
        }));
      }
    })
    .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            // Initial fetch after subscription is established
            const { data, error } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
            if (error) {
                toast({ title: 'Error al sincronizar banners', description: error.message, variant: 'destructive' });
            } else {
                useBannersStore.setState({ banners: data as Banner[], isLoading: false });
            }
        }
    });
}
