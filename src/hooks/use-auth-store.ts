
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';
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

/**
 * Gets the user role ONLY from the session's JWT metadata.
 * This is the safest way to get the role on the client-side.
 * @param session The Supabase session object.
 * @returns The user role or null if not found.
 */
function getUserRoleFromSession(session: Session | null): UserRole | null {
    if (!session?.user?.id) {
        return null;
    }
    return (session.user.user_metadata?.role as UserRole) || null;
}


// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      isLoading: true,

      initializeSession: () => {
        if (!isSupabaseConfigured) {
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
                  isLoading: false 
              });
          } else {
              set({ isLoading: false });
          }
        });

        return () => {
            subscription?.unsubscribe();
        };
      },

      login: async (email, password) => {
          if (!isSupabaseConfigured) {
            return "Supabase no está configurado. No se puede iniciar sesión.";
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
          
          // The onAuthStateChange listener will handle setting the user state and isLoading to false.
          // We explicitly refresh to get the latest JWT with metadata.
          await supabase.auth.refreshSession();
          return null;
      },

      logout: async () => {
          if (!isSupabaseConfigured) {
              set({ user: null, role: null, isLoading: false });
              return;
          }

          await supabase.auth.signOut();
          set({ user: null, role: null, isLoading: false });
      },
      
      createUser: async (email, password, role) => {
          if (!isSupabaseConfigured) {
              toast({ title: 'Función no disponible', description: 'La creación de usuarios requiere conexión a Supabase.', variant: 'destructive'});
              return 'Supabase no configurado.';
          }
          
          // The database trigger `handle_new_user` handles creating the profile and setting metadata.
          const { error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) {
              return error.message;
          }
          
          // The trigger should handle everything. We just need to refresh the user list in the UI.
          setTimeout(() => useUsersStore.getState().fetchUsers(), 2000);
          
          return null; // Success
      }
    }),
    {
      name: 'auth-storage-v3', // Incremented version to clear old state
      storage: createJSONStorage(() => localStorage), 
    }
  )
);
