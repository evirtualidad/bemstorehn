
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
  logout: () => Promise<void>;
};

const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();
        
        if (error) {
            // PGRST116: "no rows found", which is expected for new users.
            if (error.code !== 'PGRST116') {
                 console.error('Error fetching user role:', error.message);
            }
            return null;
        }
        return data.role;
    } catch (e: any) {
        console.error('Exception fetching user role:', e.message);
        return null;
    }
}

// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>()((set, get) => ({
      user: null,
      role: null,
      isAuthLoading: true,

      initializeSession: () => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    const role = await fetchUserRole(session.user.id);
                    set({ user: session.user, role, isAuthLoading: false });
                } else {
                    set({ user: null, role: null, isAuthLoading: false });
                }
            }
        );

        // Immediately check the current session without waiting for an event
        const checkCurrentSession = async () => {
             const { data: { session } } = await supabase.auth.getSession();
             if (session?.user) {
                const role = await fetchUserRole(session.user.id);
                set({ user: session.user, role, isAuthLoading: false });
             } else {
                set({ user: null, role: null, isAuthLoading: false });
             }
        };

        checkCurrentSession();

        return () => {
            subscription.unsubscribe();
        };
      },

      login: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return error.message;
        }
        return null;
      },

      logout: async () => {
        await supabase.auth.signOut();
      },
}));
