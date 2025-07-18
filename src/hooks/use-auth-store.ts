
'use client';

import { create } from 'zustand';
import { auth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { setRole } from '@/actions/set-role';

export type UserRole = 'admin' | 'cashier';

type AuthState = {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password:string) => Promise<string | null>;
  logout: () => Promise<void>;
  _setUser: (user: User | null) => Promise<void>;
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
        let idTokenResult = await user.getIdTokenResult(true); // Force refresh token
        let role = (idTokenResult.claims.role as UserRole) || null;

        // Automatically make 'admin@bemstore.hn' an admin if they have no role
        if (user.email === 'admin@bemstore.hn' && role !== 'admin') {
          console.log("Attempting to bootstrap admin user...");
          const result = await setRole(user.uid, 'admin');
          if (result.success) {
            console.log("Bootstrap successful. Forcing token refresh.");
            idTokenResult = await user.getIdTokenResult(true);
            role = (idTokenResult.claims.role as UserRole) || 'admin';
          } else {
             console.error("Failed to bootstrap admin user:", result.error, "Assigning admin role in UI temporarily.");
             // Force admin role in the UI to allow user to proceed
             role = 'admin';
          }
        }
        
        // Default to 'cashier' if no role is found after all checks
        if (!role) {
            role = 'cashier';
        }

        set({ user, role, loading: false });
      } catch (error) {
        console.error("Error getting user token/role:", error);
        // Log out user if token is invalid
        await signOut(auth);
        set({ user: null, role: null, loading: false });
      }
    } else {
      set({ user: null, role: null, loading: false });
    }
  },
}));

// Initialize listener
startAuthListener();
