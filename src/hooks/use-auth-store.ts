
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
        .single(); // Use single to enforce one row, which is correct for this logic

    if (error) {
        // "PGRST116" is the code for "JSON object requested, multiple (or no) rows returned"
        // This means the user exists in auth but not in our public.users table.
        if (error.code === 'PGRST116') {
          return null;
        }
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
              
              // If user has auth session but no profile in `users` table, create one.
              if (!userRole) {
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
            // Local login logic remains a fallback for dev mode without Supabase
            const { users, ensureAdminUser } = useUsersStore.getState();
            ensureAdminUser(); // Ensure admin exists before trying to log in
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

          // If the user was created successfully and the trigger is expected to assign a default role,
          // we might need to update the role if a specific one was requested.
          if (authData.user && role !== 'admin') { // Assuming trigger defaults to 'admin'
              const { error: updateError } = await supabase
                  .from('users')
                  .update({ role: role })
                  .eq('id', authData.user.id);
              
              if (updateError) {
                  return `Usuario creado, pero no se pudo asignar el rol: ${updateError.message}`;
              }
          }
          
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
