
'use client';

import { create } from 'zustand';
import { useUsersStore } from './use-users-store';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'admin' | 'cajero';

export interface LocalUser {
  uid: string;
  email: string;
}

type AuthState = {
  user: LocalUser | null;
  role: UserRole | null;
  _hasHydrated: boolean;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },
      login: (email, password) => {
        // This function now directly uses the other store's state.
        // It relies on the UI waiting for hydration before calling it.
        const users = useUsersStore.getState().users;
        
        const foundUser = users.find(
          u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (foundUser) {
          set({
            user: { uid: foundUser.uid, email: foundUser.email },
            role: foundUser.role,
          });
          return null; // No error
        } else {
          return 'Correo o contraseña incorrectos.'; // Error message
        }
      },
      logout: () => {
        set({ user: null, role: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
            state.setHasHydrated(true);
        }
      },
    }
  )
);
