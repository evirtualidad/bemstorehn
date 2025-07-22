
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import type { UserRole } from './use-users-store';
import { supabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';

type AuthState = {
  user: User | null;
  role: UserRole | null;
  isAuthLoading: boolean;
  initializeSession: () => () => void;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
};

const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
    
    if (error) {
        // This can happen if the user record isn't created yet due to replication delay.
        console.error('Error fetching user role on first attempt:', error.message);
        return null;
    }
    return data.role;
}

// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>()((set, get) => ({
      user: null,
      role: null,
      isAuthLoading: true,

      initializeSession: () => {
        set({ isAuthLoading: true });
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    let role = await fetchUserRole(session.user.id);
                    
                    // Retry logic to handle replication delay for new users
                    if (!role) {
                        await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 sec
                        role = await fetchUserRole(session.user.id);
                    }

                    if (!role) {
                         console.error('Error fetching user role: Role not found after retry.');
                    }
                    
                    set({ user: session.user, role, isAuthLoading: false });

                } else {
                    // No session or user, clear everything and stop loading
                    set({ user: null, role: null, isAuthLoading: false });
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
      },

      login: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // Return the error message to be displayed in the toast
          return error.message;
        }
        // If login is successful, onAuthStateChange will handle setting user and role.
        // Return null to indicate success.
        return null;
      },

      logout: async () => {
        await supabase.auth.signOut();
        // The onAuthStateChange listener will clear the user and role.
        set({ user: null, role: null, isAuthLoading: false });
      },
}));
