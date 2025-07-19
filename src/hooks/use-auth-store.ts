
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
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
      login: (email, password) => {
        try {
          // This is the definitive fix. Instead of relying on a potentially
          // non-hydrated state from another store, we read directly from the
          // source of truth: localStorage.
          const usersStorage = localStorage.getItem('users-storage');
          if (!usersStorage) {
            return 'Error interno: no se pudo encontrar el almacenamiento de usuarios.';
          }
          
          const storedData = JSON.parse(usersStorage);
          const users: UserDoc[] = storedData?.state?.users || [];

          if (users.length === 0) {
              return 'La base de datos de usuarios está vacía. Contacte al administrador.';
          }

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
        } catch (error) {
            console.error("Failed to parse user storage:", error);
            return 'Error al leer los datos de usuario.';
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
