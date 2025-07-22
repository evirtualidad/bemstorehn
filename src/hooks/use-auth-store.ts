
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
  initializeSession: () => void;
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
                        toast({ title: 'Error obteniendo rol', description: error.message, variant: 'destructive' });
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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return error.message;
        }
        
        if (data.user) {
            const { data: userData, error: roleError } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single();
            
            if (roleError) {
                return roleError.message;
            }
            set({ user: data.user, role: userData.role, isAuthLoading: false });
        }
        return null;
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, role: null, isAuthLoading: false });
      },
}));
