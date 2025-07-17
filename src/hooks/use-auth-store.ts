
'use client';

import { create } from 'zustand';
import { SupabaseClient, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'cashier';

type AuthState = {
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  login: (supabase: SupabaseClient, email: string, password: string) => Promise<string | null>;
  logout: (supabase: SupabaseClient) => Promise<void>;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
};

const getRoleFromSession = (session: Session | null): UserRole | null => {
  if (!session) return null;
  // Default to 'cashier' if no role is explicitly assigned.
  return session.user?.app_metadata?.role || 'cashier';
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  role: null,
  loading: true,
  login: async (supabase, email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      set({ session: data.session, role: getRoleFromSession(data.session), loading: false });
      return null;
    } catch (error: any) {
      set({ loading: false });
      // Map common Supabase auth errors to user-friendly messages
      if (error.message.includes('Invalid login credentials')) {
        return 'El correo electrónico o la contraseña son incorrectos.';
      }
      return error.message || 'Ocurrió un error inesperado.';
    }
  },
  logout: async (supabase) => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ session: null, role: null, loading: false });
  },
  setSession: (session) => {
    const role = getRoleFromSession(session);
    set({ session, role });
  },
  setLoading: (loading) => set({ loading }),
}));

// Initialize auth state on app load
import { supabaseClient } from '@/lib/supabase';

supabaseClient.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.getState().setSession(session);
  useAuthStore.getState().setLoading(false);
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSession(session);
  // No need to set loading to false here, as it's for background updates
});
