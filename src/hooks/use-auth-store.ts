
'use client';

import { create } from 'zustand';
import { auth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

export type UserRole = 'admin' | 'cashier';

type AuthState = {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password:string) => Promise<string | null>;
  logout: () => Promise<void>;
  _setUser: (user: User | null) => Promise<void>;
  _setRole: (role: UserRole) => void;
};

// This function listens to Firebase Auth state changes and updates the store
let authUnsubscribe: (() => void) | null = null;

const startAuthListener = () => {
    if (authUnsubscribe) authUnsubscribe(); // Prevent multiple listeners
    
    authUnsubscribe = onAuthStateChanged(auth, async (user) => {
        await useAuthStore.getState()._setUser(user);
    });
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  loading: true, // Start as loading until auth state is confirmed
  
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
    set({ user: null, role: null, loading: false });
  },

  _setUser: async (user: User | null) => {
    if (user) {
      try {
        const idTokenResult = await user.getIdTokenResult(true); // Force refresh token
        let role = (idTokenResult.claims.role as UserRole) || null;
        
        // This is a temporary workaround for the development environment.
        // In a real app, the first user role would be set up via a backend script.
        if (user.email === 'admin@bemstore.hn' && !role) {
            role = 'admin';
        } else if (!role) {
            role = 'cashier';
        }
        
        set({ user, role, loading: false });

      } catch (error) {
        console.error("Error getting user token/role:", error);
        // Fallback for safety
        set({ user, role: 'cashier', loading: false });
      }
    } else {
      set({ user: null, role: null, loading: false });
    }
  },
  
  _setRole: (role: UserRole) => set({ role }),
}));

// Initialize listener
startAuthListener();
