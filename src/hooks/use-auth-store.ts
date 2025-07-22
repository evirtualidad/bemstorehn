
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import type { UserRole } from './use-users-store';
import { useUsersStore } from './use-users-store';
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

// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>()((set, get) => ({
      user: null,
      role: null,
      isAuthLoading: true,

      initializeSession: () => {
        // Set loading to true whenever we start checking auth
        set({ isAuthLoading: true });
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    const { data: userData, error } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();

                    if (error) {
                        console.error('Error fetching user role:', error);
                        // Still set the user, but with a null role
                        set({ user: session.user, role: null, isAuthLoading: false });
                    } else {
                        set({ user: session.user, role: userData.role, isAuthLoading: false });
                    }
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
        set({ user: null, role: null });
      },
}));
