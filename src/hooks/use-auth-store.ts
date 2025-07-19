
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
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle to prevent error if no row is found

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
          set({ isLoading: false });
          return;
        }
        
        // Supabase logic
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session) {
              let userRole = await getUserRole(session.user.id);
              if (!userRole) {
                  // User exists in auth, but not in public.users table. Create it.
                  const { data: newUser, error } = await supabase
                      .from('users')
                      .insert({ id: session.user.id, email: session.user.email!, role: 'admin' })
                      .select('role')
                      .single();
                  
                  if (error) {
                      console.error("Error creating user profile on the fly:", error.message);
                  } else {
                      userRole = newUser.role as UserRole;
                  }
              }

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
              let userRole = await getUserRole(session.user.id);
              if (!userRole) {
                  const { data: newUser, error } = await supabase
                      .from('users')
                      .insert({ id: session.user.id, email: session.user.email!, role: 'admin' })
                      .select('role')
                      .single();
                  if (error) {
                      console.error("Error creating user profile on initial session check:", error.message);
                  } else {
                      userRole = newUser.role as UserRole;
                  }
              }
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
              // This is a fallback for local development if Supabase is not configured.
              const localUsers = useUsersStore.getState().users;
              const foundUser = localUsers.find(u => u.email === email && u.password === password);
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
          
          // The onAuthStateChange listener will handle setting the user state.
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

          // Step 1: Create the user in Supabase Auth
          // We use an admin client call via an Edge Function for this in a real app,
          // but for now, we'll do it from the client and accept the security risks for dev.
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });

          if (signUpError) {
              return signUpError.message;
          }

          if (authData.user) {
              // Step 2: Insert the user into the public 'users' table
              // This is necessary because the trigger might have a slight delay or could fail.
              const { error: insertError } = await supabase
                  .from('users')
                  .insert({ id: authData.user.id, email: email, role: role });
              
              if (insertError && insertError.code !== '23505') { // 23505 is unique violation, meaning trigger worked
                  // Attempt to delete the auth user if profile insertion fails
                  // This requires admin privileges and would typically be in an edge function
                  console.error("Failed to create user profile, cleaning up auth user might be needed:", insertError.message);
                  return "Error al crear el perfil de usuario. Es posible que el usuario de autenticación se haya creado, pero el perfil no.";
              }
          } else {
              return "No se pudo crear el usuario en el sistema de autenticación.";
          }
          
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
