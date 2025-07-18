
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserDoc } from './use-users-store';
import { useUsersStore } from './use-users-store';

export type UserRole = 'admin' | 'cajero';

export interface LocalUser {
  uid: string;
  email: string;
}

type AuthState = {
  user: LocalUser | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  _setLoading: (loading: boolean) => void;
};

// Helper function to wait for hydration
const waitForHydration = () => {
    return new Promise<void>(resolve => {
        const unsubscribe = useUsersStore.subscribe(state => {
            if (state._hasHydrated) {
                resolve();
                unsubscribe();
            }
        });

        // Resolve immediately if already hydrated
        if (useUsersStore.getState()._hasHydrated) {
            resolve();
            unsubscribe();
        }
    });
};


export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      loading: true, 
      
      _setLoading: (loading: boolean) => set({ loading }),

      login: async (email: string, password: string) => {
        await waitForHydration();

        const users = useUsersStore.getState().users;
        const foundUser = users.find(u => u.email === email && u.password === password);

        if (foundUser) {
          const localUser: LocalUser = {
            uid: foundUser.uid,
            email: foundUser.email,
          };
          set({ user: localUser, role: foundUser.role, loading: false });
          return null; // Success
        } else {
          set({ loading: false });
          return 'Correo o contraseña incorrectos.'; // Failure
        }
      },
      
      logout: async () => {
        set({ user: null, role: null, loading: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, role: state.role }),
      onRehydrateStorage: () => (state) => {
        if (state) {
            state._setLoading(false);
        }
      }
    }
  )
);

if (typeof window !== 'undefined') {
    useAuthStore.getState()._setLoading(false);
}
