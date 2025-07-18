
'use client';

import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

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

// Mock user for the simulation
const mockUser = {
    id: 'user_admin_mock',
    app_metadata: {
        provider: 'email',
        providers: ['email'],
        role: 'admin'
    },
    user_metadata: {
        name: 'Admin User'
    },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
} as unknown as User;

const mockSession = {
    access_token: 'mock_access_token',
    refresh_token: 'mock_refresh_token',
    user: mockUser,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Date.now() / 1000 + 3600,
} as unknown as Session;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  role: null,
  loading: true,
  login: async (email, password) => {
    set({ loading: true });
    // Simulate network delay
    await new Promise(res => setTimeout(res, 500));

    if (email === 'admin@example.com' && password === 'password') {
        const role = (mockUser.app_metadata.role as UserRole) || 'admin';
        set({ session: mockSession, user: mockUser, role: role, loading: false });
        return null; // No error
    }
    if (email === 'cashier@example.com' && password === 'password') {
         const cashierUser = { ...mockUser, app_metadata: { ...mockUser.app_metadata, role: 'cashier' }};
         const cashierSession = { ...mockSession, user: cashierUser };
         set({ session: cashierSession as Session, user: cashierUser, role: 'cashier', loading: false });
         return null;
    }
    
    set({ loading: false });
    return 'Credenciales inválidas. Inténtalo de nuevo.';
  },
  logout: async () => {
    set({ loading: true });
    await new Promise(res => setTimeout(res, 300));
    set({ session: null, user: null, role: null, loading: false });
  },
  setSession: (session) => {
    // This function will likely not be called directly in mock mode,
    // but it's here for completeness.
    const role = session ? (session.user?.app_metadata?.role as UserRole) || 'cashier' : null;
    set({ session, user: session?.user || null, role, loading: false });
  },
  setLoading: (loading) => set({ loading }),
}));

// Initialize the store with a mock session so the user is "logged in" on refresh for easier development.
setTimeout(() => {
    const role = (mockUser.app_metadata.role as UserRole) || 'admin';
    useAuthStore.setState({ session: mockSession, user: mockUser, role, loading: false });
}, 100);
