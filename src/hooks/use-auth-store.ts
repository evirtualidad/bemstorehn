
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
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  _initialize: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      loading: true,
      
      _initialize: () => {
        // This function is called once the app is mounted on the client
        // to signify that persisted state is loaded and we can stop the initial loading state.
        set({ loading: false });
      },

      login: async (email, password) => {
        // Direct look-up to the single source of truth for users.
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
        set({ user: null, role: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
            // When rehydrating, set loading to false.
            // But we use _initialize for more explicit control.
            state.loading = false;
        }
      }
    }
  )
);

// Initialize the store on client-side load.
if (typeof window !== 'undefined') {
    useAuthStore.getState()._initialize();
}
