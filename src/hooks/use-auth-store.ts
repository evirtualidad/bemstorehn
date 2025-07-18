
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserDoc } from './use-users-store';
import { useUsersStore } from './use-users-store';

export type UserRole = 'admin' | 'cajero';

// This is a simplified user object for the auth store
// as we don't need the full Firebase User object anymore.
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
  initializeAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      loading: true, // Start as loading until we check localStorage
      
      login: async (email, password) => {
        set({ loading: true });
        // Use a timeout to simulate network latency
        await new Promise(res => setTimeout(res, 300));

        // Get the most up-to-date users list directly from the other store
        const { users } = useUsersStore.getState();
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

      // This function runs on initial load to check if a user is already logged in
      initializeAuth: () => {
        const state = get();
        // If there's a user in the persisted state, we're not loading anymore.
        // If not, we're also not loading. This effectively just turns off the
        // initial loading flag.
        if (state.user) {
          set({ loading: false });
        } else {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage),
      // Only persist user and role. `loading` should be transient.
      partialize: (state) => ({ user: state.user, role: state.role }),
      // Custom onRehydrate logic to run after loading from storage
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeAuth();
        }
      }
    }
  )
);

// Initialize the store on load
useAuthStore.getState().initializeAuth();
