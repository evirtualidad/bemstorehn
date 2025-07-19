
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useUsersStore } from './use-users-store';

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
        // This is the definitive fix.
        // It directly gets the current state from the usersStore,
        // which includes any newly created users. This avoids all race conditions.
        const users = useUsersStore.getState().users;
        
        const foundUser = users.find(
          u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (foundUser) {
          set({
            user: { uid: foundUser.uid, email: foundUser.email },
            role: foundUser.role,
          });
          return null; // Success
        } else {
          return 'Correo o contraseña incorrectos.'; // Error
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
