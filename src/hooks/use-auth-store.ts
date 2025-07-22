
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
    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
    
    if (error) {
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
                    
                    if (!role) {
                        await new Promise(resolve => setTimeout(resolve, 1500)); 
                        role = await fetchUserRole(session.user.id);
                    }

                    if (!role) {
                         console.error('Error fetching user role: Role not found after retry.');
                    }
                    
                    set({ user: session.user, role, isAuthLoading: false });

                } else {
                    // This case handles signOut
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
          return error.message;
        }
        return null;
      },

      logout: async () => {
        await supabase.auth.signOut();
      },
}));
