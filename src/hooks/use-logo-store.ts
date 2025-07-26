

'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';

const LOGO_STORAGE_PATH = 'logos';

type LogoState = {
  logoUrl: string | null;
  isLoading: boolean;
  updateLogo: (file: File) => Promise<boolean>;
};

const uploadLogoImage = async (file: File): Promise<string | null> => {
    const fileName = `${uuidv4()}-${file.name}`;
    const { data, error } = await supabase.storage
        .from(LOGO_STORAGE_PATH)
        .upload(fileName, file, { upsert: true });

    if (error) {
        toast({ title: 'Error al subir el logo', description: error.message, variant: 'destructive' });
        return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
        .from(LOGO_STORAGE_PATH)
        .getPublicUrl(data.path);

    return publicUrl;
};

const deleteLogoImage = async (imageUrl: string) => {
    if (!imageUrl || !imageUrl.includes(LOGO_STORAGE_PATH)) return;
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return;

    const { error } = await supabase.storage.from(LOGO_STORAGE_PATH).remove([fileName]);
    if (error) {
         console.error('Error deleting old logo:', error.message);
    }
}

export const useLogoStore = create<LogoState>()(
  persist(
    (set, get) => ({
        logoUrl: null,
        isLoading: true,
        
        updateLogo: async (file: File) => {
            set({ isLoading: true });
            const oldLogoUrl = get().logoUrl;
            
            const newLogoUrl = await uploadLogoImage(file);

            if (newLogoUrl) {
                const { data: updatedSettings, error } = await supabase
                    .from('settings')
                    .update({ logo_url: newLogoUrl })
                    .eq('id', 1)
                    .select('logo_url')
                    .single();

                if (error || !updatedSettings) {
                    toast({ title: 'Error al guardar el logo', description: error?.message, variant: 'destructive' });
                    await deleteLogoImage(newLogoUrl);
                    set({ isLoading: false });
                    return false;
                } else {
                    if(oldLogoUrl) await deleteLogoImage(oldLogoUrl);
                    set({ logoUrl: updatedSettings.logo_url, isLoading: false });
                    return true;
                }
            }
            set({ isLoading: false });
            return false;
        },
    }),
    {
      name: 'bem-logo-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoading = !state.logoUrl;
      }
    }
  )
);

// Subscribe to logo changes (part of settings table)
if (typeof window !== 'undefined') {
    supabase
      .channel('settings_logo')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings', filter: 'id=eq.1' }, (payload) => {
          if (payload.new.logo_url !== useLogoStore.getState().logoUrl) {
              useLogoStore.setState({ logoUrl: payload.new.logo_url, isLoading: false });
          }
      })
      .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
              const { data, error } = await supabase.from('settings').select('logo_url').eq('id', 1).single();
              if (error || !data) {
                  console.error('Error fetching initial logo:', error?.message);
                  useLogoStore.setState({ logoUrl: 'https://placehold.co/200x80.png?text=BEM+STORE', isLoading: false });
              } else {
                  useLogoStore.setState({ logoUrl: data.logo_url, isLoading: false });
              }
          }
      });
}
