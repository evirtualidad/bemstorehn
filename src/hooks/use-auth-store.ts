
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UserDoc, UserRole } from './use-users-store';
import { useUsersStore } from './use-users-store';

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
async function getUserRole(userId: string): Promise<UserRole | null> {
    if (!isSupabaseConfigured) return 'admin'; 

    const { data, error } = await supabase
        .from('roles')
        .select('role')
        .eq('id', userId)
        .maybeSingle(); 

    if (error) {
        console.error('Error fetching user role:', error.message);
        // This can happen if the user exists in auth but not in roles table yet, or due to RLS.
        if (error.code === 'PGRST116') {
             console.log("User role not found, returning null.");
             return null;
        }
        return null;
    }
    
    return data?.role as UserRole | null;
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
          console.log("Running in local mode. Supabase not configured.");
          set({ isLoading: false });
          return;
        }
        
        // Supabase logic
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session) {
              const userRole = await getUserRole(session.user.id);
              // If user exists in auth but not in roles table, assign a default role.
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
              const userRole = await getUserRole(session.user.id);
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
            toast({ title: "Supabase no configurado", description: "No se puede iniciar sesión sin las credenciales de Supabase.", variant: "destructive" });
            return "Supabase no configurado";
          }
          
          set({ isLoading: true });
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          
          if (error) {
            set({ isLoading: false });
            return 'Credenciales inválidas. Por favor, inténtalo de nuevo.';
          }
          
          // The onAuthStateChange listener will handle setting the user and role.
          // We don't need to explicitly set loading to false here, as the listener will do it.
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
          
          const { data, error: signUpError } = await supabase.auth.signUp({
              email,
              password,
          });

          if (signUpError) {
              return signUpError.message;
          }

          if (data.user) {
              const { error: roleError } = await supabase
                  .from('roles')
                  .insert({ id: data.user.id, role: role });
              
              if (roleError) {
                  console.error("User created, but failed to set role:", roleError);
                  // Attempt to delete the auth user if role assignment fails to avoid orphaned users
                  // This requires admin privileges and is best handled in a server-side function.
                  // For now, we'll just return the error.
                  return "El usuario fue creado, pero falló al asignar el rol. Por favor, asigna el rol manualmente.";
              }
          }
          
          return null; // Success
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for Supabase to avoid conflicts
    }
  )
);
