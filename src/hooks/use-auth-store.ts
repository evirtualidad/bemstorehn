
'use client';

import { create } from 'zustand';
import { auth, db } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

export type UserRole = 'admin' | 'cashier';

type AuthState = {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password:string) => Promise<string | null>;
  logout: () => Promise<void>;
  _setUserAndRole: (user: User | null) => Promise<void>;
};

// This function listens to Firebase Auth state changes and updates the store
let authUnsubscribe: (() => void) | null = null;

const startAuthListener = () => {
    if (authUnsubscribe) authUnsubscribe(); // Prevent multiple listeners
    
    authUnsubscribe = onAuthStateChanged(auth, async (user) => {
        await useAuthStore.getState()._setUserAndRole(user);
    });
};

const functions = getFunctions(auth.app);
const setRoleCallable = httpsCallable(functions, 'setRole');


export const useAuthStore = create<AuthState>((set) => ({
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

  _setUserAndRole: async (user: User | null) => {
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        let userRole: UserRole = 'cashier';

        if (userDoc.exists()) {
          // User exists, get their role
          userRole = userDoc.data().role || 'cashier';
        } else {
          // User does not exist in Firestore, let's create them
          console.log(`User ${user.email} not found in Firestore. Creating document...`);
          
          // --- Special Case for Admin Bootstrap ---
          // If it's the main admin user, assign the admin role on first login.
          if (user.email === 'admin@bemstore.hn') {
            userRole = 'admin';
          }
          
          const newUserDoc = {
            uid: user.uid,
            email: user.email,
            role: userRole,
            created_at: serverTimestamp(),
          };
          
          await setDoc(userRef, newUserDoc);

          // Also set the custom claim in Firebase Auth for security
          try {
            await setRoleCallable({ userId: user.uid, role: userRole });
          } catch (claimError) {
             console.error("Failed to set custom claim during bootstrap:", claimError);
             // The UI will still work based on the Firestore role, but this indicates a functions issue.
          }
        }
        
        set({ user, role: userRole, loading: false });
        
      } catch (error) {
        console.error("Error getting user role from Firestore:", error);
        // Fallback for safety in case of Firestore errors
        set({ user, role: 'cashier', loading: false });
      }
    } else {
      set({ user: null, role: null, loading: false });
    }
  },
}));

// Initialize listener
startAuthListener();
