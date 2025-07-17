
'use client';

import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabase';

export type UserRole = 'admin' | 'cashier';

type AuthState = {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
};

const getRoleFromSession = (session: Session | null): UserRole | null => {
  if (!session) return null;
  // Fallback to 'cashier' if role is not defined for some reason
  return (session.user?.app_metadata?.role as UserRole) || 'cashier';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  role: null,
  loading: true, // Start as true until we check the session
  login: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ loading: false });
      return error.message;
    }
    
    if (data.session) {
      set({ 
        session: data.session, 
        user: data.session.user,
        role: getRoleFromSession(data.session), 
        loading: false 
      });
    }
    return null;
  },
  logout: async () => {
    set({ loading: true });
    await supabaseClient.auth.signOut();
    set({ session: null, user: null, role: null, loading: false });
  },
  setSession: (session) => {
    const role = getRoleFromSession(session);
    set({ session, user: session?.user || null, role, loading: false });
  },
  setLoading: (loading) => set({ loading }),
}));

// Initialize auth state on app load by checking the current session
supabaseClient.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.getState().setSession(session);
});

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSession(session);
});
