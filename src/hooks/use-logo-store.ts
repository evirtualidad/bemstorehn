
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type LogoState = {
  logoUrl: string | null;
  setLogoUrl: (url: string) => void;
};

export const useLogoStore = create<LogoState>()(
  persist(
    (set) => ({
      logoUrl: 'https://placehold.co/200x80.png?text=Cosmetica', // Default placeholder
      setLogoUrl: (url: string) => set({ logoUrl: url }),
    }),
    {
      name: 'bem-logo-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
