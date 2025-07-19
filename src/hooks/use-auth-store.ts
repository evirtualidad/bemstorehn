
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserDoc } from './use-users-store';

export type UserRole = 'admin' | 'cajero';

export interface LocalUser {
  uid: string;
  email: string;
}

type AuthState = {
  user: LocalUser | null;
  role: UserRole | null;
  login: (email: string, password: string) => string | null;
  logout: () => void;
};


export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      login: (email, password) => {
        // This is the definitive fix. Instead of relying on a potentially
        // non-hydrated state from another store, we read directly from the
        // source of truth: localStorage.
        try {
          const usersStorage = localStorage.getItem('users-storage');
          if (!usersStorage) {
            return 'Error interno: no se pudo encontrar el almacenamiento de usuarios.';
          }
          
          const storedData = JSON.parse(usersStorage);
          const users: UserDoc[] = storedData?.state?.users || [];

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
    }
  )
);
