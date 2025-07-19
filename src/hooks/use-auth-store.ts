
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UserDoc, UserRole } from './use-users-store';
import { useUsersStore } from './use-users-store';
import { Session } from '@supabase/supabase-js';

type AuthState = {
  user: UserDoc | null;
  role: UserRole | null;
  isLoading: boolean;
  initializeSession: () => void;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  createUser: (email: string, password: string, role: UserRole) => Promise<string | null>;
};

function getUserRoleFromSession(session: Session | null): UserRole | null {
    if (!session?.user?.id) {
        return null;
    }
    return (session.user.user_metadata?.role as UserRole) || null;
}

let sessionInitialized = false;

// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    role: null,
    isLoading: true,

    initializeSession: () => {
        if (sessionInitialized) {
            set({ isLoading: false });
            return;
        }
        sessionInitialized = true;

        if (!isSupabaseConfigured) {
          console.log("Auth: Supabase not configured. Running in local mode.");
          set({ isLoading: false });
          return;
        }
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          const userRole = getUserRoleFromSession(session);
          set({ 
              user: session ? { id: session.user.id, email: session.user.email || '', role: userRole || 'cajero' } : null,
              role: userRole,
              isLoading: false 
          });
        });
        
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                const userRole = getUserRoleFromSession(session);
                set({ 
                    user: { id: session.user.id, email: session.user.email || '', role: userRole || 'cajero' },
                    role: userRole, 
                });
            }
            set({ isLoading: false });
        });

        return () => {
            subscription?.unsubscribe();
        };
    },

    login: async (email, password) => {
        if (!isSupabaseConfigured) {
          const localUsers = useUsersStore.getState().users;
          const localUser = localUsers.find(u => u.email === email && u.password === password);
          if(localUser) {
              set({ user: localUser, role: localUser.role, isLoading: false });
              return null;
          }
          set({ isLoading: false });
          return "Credenciales inválidas (modo local).";
        }
        
        set({ isLoading: true });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          set({ isLoading: false });
          if (error.message.includes('Invalid login credentials')) {
              return 'Credenciales de inicio de sesión inválidas.';
          }
           if (error.message.includes('Email not confirmed')) {
              return 'Por favor, confirma tu correo electrónico antes de iniciar sesión.';
          }
          return error.message;
        }
        
        // The onAuthStateChange listener will handle setting the user and isLoading to false
        return null;
    },

    logout: async () => {
        if (isSupabaseConfigured) {
            await supabase.auth.signOut();
        }
        set({ user: null, role: null, isLoading: false });
    },
    
    createUser: async (email, password, role) => {
        if (!isSupabaseConfigured) {
            toast({ title: 'Función no disponible', description: 'La creación de usuarios requiere conexión a Supabase.', variant: 'destructive'});
            return 'Supabase no configurado.';
        }
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role,
            }
          }
        });

        if (error) {
            return error.message;
        }
        
        setTimeout(() => useUsersStore.getState().fetchUsers(), 2000);
        
        return null;
    }
}));
