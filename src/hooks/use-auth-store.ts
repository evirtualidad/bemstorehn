
'use client';

import { create } from 'zustand';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import type { Session } from '@supabase/supabase-js'; // Keep for type compat until full removal

export type UserRole = 'admin' | 'cashier';

type AuthState = {
  session: Session | null; // Keep for now for type compatibility in components
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password:string) => Promise<string | null>;
  logout: () => Promise<void>;
  _setUser: (user: User | null) => void;
};

// This function listens to Firebase Auth state changes and updates the store
let authUnsubscribe: (() => void) | null = null;

const startAuthListener = () => {
    if (authUnsubscribe) return; // Listener already active
    
    authUnsubscribe = onAuthStateChanged(auth, async (user) => {
        useAuthStore.getState()._setUser(user);
    });
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  role: null,
  loading: true, // Start with loading true
  login: async (email, password) => {
    set({ loading: true });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener will handle setting the user state
      return null;
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      set({ loading: false });
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          return 'Correo o contraseña incorrectos.';
        default:
          return 'Ocurrió un error inesperado al iniciar sesión.';
      }
    }
  },
  logout: async () => {
    await signOut(auth);
    set({ session: null, user: null, role: null, loading: false });
  },
  _setUser: async (user: User | null) => {
    if (user) {
      // Get custom claims for role
      const idTokenResult = await user.getIdTokenResult(true);
      const role = (idTokenResult.claims.role as UserRole) || 'cashier';
      
      // We create a mock session object for component compatibility for now
      const mockSession: Session = {
          access_token: await user.getIdToken(),
          user: {
              id: user.uid,
              email: user.email,
              app_metadata: { role },
          } as any, // Cast to any to satisfy Supabase User type temporarily
      } as any;

      set({ session: mockSession, user, role, loading: false });
    } else {
      set({ session: null, user: null, role: null, loading: false });
    }
  },
}));

// Initialize the auth listener when the app loads
startAuthListener();
