
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
          const localUsersStore = useUsersStore.getState();
          localUsersStore.ensureAdminUser();
          set({ isLoading: false });
          return;
        }
        
        // Supabase logic
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session) {
              const userRole = await getUserRole(session.user.id);
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
            const users = useUsersStore.getState().users;
            const foundUser = users.find(u => u.email === email && (u as any).password === password);
            if (foundUser) {
                set({ user: foundUser, role: foundUser.role, isLoading: false });
                return null;
            }
            return "Credenciales inválidas (local)";
          }
          
          set({ isLoading: true });
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          
          if (error) {
            set({ isLoading: false });
            return error.message; // Return the actual error message from Supabase
          }
          
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

          // Use a temporary admin client to create the user without email confirmation
          const { data, error: signUpError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // User is confirmed automatically
          });
          
          if (signUpError) {
              return signUpError.message;
          }

          if (data.user) {
              const { error: roleError } = await supabase
                  .from('roles')
                  .insert({ id: data.user.id, role: role });
              
              if (roleError) {
                  // Attempt to delete the auth user if role assignment fails
                  await supabase.auth.admin.deleteUser(data.user.id);
                  return "Error al asignar rol. El usuario no fue creado. Por favor, inténtelo de nuevo.";
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
