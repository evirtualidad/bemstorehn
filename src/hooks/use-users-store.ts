
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
}

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
      isLoading: false, 
      
      fetchUsers: async () => {
          if (!isSupabaseConfigured) {
              console.log("Running in local mode. Supabase not configured.");
              set({ isLoading: false });
              return;
          }
          set({ isLoading: true });
          const { data: rolesData, error: rolesError } = await supabase.from('roles').select('id, role');
          
          if (rolesError) {
              toast({ title: 'Error al cargar usuarios', description: rolesError.message, variant: 'destructive'});
              set({ isLoading: false, users: [] });
              return;
          }

          // We need to fetch the actual user emails from auth.users
          const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
          
          if (authError) {
              toast({ title: 'Error al cargar correos', description: authError.message, variant: 'destructive'});
              set({ isLoading: false, users: [] });
              return;
          }

          const combinedUsers = rolesData.map(roleInfo => {
              const authUser = authUsers.find(u => u.id === roleInfo.id);
              return {
                  id: roleInfo.id,
                  email: authUser?.email || 'No encontrado',
                  role: roleInfo.role as UserRole
              };
          });

          set({ users: combinedUsers, isLoading: false });
      },

      updateUserRole: async (userId, newRole) => {
           if (!isSupabaseConfigured) {
              toast({ title: 'Función no disponible', description: 'La actualización de roles requiere conexión a Supabase.', variant: 'destructive'});
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
                await get().fetchUsers();
            }
      },
      
      deleteUser: async (userId: string) => {
           if (!isSupabaseConfigured) {
              toast({ title: 'Función no disponible', description: 'La eliminación de usuarios requiere conexión a Supabase.', variant: 'destructive'});
              return;
           }
           
           // Deleting a user requires admin privileges and is best done via a server-side function.
           // This is a placeholder for a more secure implementation.
           const { error } = await supabase.auth.admin.deleteUser(userId);
           
            if (error) {
                toast({ title: 'Error al eliminar usuario', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Usuario eliminado' });
                await get().fetchUsers();
            }
      },
    }),
    {
      name: 'users-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
