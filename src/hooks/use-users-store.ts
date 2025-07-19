
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
    role: UserRole;
    password?: string; // Only for local fallback
}

// Initial user for local mode
const initialUsers: UserDoc[] = [
    { id: 'user-1-admin', email: 'evirt@bemstore.hn', role: 'admin', password: 'password' },
    { id: 'user-2-cajero', email: 'cajero@bemstore.hn', role: 'cajero', password: 'password' },
]

type UsersState = {
  users: UserDoc[];
  isLoading: boolean;
  fetchUsers: () => Promise<void>;
  updateUserRole: (userId: string, newRole: 'admin' | 'cajero') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
};

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
      users: [],
      isLoading: true,
      
      fetchUsers: async () => {
          if (!isSupabaseConfigured) {
              set({ users: initialUsers, isLoading: false });
              return;
          }
          set({ isLoading: true });

          // Call the secure database function instead of a direct SELECT
          const { data, error } = await supabase.rpc('get_all_users');
          
          if (error) {
              toast({ title: 'Error al cargar usuarios', description: error.message, variant: 'destructive'});
              set({ isLoading: false, users: initialUsers });
              return;
          }

          set({ users: data as UserDoc[], isLoading: false });
      },

      updateUserRole: async (userId, newRole) => {
           if (!isSupabaseConfigured) {
              toast({ title: 'Función no disponible', description: 'La actualización de roles requiere conexión a Supabase.', variant: 'destructive'});
              return;
           }

            const { error } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId);
            
            if (error) {
                toast({ title: 'Error al actualizar rol', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Rol actualizado' });
                await get().fetchUsers();
            }
      },
      
      deleteUser: async (userId: string) => {
           if (!isSupabaseConfigured) {
              toast({ title: 'Función no disponible', description: 'La eliminación de usuarios requiere conexión a Supabase.', variant: 'destructive'});
              return;
           }
           
           // You would typically call a Supabase Edge Function to delete the auth user securely.
           // For now, we'll just delete from our public table.
           const { error } = await supabase.from('users').delete().eq('id', userId);
           
            if (error) {
                toast({ title: 'Error al eliminar usuario', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Usuario eliminado de la lista', description: 'La cuenta de autenticación debe ser eliminada manually en Supabase.', variant: 'default' });
                await get().fetchUsers();
            }
      },
    }),
    {
      name: 'users-storage-v4',
      storage: createJSONStorage(() => localStorage),
       onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = true;
          state.fetchUsers();
        }
      }
    }
  )
);
