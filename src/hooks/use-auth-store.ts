
'use client';

import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'cashier';

// Mock Session for local development
const mockSession: Session = {
  access_token: 'mock-access-token',
  token_type: 'bearer',
  user: {
    id: 'mock-admin-id',
    app_metadata: { provider: 'email', role: 'admin' },
    user_metadata: { name: 'Admin User' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'admin@example.com',
  },
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'mock-refresh-token',
};


type AuthState = {
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
};

const getRoleFromSession = (session: Session | null): UserRole | null => {
  if (!session) return null;
  return session.user?.app_metadata?.role || 'admin';
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  role: null,
  loading: true,
  login: async (email, password) => {
    set({ loading: true });
    // Simulate a successful login
    if (email === 'admin@example.com' && password === 'password') {
        const session = mockSession;
        set({ session: session, role: getRoleFromSession(session), loading: false });
        return Promise.resolve(null);
    }
    // Simulate a failed login
    set({ loading: false });
    return Promise.resolve('El correo electrónico o la contraseña son incorrectos.');
  },
  logout: async () => {
    set({ loading: true });
    set({ session: null, role: null, loading: false });
    return Promise.resolve();
  },
  setSession: (session) => {
    const role = getRoleFromSession(session);
    set({ session, role });
  },
  setLoading: (loading) => set({ loading }),
}));

// Initialize auth state on app load with mock data
useAuthStore.getState().setSession(mockSession);
useAuthStore.getState().setLoading(false);
