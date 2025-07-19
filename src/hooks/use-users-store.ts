
'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from './use-toast';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type UserRole = 'admin' | 'cajero';

export interface UserDoc {
    id: string; 
    email: string;
    password?: string; // Only for local mock data
    role: UserRole;
}

const initialUsers: UserDoc[] = [
    { id: 'user-admin', email: 'admin@bemstore.hn', password: 'password', role: 'admin' },
    { id: 'user-cajero', email: 'cajero@bemstore.hn', password: 'password', role: 'cajero' },
    { id: 'user-evirt', email: 'evirt@bemstore.hn', password: 'password', role: 'admin'},
];

type UsersState = {
  users: UserDoc[];
  isLoading: boolean;
  fetchUsers: () => Promise<void>;
  updateUserRole: (userId: string, newRole: 'admin' | 'cajero') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  addUser: (userData: Omit<UserDoc, 'id'>) => Promise<boolean>;
  ensureAdminUser: () => void;
};

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
      users: initialUsers,
      isLoading: false, 
      
      fetchUsers: async () => {
          if (!isSupabaseConfigured) {
              set({ isLoading: false });
              return;
          }
          set({ isLoading: true });
          // In Supabase, users come from auth, roles from 'roles' table.
          // This is a simplified fetch. In a real app, you might need an admin function.
          const { data: rolesData, error: rolesError } = await supabase.from('roles').select('*');
          
          if (rolesError) {
              toast({ title: 'Error al cargar usuarios', description: rolesError.message, variant: 'destructive'});
              set({ isLoading: false });
              return;
          }

          // We can't easily get all users from Supabase Auth on the client,
          // so we'll just use the roles data to populate emails (this is a simplification)
          // A proper implementation uses a server-side function.
          
          // For now, we just mark as not loading. The user list will be managed differently.
          set({ isLoading: false });
      },

      updateUserRole: async (userId, newRole) => {
           if (!isSupabaseConfigured) {
              set(produce(state => {
                  const user = state.users.find(u => u.id === userId);
                  if (user) {
                      user.role = newRole;
                  }
              }));
              toast({ title: 'Rol actualizado', description: `El rol del usuario ha sido cambiado a ${newRole}.` });
              return;
           }

            const { error } = await supabase
                .from('roles')
                .update({ role: newRole })
                .eq('id', userId);
            
            if (error) {
                toast({ title: 'Error al actualizar rol', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Rol actualizado' });
                // We need to refetch the users list to see the change
                get().fetchUsers();
            }
      },
      
      deleteUser: async (userId: string) => {
           if (!isSupabaseConfigured) {
               set(produce(state => {
                  state.users = state.users.filter(u => u.id !== userId);
              }));
              toast({ title: 'Usuario eliminado', variant: 'destructive' });
              return;
           }
           
           // Deleting a user should be a server-side admin action.
           // This will not work with default RLS policies.
           // For now, we just show a toast.
           toast({ title: 'Función no implementada', description: 'La eliminación de usuarios debe configurarse con funciones de administrador en Supabase.', variant: 'destructive'});
      },

      addUser: async (userData) => {
        const existingUser = get().users.find(u => u.email === userData.email);
        if (existingUser) {
            return false; // User already exists
        }

        const newUser: UserDoc = { ...userData, id: uuidv4(), role: userData.role };
        set(produce(state => {
            state.users.push(newUser);
        }));
        return true; // Success
      },
      
      ensureAdminUser: () => {
         setTimeout(() => {
            set(produce(state => {
                const evirtUser = state.users.find((u: UserDoc) => u.email === 'evirt@bemstore.hn');
                 if (!evirtUser) {
                     state.users.push({ id: 'user-evirt', email: 'evirt@bemstore.hn', password: 'password', role: 'admin'});
                 } else if (evirtUser.role !== 'admin') {
                     evirtUser.role = 'admin';
                 }
            }));
         }, 0)
      }
    }),
    {
      name: 'users-storage',
      storage: createJSONStorage(() => localStorage),
       onRehydrateStorage: (state: any) => {
         // This function runs when the state is rehydrated from localStorage.
         const hydratedState = state.state;
         if (!isSupabaseConfigured) {
             if (!hydratedState || !hydratedState.users || hydratedState.users.length === 0) {
                 // If storage is empty or users array is missing, populate with initial data.
                 set({ users: initialUsers });
             }
         }
       }
    }
  )
);
