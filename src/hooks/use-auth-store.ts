
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UserDoc, UserRole } from './use-users-store';
import { useUsersStore, initialUsers } from './use-users-store';
import { Session } from '@supabase/supabase-js';

type AuthState = {
  user: UserDoc | null;
  role: UserRole | null;
  isAuthLoading: boolean;
  initializeSession: () => void;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  createUser: (email: string, password: string, role: UserRole) => Promise<string | null>;
};

let sessionInitialized = false;

// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>((set, get) => {
    
    const fetchUserProfile = async (session: Session | null) => {
        if (session?.user) {
            const { data: userProfile, error } = await supabase
                .from('users')
                .select('id, email, role')
                .eq('id', session.user.id)
                .single();
            
            if (error) {
                console.error("Error fetching user profile:", error);
                set({ user: null, role: null, isAuthLoading: false });
                return;
            }
            
            if(userProfile) {
                console.log("User role fetched from DB:", userProfile.role);
                set({
                    user: userProfile as UserDoc,
                    role: userProfile.role as UserRole,
                    isAuthLoading: false
                });
            } else {
                 console.warn("User profile not found for ID:", session.user.id);
                 set({ user: null, role: null, isAuthLoading: false });
            }

        } else {
            set({ user: null, role: null, isAuthLoading: false });
        }
    };

    return {
        user: null,
        role: null,
        isAuthLoading: true,

        initializeSession: () => {
            if (sessionInitialized) return;
            sessionInitialized = true;

            if (!isSupabaseConfigured) {
              console.log("Auth: Supabase not configured. Running in local mode.");
              set({ isAuthLoading: false });
              return;
            }
            
            supabase.auth.onAuthStateChange(async (_event, session) => {
                await fetchUserProfile(session);
            });
            
            supabase.auth.getSession().then(({ data: { session } }) => {
                fetchUserProfile(session);
            });
        },

        login: async (email, password) => {
            if (!isSupabaseConfigured) {
              const localUser = initialUsers.find(u => u.email === email && u.password === password);
              if(localUser) {
                  set({ user: localUser, role: localUser.role, isAuthLoading: false });
                  return null;
              }
              return "Credenciales inválidas (modo local).";
            }
            
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            
            if (error) {
              if (error.message.includes('Invalid login credentials')) {
                  return 'Credenciales de inicio de sesión inválidas.';
              }
               if (error.message.includes('Email not confirmed')) {
                  return 'Por favor, confirma tu correo electrónico antes de iniciar sesión.';
              }
              return error.message;
            }
            
            return null;
        },

        logout: async () => {
            if (isSupabaseConfigured) {
                await supabase.auth.signOut();
            }
            set({ user: null, role: null, isAuthLoading: false });
        },
        
        createUser: async (email, password, role) => {
            if (!isSupabaseConfigured) {
                toast({ title: 'Función no disponible', description: 'La creación de usuarios requiere conexión a Supabase.', variant: 'destructive'});
                return 'Supabase no configurado.';
            }
            
            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { role }
            });

            if (error) {
                return error.message;
            }
            
            setTimeout(() => useUsersStore.getState().fetchUsers(), 2000);
            
            return null;
        }
    }
});
