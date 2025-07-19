
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
  initializeSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  createUser: (email: string, password: string, role: UserRole) => Promise<string | null>;
};

let sessionInitialized = false;

// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>((set, get) => {
    
    const handleSession = (session: Session | null) => {
        if (session?.user) {
            const { user } = session;
            const role = (user.user_metadata?.role as UserRole) || 'cajero';
            
            console.log("Session handled. User role from metadata:", role);

            set({
                user: {
                    id: user.id,
                    email: user.email || '',
                    role: role,
                },
                role: role,
                isAuthLoading: false
            });
        } else {
            console.log("No session found.");
            set({ user: null, role: null, isAuthLoading: false });
        }
    };

    return {
        user: null,
        role: null,
        isAuthLoading: true,

        initializeSession: async () => {
            if (sessionInitialized) {
                set({isAuthLoading: false});
                return;
            }
            sessionInitialized = true;
            
            if (!isSupabaseConfigured) {
              console.log("Auth: Supabase not configured. Running in local mode.");
              set({ isAuthLoading: false });
              return;
            }
            
            supabase.auth.onAuthStateChange((_event, session) => {
                handleSession(session);
            });
            
            const { data: { session } } = await supabase.auth.getSession();
            handleSession(session);
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
            
            // The onAuthStateChange listener will handle setting the user state.
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
            
            // Give Supabase a moment to process before refetching
            setTimeout(() => useUsersStore.getState().fetchUsers(), 1500);
            
            return null;
        }
    }
});
