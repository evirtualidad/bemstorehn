
'use client';

import { create } from 'zustand';

export type UserRole = 'admin' | 'cajero';

export interface LocalUser {
  uid: string;
  email: string;
}

type AuthState = {
  user: LocalUser | null;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
};

// With the login system temporarily disabled, we default to a logged-in admin user
// to allow full access to the application's features without requiring credentials.
export const useAuthStore = create<AuthState>()((set) => ({
    user: {
        uid: 'default_admin_id',
        email: 'admin@bemstore.hn'
    },
    role: 'admin',
    login: async (email, password) => {
        console.log("Login function is disabled.");
        return "Login system is currently disabled.";
    },
    logout: async () => {
        console.log("Logout function is disabled.");
        // In this disabled state, logout does nothing.
        // If re-enabled, it would set user and role to null.
        // set({ user: null, role: null });
    },
}));
