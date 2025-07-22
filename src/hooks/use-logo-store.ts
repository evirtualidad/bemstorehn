
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';

type LogoState = {
  logoUrl: string | null;
  setLogoUrl: (url: string) => void;
};

const usePersistedLogoStore = create<LogoState>()(
  persist(
    (set) => ({
      logoUrl: 'https://placehold.co/200x80.png?text=BEM+STORE',
      setLogoUrl: (url: string) => set({ logoUrl: url }),
    }),
    {
      name: 'bem-logo-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Custom hook to sync state across tabs
export const useLogoStore = () => {
  const store = usePersistedLogoStore();
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'bem-logo-storage') {
        // Re-initialize the store from the new storage value
        usePersistedLogoStore.persist.rehydrate();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    setIsSynced(true); // Mark as synced after setting up listener

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Return the store's state, but ensure it's synced first
  return isSynced ? store : { logoUrl: null, setLogoUrl: store.setLogoUrl };
};
