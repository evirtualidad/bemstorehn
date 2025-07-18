
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


export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      loading: true, 
      
      _setLoading: (loading: boolean) => set({ loading }),

      login: async (email: string, password: string) => {
        // We no longer need a complex hydration wait. 
        // Zustand's persist middleware ensures the store is hydrated on access.
        // We can directly get the state from the users store.
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

// This ensures the loading state is correctly set on initial load
useAuthStore.getState()._setLoading(false);
