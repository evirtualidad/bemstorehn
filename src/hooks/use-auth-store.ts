
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { UserDoc, UserRole } from './use-users-store';
import { useUsersStore, initialUsers } from './use-users-store';

type AuthState = {
  user: UserDoc | null;
  role: UserRole | null;
  isAuthLoading: boolean;
  initializeSession: () => void;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  createUser: (email: string, password: string, role: UserRole) => Promise<string | null>;
};

let sessionInitialized = false;

// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    role: null,
    isAuthLoading: true,

    initializeSession: () => {
        if (sessionInitialized) {
            set({ isAuthLoading: false });
            return;
        }
        sessionInitialized = true;
        
        // For local mode, we check if a user is "logged in" via localStorage
        const storedUser = localStorage.getItem('loggedInUser');
        if (storedUser) {
            const user: UserDoc = JSON.parse(storedUser);
            set({ user, role: user.role, isAuthLoading: false });
        } else {
            set({ isAuthLoading: false });
        }
    },

    login: async (email, password) => {
        const localUser = initialUsers.find(u => u.email === email && u.password === password);
        if (localUser) {
            const userToSave = { id: localUser.id, email: localUser.email, role: localUser.role };
            localStorage.setItem('loggedInUser', JSON.stringify(userToSave));
            set({ user: userToSave, role: localUser.role, isAuthLoading: false });
            return null;
        }
        return "Credenciales inválidas.";
    },

    logout: () => {
        localStorage.removeItem('loggedInUser');
        set({ user: null, role: null, isAuthLoading: false });
    },
    
    createUser: async (email, password, role) => {
        toast({ title: 'Función no disponible', description: 'La creación de usuarios debe simularse en el archivo `initialUsers` para el modo local.', variant: 'destructive'});
        return 'Función no disponible en modo local.';
    }
}));
