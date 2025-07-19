
'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { AuthUser } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'cajero';

type AuthState = {
  user: AuthUser | null;
  role: UserRole | null;
  isLoading: boolean;
  initializeSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  createUser: (email: string, password: string, role: UserRole) => Promise<string | null>;
};

// Helper function to get user role
async function getUserRole(userId: string): Promise<UserRole | null> {
    const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching user role:', error);
        return null;
    }
    return data?.role as UserRole | null;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    role: null,
    isLoading: true, // Start as loading

    initializeSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const user = session.user;
            const role = await getUserRole(user.id);
            set({ user, role, isLoading: false });
        } else {
            set({ user: null, role: null, isLoading: false });
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                const user = session.user;
                const role = await getUserRole(user.id);
                set({ user, role });
            } else {
                set({ user: null, role: null });
            }
        });

        // Cleanup listener on unmount
        return () => {
            subscription?.unsubscribe();
        };
    },

    login: async (email, password) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            set({ isLoading: false });
            return error.message;
        }
        if (data.user) {
            const role = await getUserRole(data.user.id);
            set({ user: data.user, role, isLoading: false });
        }
        return null;
    },

    logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, role: null, isLoading: false });
    },
    
    createUser: async (email, password, role) => {
        try {
            // We need a server-side function to create users and assign roles securely
            const { data, error } = await supabase.functions.invoke('create-user-with-role', {
                body: { email, password, role }
            });

            if (error) throw new Error(error.message);
            if (data.error) throw new Error(data.error);
            
            return null; // Success
        } catch (error: any) {
            console.error("Error creating user:", error);
            return error.message;
        }
    }
}));
