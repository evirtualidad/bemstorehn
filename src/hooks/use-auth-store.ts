
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
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
    if (!isSupabaseConfigured) return 'admin'; // Default to admin in local mode

    const { data, error } = await supabase
        .from('roles')
        .select('role')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user role:', error.message);
        // This can happen if the user exists in auth but not in roles table yet
        if (error.code === 'PGRST116') {
             console.log("User role not found, returning null.");
             return null;
        }
        return null;
    }
    return data?.role as UserRole | null;
}


// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    role: null,
    isLoading: true, // Start as loading

    initializeSession: () => {
      if (!isSupabaseConfigured) {
        try {
            const storedUser = localStorage.getItem('auth-user');
            if (storedUser) {
                const user: UserDoc = JSON.parse(storedUser);
                set({ user, role: user.role, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error("Failed to parse auth user from localStorage", error);
            set({ isLoading: false });
        }
        return;
      }
      
      // Supabase logic
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            const userRole = await getUserRole(session.user.id);
            set({ 
                user: { id: session.user.id, email: session.user.email || '', role: userRole || 'cajero' },
                role: userRole, 
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
        set({ isLoading: true });
        
        if (!isSupabaseConfigured) {
             // This is a local-only authentication system.
            await useUsersStore.getState().fetchUsers(); // Ensure users are loaded
            const users = useUsersStore.getState().users;
            
            const foundUser = users.find(u => u.email === email && u.password === password);
            
            if (foundUser) {
                set({ user: foundUser, role: foundUser.role, isLoading: false });
                try {
                    localStorage.setItem('auth-user', JSON.stringify(foundUser));
                } catch (error) {
                     console.error("Failed to save auth user to localStorage", error);
                }
                return null; // Success
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
    },

    logout: async () => {
        if (!isSupabaseConfigured) {
             try {
                localStorage.removeItem('auth-user');
            } catch (error) {
                console.error("Failed to remove auth user from localStorage", error);
            }
            set({ user: null, role: null, isLoading: false });
            return;
        }

        await supabase.auth.signOut();
        set({ user: null, role: null, isLoading: false });
    },
    
    createUser: async (email, password, role) => {
        if (!isSupabaseConfigured) {
            const result = await useUsersStore.getState().addUser({ email, password, role });
            if (result) {
                toast({ title: 'Usuario Creado', description: 'El nuevo usuario ha sido creado exitosamente.' });
                return null;
            } else {
                 toast({ title: 'Error al crear usuario', description: 'El correo electrónico ya está en uso.', variant: 'destructive' });
                return 'El correo electrónico ya está en uso.';
            }
        }
        
        // Supabase Logic
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            return error.message;
        }

        if (data.user) {
            // Now, insert the role into the public 'roles' table.
            const { error: roleError } = await supabase
                .from('roles')
                .insert({ id: data.user.id, role: role });
            
            if (roleError) {
                // This is a tricky state. User is created but role failed.
                // For now, we'll just log it and inform the admin.
                console.error("User created, but failed to set role:", roleError);
                return "El usuario fue creado, pero falló al asignar el rol. Por favor, asigna el rol manualmente.";
            }
        }
        
        return null; // Success
    }
}));
