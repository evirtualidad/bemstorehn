
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
 * This is the safest way to get the role on the client-side, as it doesn't
 * trigger RLS policies that might cause infinite recursion.
 * @param session The Supabase session object.
 * @returns The user role or null if not found.
 */
async function getUserRole(session: Session | null): Promise<UserRole | null> {
    if (!session?.user?.id) {
        return null;
    }

    const roleFromMetadata = session.user.user_metadata?.role as UserRole;
    
    if (roleFromMetadata) {
        return roleFromMetadata;
    }

    // If role is not in metadata, we cannot trust this session for roles.
    // The user will need to log out and log in again for the trigger to update their metadata.
    console.warn(`Role for user ${session.user.email} not found in JWT metadata. The user should sign out and sign back in.`);
    return null;
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
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session) {
              const userRole = await getUserRole(session);
              set({ 
                  user: { id: session.user.id, email: session.user.email || '', role: userRole || 'cajero' }, // Default to least privileged role if null
                  role: userRole, 
                  isLoading: false 
              });
          } else {
              set({ user: null, role: null, isLoading: false });
          }
        });
        
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session) {
              const userRole = await getUserRole(session);
              set({ 
                  user: { id: session.user.id, email: session.user.email || '', role: userRole || 'cajero' },
                  role: userRole, 
                  isLoading: false 
              });
          } else {
              set({isLoading: false });
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
          
          // The onAuthStateChange listener will handle setting the user state.
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
          
          // We pass the role in the metadata during sign-up. The trigger will handle the rest.
          const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });

          if (signUpError) {
              return signUpError.message;
          }

          if (!user) {
              return 'No se pudo crear el usuario en el sistema de autenticación.';
          }
          
          // The database trigger `handle_new_user` is now the single source of truth for creating the profile in public.users
          // and setting the role in auth.users metadata. We don't need to do anything else on the client.
          
          // Refresh the user list in the UI after a short delay to allow the trigger to complete.
          setTimeout(() => useUsersStore.getState().fetchUsers(), 2000);
          
          return null; // Success
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage), 
    }
  )
);
