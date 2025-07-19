
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
          try {
              const storedUser = localStorage.getItem('auth-storage');
              if (storedUser) {
                  const authState = JSON.parse(storedUser);
                  if (authState.state.user) {
                      set({ user: authState.state.user, role: authState.state.role, isLoading: false });
                      return;
                  }
              }
          } catch (error) {
              console.error("Failed to parse auth user from localStorage", error);
          }
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
          set({ isLoading: true });
          
          // FORCED LOCAL LOGIN TO BYPASS SUPABASE ISSUES
          console.log("Attempting local login...");
          const users = useUsersStore.getState().users;
          const foundUser = users.find(u => u.email === email && u.password === password);
          
          if (foundUser) {
              console.log("Local user found:", foundUser.email, "Role:", foundUser.role);
              set({ user: foundUser, role: foundUser.role, isLoading: false });
              return null; // Success
          } else {
              console.log("Local user not found.");
              set({ isLoading: false });
              return "Credenciales inválidas (local).";
          }
          
          // --- Temporarily disabled Supabase login ---
          /*
          if (!isSupabaseConfigured) {
              const users = useUsersStore.getState().users;
              const foundUser = users.find(u => u.email === email && u.password === password);
              
              if (foundUser) {
                  set({ user: foundUser, role: foundUser.role, isLoading: false });
                  return null;
              } else {
                  set({ isLoading: false });
                  return "Credenciales inválidas.";
              }
          }
          
          // Supabase Logic
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
              set({ isLoading: false });
              return "Credenciales inválidas. Por favor, inténtalo de nuevo.";
          }
          // Session update is handled by onAuthStateChange listener
          return null;
          */
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
              const result = useUsersStore.getState().addUser({ email, password, role });
              if (result) {
                  toast({ title: 'Usuario Creado', description: 'El nuevo usuario ha sido creado exitosamente.' });
                  return null;
              } else {
                  toast({ title: 'Error al crear usuario', description: 'El correo electrónico ya está en uso.', variant: 'destructive' });
                  return 'El correo electrónico ya está en uso.';
              }
          }
          
          // This must be done from a server-side function with admin privileges in a real app
          // We are using client-side for simplicity in this environment.
          // In your Supabase project, you should disable "Confirm email" under Authentication -> Providers -> Email for easier development.
          const { data, error: signUpError } = await supabase.auth.signUp({
              email,
              password,
          });

          if (signUpError) {
              return signUpError.message;
          }

          if (data.user) {
              // Now, insert the role into the public 'roles' table.
              const { error: roleError } = await supabase
                  .from('roles')
                  .insert({ id: data.user.id, role: role });
              
              if (roleError) {
                  console.error("User created, but failed to set role:", roleError);
                  // Attempt to delete the auth user if role insertion fails to prevent orphaned users
                  // This requires admin privileges and is best handled in a server-side function.
                  return "El usuario fue creado, pero falló al asignar el rol. Por favor, asigna el rol manualmente.";
              }
          }
          
          return null; // Success
      }
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage),
      // Only persist user and role if not using Supabase
      partialize: (state) =>
        isSupabaseConfigured ? {} : { user: state.user, role: state.role },
      onRehydrateStorage: () => (state) => {
        if (!isSupabaseConfigured) {
          useUsersStore.getState().ensureAdminUser();
        }
      }
    }
  )
);
