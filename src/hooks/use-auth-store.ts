
'use client';

import { create } from 'zustand';
import { useUsersStore, type UserDoc } from './use-users-store';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'admin' | 'cajero';

export interface LocalUser {
  uid: string;
  email: string;
}

type AuthState = {
  user: LocalUser | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      isLoading: true,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
          isLoading: false, // Stop loading once hydrated
        });
      },
      login: async (email, password) => {
        // Use the most up-to-date state from the users store
        const users = useUsersStore.getState().users;
        
        const foundUser = users.find(
          u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (foundUser) {
          set({
            user: { uid: foundUser.uid, email: foundUser.email },
            role: foundUser.role,
            isLoading: false,
          });
          return null; // No error
        } else {
          return 'Correo o contraseña incorrectos.'; // Error message
        }
      },
      logout: async () => {
        set({ user: null, role: null, isLoading: false });
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
