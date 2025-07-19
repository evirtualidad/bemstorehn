
'use client';

import { create } from 'zustand';
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

// --- SIMULATED USER DATABASE ---
// This is now the single source of truth for the login function.
// It is completely independent of the user management page for stability.
const hardcodedUsers = [
    {
        uid: 'admin_user_id_simulated',
        email: 'admin@bemstore.hn',
        password: 'password',
        role: 'admin' as UserRole,
    },
    {
        uid: 'cashier_user_id_simulated',
        email: 'cajero@bemstore.hn',
        password: 'password',
        role: 'cajero' as UserRole,
    }
];

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
        // This function now uses the simple, hardcoded list above.
        // This eliminates all race conditions with the user management store.
        const foundUser = hardcodedUsers.find(
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
