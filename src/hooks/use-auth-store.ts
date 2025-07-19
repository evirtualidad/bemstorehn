
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
    if (!isSupabaseConfigured) return 'admin'; 

    const { data, error } = await supabase
        .from('roles')
        .select('role')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle to gracefully handle cases where no role is found (0 rows)

    if (error) {
        // We still log the error for debugging, but it won't be the "PGRST116" error anymore.
        console.error('Error fetching user role:', error.message);
        return null;
    }
    
    // If data is null (no role found), it will correctly return null.
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
            const users = useUsersStore.getState().users;
            const foundUser = users.find(u => u.email === email && u.password === password);
            
            if (foundUser) {
                set({ user: foundUser, role: foundUser.role, isLoading: false });
                localStorage.setItem('auth-user', JSON.stringify(foundUser));
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
    },

    logout: async () => {
        if (!isSupabaseConfigured) {
            localStorage.removeItem('auth-user');
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
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) {
            return signUpError.message;
        }

        // The user is created in auth, but not confirmed. The role must be set,
        // typically via a server-side function triggered by the new user event.
        // The policies we set up earlier allow an admin to do this.
        if (data.user) {
            // Now, insert the role into the public 'roles' table.
            const { error: roleError } = await supabase
                .from('roles')
                .insert({ id: data.user.id, role: role });
            
            if (roleError) {
                console.error("User created, but failed to set role:", roleError);
                // Attempt to delete the user if role setting fails to avoid orphaned auth users
                // This requires admin privileges, so it might fail on the client.
                // await supabase.auth.admin.deleteUser(data.user.id); // This would be the server-side approach
                return "El usuario fue creado, pero falló al asignar el rol. Por favor, asigna el rol manualmente.";
            }
        }
        
        return null; // Success
    }
}));
