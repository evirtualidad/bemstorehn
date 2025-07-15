
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type SettingsState = {
  taxRate: number; // Stored as a decimal, e.g., 0.15 for 15%
  setTaxRate: (rate: number) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      taxRate: 0.15, // Default to 15%
      setTaxRate: (rate: number) => set({ taxRate: rate }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
