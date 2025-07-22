
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
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session) {
                    const { data: userData, error } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();

                    if (error) {
                        console.error('Error fetching user role:', error);
                        set({ user: session.user, role: null, isAuthLoading: false });
                    } else {
                        set({ user: session.user, role: userData.role, isAuthLoading: false });
                    }
                } else {
                    set({ user: null, role: null, isAuthLoading: false });
                }
            }
        );

        // Fetch initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                 supabase.from('users').select('role').eq('id', session.user.id).single().then(({ data, error }) => {
                     if (!error) {
                        set({ user: session.user, role: data.role, isAuthLoading: false });
                     } else {
                        console.error('Error fetching initial session role:', error);
                        set({ user: session.user, role: null, isAuthLoading: false });
                     }
                 })
            } else {
                set({ isAuthLoading: false });
            }
        });

        return () => subscription.unsubscribe();
      },

      login: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return error.message;
        }
        // The onAuthStateChange listener will handle setting the user and role.
        return null;
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, role: null, isAuthLoading: false });
      },
}));
