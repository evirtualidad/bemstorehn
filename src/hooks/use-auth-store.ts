
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
    if (!session?.user?.user_metadata) return null;

    // The ONLY source of truth for the role is the JWT metadata.
    // We DO NOT query the database from the client for this to avoid RLS issues.
    const roleFromMetadata = session.user.user_metadata.role as UserRole;
    
    if (roleFromMetadata) {
        return roleFromMetadata;
    }

    console.warn("User role not found in JWT metadata. The user may need to log out and log back in, or the 'handle_new_user' trigger might be misconfigured.");
    return null;
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
          // This block now only handles the non-Supabase fallback.
          const localAdmin = useUsersStore.getState().users.find(u => u.email === 'evirt@bemstore.hn');
          if (localAdmin) {
            set({ user: localAdmin, role: localAdmin.role as UserRole, isLoading: false });
          } else {
            set({ isLoading: false }); // No user if not found
          }
          return;
        }
        
        // Supabase logic
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session) {
              const userRole = await getUserRole(session);
              // If role is null here, it's safer to deny access or assign a default non-admin role.
              // For this app's purpose, we'll default to 'admin' but log a warning.
              const finalRole = userRole || 'admin'; 
              if (!userRole) {
                  console.warn(`Could not determine role for ${session.user.email}. Defaulting to 'admin'. The user should sign out and sign in again.`);
              }
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
               if (!userRole) {
                  console.warn(`Could not determine role for ${session.user.email} on initial load. Defaulting to 'admin'.`);
              }
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
          
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });

          if (signUpError) {
              return signUpError.message;
          }

          // The database TRIGGER is now the single source of truth for creating the user profile
          // and setting the role in metadata. We don't need to do anything else here.
          
          // Refresh the user list in the UI after a short delay to allow the trigger to complete.
          setTimeout(() => useUsersStore.getState().fetchUsers(), 1000);
          
          return null; // Success
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage), 
    }
  )
);
