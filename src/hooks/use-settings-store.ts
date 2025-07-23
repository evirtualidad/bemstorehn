
'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from './use-toast';
import { supabase } from '@/lib/supabase';

type Settings = {
  id?: number;
  created_at?: string;
  tax_rate: number;
  shipping_local_cost: number;
  shipping_national_cost: number;
  pickup_address: string;
  logo_url?: string;
};

type SettingsState = {
  settings: Settings | null;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<Omit<Settings, 'id' | 'created_at'>>) => Promise<void>;
};

const defaultSettings: Settings = {
    tax_rate: 0.15,
    shipping_local_cost: 50,
    shipping_national_cost: 150,
    pickup_address: 'Col. Las Hadas, Boulevard Morazán, frente a Automall, Tegucigalpa, Honduras',
};


export const useSettingsStore = create<SettingsState>()(
  (set, get) => ({
    settings: null,
    isLoading: true,
    
    fetchSettings: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error || !data) {
            console.error('Failed to fetch settings, using defaults.', error?.message);
            set({ settings: defaultSettings, isLoading: false });
        } else {
            set({ settings: data, isLoading: false });
        }
    },

    updateSettings: async (newSettings) => {
        const { data: updatedSettings, error } = await supabase
            .from('settings')
            .update(newSettings)
            .eq('id', 1)
            .select()
            .single();

        if (error || !updatedSettings) {
            toast({ title: 'Error al guardar ajustes', description: error?.message, variant: 'destructive'});
        } else {
            set({ settings: updatedSettings });
        }
    }
  })
);

// Auto-fetch settings on initial load
if (typeof window !== 'undefined') {
    useSettingsStore.getState().fetchSettings();
}
