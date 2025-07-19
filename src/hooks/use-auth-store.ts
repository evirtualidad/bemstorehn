
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

// --- Supabase Role Fetcher ---
async function getUserRole(session: Session | null): Promise<UserRole | null> {
    if (!session) return null;

    // The most secure and efficient way to get a role is from the JWT token itself.
    // This avoids extra DB queries and RLS policy issues from the client.
    const roleFromMetadata = session.user?.user_metadata?.role as UserRole;
    if (roleFromMetadata) {
        return roleFromMetadata;
    }

    // Fallback for older users or if metadata isn't populated yet.
    // This should ideally not be hit if the DB trigger is working correctly.
    console.warn("Role not found in user metadata, falling back to DB query.");
    try {
        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (error) {
            console.error('Error fetching user role from DB:', error.message);
            return null;
        }
        return data?.role as UserRole | null;
    } catch (e) {
        console.error("Exception during fallback role fetch:", e);
        return null;
    }
}

// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      isLoading: true, // Start as loading

      initializeSession: () => {
        if (!isSupabaseConfigured) {
          set({ user: {id: 'local-admin', email: 'evirt@bemstore.hn', role: 'admin'}, role: 'admin', isLoading: false });
          return;
        }
        
        // Supabase logic
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session) {
              const userRole = await getUserRole(session);
              const finalRole = userRole || 'admin';
              set({ 
                  user: { id: session.user.id, email: session.user.email || '', role: finalRole },
                  role: finalRole, 
                  isLoading: false 
              });
          } else {
              set({ user: null, role: null, isLoading: false });
          }
        });
        
        // Initial check
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session) {
              const userRole = await getUserRole(session);
              const finalRole = userRole || 'admin';
              set({ 
                  user: { id: session.user.id, email: session.user.email || '', role: finalRole },
                  role: finalRole, 
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
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          
          if (error) {
            set({ isLoading: false });
            // Provide a more user-friendly message
            if (error.message.includes('Invalid login credentials')) {
                return 'Credenciales de inicio de sesión inválidas.';
            }
             if (error.message.includes('Email not confirmed')) {
                return 'Por favor, confirma tu correo electrónico antes de iniciar sesión.';
            }
            return error.message;
          }
          
          // The onAuthStateChange listener will handle setting the user state.
          await supabase.auth.refreshSession(); // Explicitly refresh to get latest metadata
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

          // We use an admin client call via an Edge Function for this in a real app.
          // In this setup, we rely on the `handle_new_user` trigger in Supabase.
          // The trigger will automatically create a user profile in `public.users`.
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });

          if (signUpError) {
              return signUpError.message;
          }

          // The DB trigger now handles setting the role in metadata, but we can double-check
          // or force an update if needed. For now, we trust the trigger.
          
          // Refresh the user list in the UI
          useUsersStore.getState().fetchUsers();
          return null; // Success
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage), 
    }
  )
);
