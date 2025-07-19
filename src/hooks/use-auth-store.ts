
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { useUsersStore } from './use-users-store';
import type { UserDoc } from './use-users-store';

export type UserRole = 'admin' | 'cajero';

type AuthState = {
  user: UserDoc | null;
  role: UserRole | null;
  isLoading: boolean;
  initializeSession: () => void;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  createUser: (email: string, password: string, role: UserRole) => Promise<string | null>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    role: null,
    isLoading: true, // Start as loading

    initializeSession: () => {
        try {
            const storedUser = localStorage.getItem('auth-user');
            if (storedUser) {
                const user: UserDoc = JSON.parse(storedUser);
                set({ user, role: user.role, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error("Failed to parse auth user from localStorage", error);
            set({ isLoading: false });
        }
    },

    login: async (email, password) => {
        set({ isLoading: true });
        
        // This is a local-only authentication system.
        // It relies on the users loaded into useUsersStore.
        await useUsersStore.getState().fetchUsers(); // Ensure users are loaded
        const users = useUsersStore.getState().users;
        
        const foundUser = users.find(u => u.email === email && u.password === password);
        
        if (foundUser) {
            set({ user: foundUser, role: foundUser.role, isLoading: false });
            try {
                localStorage.setItem('auth-user', JSON.stringify(foundUser));
            } catch (error) {
                 console.error("Failed to save auth user to localStorage", error);
            }
            return null; // Success
        } else {
            set({ isLoading: false });
            return "Credenciales inválidas.";
        }
    },

    logout: () => {
        try {
            localStorage.removeItem('auth-user');
        } catch (error) {
            console.error("Failed to remove auth user from localStorage", error);
        }
        set({ user: null, role: null, isLoading: false });
    },
    
    createUser: async (email, password, role) => {
        const result = await useUsersStore.getState().addUser({ email, password, role });
        if (result) {
            toast({ title: 'Usuario Creado', description: 'El nuevo usuario ha sido creado exitosamente.' });
            return null;
        } else {
             toast({ title: 'Error al crear usuario', description: 'El correo electrónico ya está en uso.', variant: 'destructive' });
            return 'El correo electrónico ya está en uso.';
        }
    }
}));
