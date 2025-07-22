

'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const LOGO_STORAGE_PATH = 'logos';

type LogoState = {
  logoUrl: string | null;
  isLoading: boolean;
  fetchLogo: () => Promise<void>;
  updateLogo: (file: File) => Promise<boolean>;
};

const uploadLogoImage = async (file: File): Promise<string | null> => {
    const fileName = `${uuidv4()}-${file.name}`;
    const { data, error } = await supabase.storage
        .from(LOGO_STORAGE_PATH)
        .upload(fileName, file, { upsert: true }); // Use upsert for simplicity, overwrites if name collides

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
    if (!imageUrl || !imageUrl.includes(LOGO_STORAGE_PATH)) return; // Don't delete placeholders
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return;

    const { error } = await supabase.storage.from(LOGO_STORAGE_PATH).remove([fileName]);
    if (error) {
         console.error('Error deleting old logo:', error.message);
    }
}

export const useLogoStore = create<LogoState>()((set, get) => ({
    logoUrl: null,
    isLoading: true,
    
    fetchLogo: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase
            .from('settings')
            .select('logo_url')
            .eq('id', 1)
            .single();

        if (error || !data) {
            console.error('Error fetching logo:', error ? error.message : 'No settings found.');
            set({ logoUrl: 'https://placehold.co/200x80.png?text=BEM+STORE', isLoading: false });
        } else {
            set({ logoUrl: data.logo_url, isLoading: false });
        }
    },

    updateLogo: async (file: File) => {
        set({ isLoading: true });
        const oldLogoUrl = get().logoUrl;
        
        const newLogoUrl = await uploadLogoImage(file);

        if (newLogoUrl) {
            const { data: updatedSettings, error } = await supabase
                .from('settings')
                .update({ logo_url: newLogoUrl })
                .eq('id', 1)
                .select()
                .single();

            if (error || !updatedSettings) {
                toast({ title: 'Error al guardar el logo', description: error?.message, variant: 'destructive' });
                await deleteLogoImage(newLogoUrl); // Clean up uploaded image if DB update fails
                set({ isLoading: false });
                return false;
            } else {
                if(oldLogoUrl) await deleteLogoImage(oldLogoUrl); // Delete old logo after successful update
                set({ logoUrl: updatedSettings.logo_url, isLoading: false });
                return true;
            }
        }
        set({ isLoading: false });
        return false;
    },
}));

// Auto-fetch logo on initial load
if (typeof window !== 'undefined') {
    useLogoStore.getState().fetchLogo();
}
