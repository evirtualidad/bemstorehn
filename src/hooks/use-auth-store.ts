
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UserDoc, UserRole } from './use-users-store';
import { useUsersStore, initialUsers } from './use-users-store';
import { Session } from '@supabase/supabase-js';

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
export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    role: null,
    isAuthLoading: true,

    initializeSession: () => {
        if (sessionInitialized) return;
        sessionInitialized = true;

        if (!isSupabaseConfigured) {
          console.log("Auth: Supabase not configured. Running in local mode.");
          set({ isAuthLoading: false });
          return;
        }
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                const userRole = (session.user.user_metadata?.role as UserRole) || 'cajero';
                set({ 
                    user: { id: session.user.id, email: session.user.email || '', role: userRole },
                    role: userRole,
                    isAuthLoading: false 
                });
            } else {
                set({ user: null, role: null, isAuthLoading: false });
            }
        });
        
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                const userRole = (session.user.user_metadata?.role as UserRole) || 'cajero';
                set({ 
                    user: { id: session.user.id, email: session.user.email || '', role: userRole },
                    role: userRole, 
                });
            }
            set({ isAuthLoading: false });
        });

        return () => {
            subscription?.unsubscribe();
        };
    },

    login: async (email, password) => {
        if (!isSupabaseConfigured) {
          const localUser = initialUsers.find(u => u.email === email && u.password === password);
          if(localUser) {
              set({ user: localUser, role: localUser.role, isAuthLoading: false });
              return null;
          }
          return "Credenciales inválidas (modo local).";
        }
        
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
              return 'Credenciales de inicio de sesión inválidas.';
          }
           if (error.message.includes('Email not confirmed')) {
              return 'Por favor, confirma tu correo electrónico antes de iniciar sesión.';
          }
          return error.message;
        }
        
        return null;
    },

    logout: async () => {
        set({ user: null, role: null, isAuthLoading: false });
        if (isSupabaseConfigured) {
            await supabase.auth.signOut();
        }
    },
    
    createUser: async (email, password, role) => {
        if (!isSupabaseConfigured) {
            toast({ title: 'Función no disponible', description: 'La creación de usuarios requiere conexión a Supabase.', variant: 'destructive'});
            return 'Supabase no configurado.';
        }
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
            return signUpError.message;
        }
        
        if (signUpData.user) {
             const { error: updateError } = await supabase.auth.admin.updateUserById(
                signUpData.user.id,
                { user_metadata: { role: role } }
             )
             if (updateError) {
                 return `User created but failed to set role: ${updateError.message}`;
             }
        }
        
        // Use a timeout to allow Supabase to process the new user before refetching
        setTimeout(() => useUsersStore.getState().fetchUsers(), 2000);
        
        return null;
    }
}));
