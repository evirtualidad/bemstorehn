
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import type { UserDoc, UserRole } from './use-users-store';
import { useUsersStore } from './use-users-store';
import { persist, createJSONStorage } from 'zustand/middleware';

type AuthState = {
  user: UserDoc | null;
  role: UserRole | null;
  isAuthLoading: boolean;
  initializeSession: () => void;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  createUser: (email: string, password: string, role: UserRole) => Promise<string | null>;
};

// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      isAuthLoading: true,

      initializeSession: () => {
        // With persist middleware, initialization is handled automatically.
        // We just need to turn off the loading flag.
        set({ isAuthLoading: false });
      },

      login: async (email, password) => {
        const { users } = useUsersStore.getState();
        const localUser = users.find(u => u.email === email && u.password === password);
        if (localUser) {
          const userToSave = { id: localUser.id, email: localUser.email, role: localUser.role };
          set({ user: userToSave, role: localUser.role, isAuthLoading: false });
          return null;
        }
        return "Credenciales inválidas.";
      },

      logout: () => {
        set({ user: null, role: null, isAuthLoading: false });
      },
      
      createUser: async (email, password, role) => {
        toast({ title: 'Función no disponible', description: 'La creación de usuarios debe simularse en el archivo `initialUsers` para el modo local.', variant: 'destructive'});
        return 'Función no disponible en modo local.';
      }
    }),
    {
      name: 'bem-auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthLoading = false;
        }
      }
    }
  )
);
