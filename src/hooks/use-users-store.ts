
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
      users: initialUsers,
      isLoading: false,
      
      fetchUsers: async () => {
          set({ isLoading: true });
          if (!isSupabaseConfigured) {
              set({ users: initialUsers, isLoading: false });
              return;
          }

          const { data, error } = await supabase.rpc('get_all_users');
          
          if (error) {
              toast({ title: 'Error al cargar usuarios', description: error.message, variant: 'destructive'});
              set({ isLoading: false });
          } else {
            set({ users: data as UserDoc[], isLoading: false });
          }
      },

      updateUserRole: async (userId, newRole) => {
           if (!isSupabaseConfigured) {
              toast({ title: 'Función no disponible', description: 'La actualización de roles requiere conexión a Supabase.', variant: 'destructive'});
              return;
           }

            const { error } = await supabase.rpc('update_user_role', {
                user_id: userId,
                new_role: newRole,
            });
            
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
           
           const { error } = await supabase.rpc('delete_auth_user', { user_id: userId });
           
            if (error) {
                toast({ title: 'Error al eliminar usuario', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Usuario eliminado', variant: 'destructive' });
                await get().fetchUsers();
            }
      },
    }),
    {
      name: 'users-storage-v5',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
