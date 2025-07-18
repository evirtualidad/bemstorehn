
'use client';

import { create } from 'zustand';
import { auth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import type { Session } from '@supabase/supabase-js'; // Keep for type compat until full removal

export type UserRole = 'admin' | 'cashier';

type AuthState = {
  session: Session | null;
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
    if (!auth || authUnsubscribe) return;
    
    authUnsubscribe = onAuthStateChanged(auth, async (user) => {
        useAuthStore.getState()._setUser(user);
    });
};

const mockUsers = {
    'admin@example.com': { role: 'admin' },
    'cashier@example.com': { role: 'cashier' },
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  role: null,
  loading: !auth, // Set loading to false immediately if not using Firebase
  
  login: async (email, password) => {
    if (!auth) {
        console.log("SIMULATION: Firebase not configured, using mock login.");
        set({ loading: true });
        return new Promise(resolve => {
            setTimeout(() => {
                if (mockUsers[email as keyof typeof mockUsers]) {
                    const role = mockUsers[email as keyof typeof mockUsers].role as UserRole;
                     const mockUser = {
                        uid: `mock_${role}`,
                        email: email,
                    } as User;
                     const mockSession: Session = {
                        access_token: 'mock_token',
                        user: {
                            id: mockUser.uid,
                            email: mockUser.email,
                            app_metadata: { role },
                        } as any,
                    } as any;
                    set({ session: mockSession, user: mockUser, role: role, loading: false });
                    resolve(null);
                } else {
                    set({ loading: false });
                    resolve('Correo o contraseña incorrectos.');
                }
            }, 500);
        });
    }

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
    if (auth) {
       await signOut(auth);
    }
    // For both firebase and mock, we clear the state
    set({ session: null, user: null, role: null, loading: false });
  },

  _setUser: async (user: User | null) => {
    if (user) {
      const idTokenResult = await user.getIdTokenResult(true);
      const role = (idTokenResult.claims.role as UserRole) || 'cashier';
      
      const mockSession: Session = {
          access_token: await user.getIdToken(),
          user: {
              id: user.uid,
              email: user.email,
              app_metadata: { role },
          } as any,
      } as any;

      set({ session: mockSession, user, role, loading: false });
    } else {
      set({ session: null, user: null, role: null, loading: false });
    }
  },
}));

// Initialize listeners
if (auth) {
    startAuthListener();
} else {
    // If not using Firebase, set a default mock user so the admin panel is accessible
    useAuthStore.getState().login('admin@example.com', 'password');
}
