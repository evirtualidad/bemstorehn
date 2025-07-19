
'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from './use-toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from './use-auth-store';

export type UserRole = 'admin' | 'cajero';

export interface UserDoc {
    id: string; 
    email: string;
    role: UserRole;
    password?: string; // Only for local fallback
}

export const initialUsers: UserDoc[] = [
    { id: 'user-1-admin', email: 'evirt@bemstore.hn', role: 'admin', password: 'password' },
    { id: 'user-2-cajero', email: 'cajero@bemstore.hn', role: 'cajero', password: 'password' },
    { id: 'admin-user', email: 'admin@bemstore.hn', role: 'admin', password: 'password' },
]

type UsersState = {
  users: UserDoc[];
  isLoading: boolean;
  fetchUsers: () => Promise<void>;
  updateUserRole: (userId: string, newRole: 'admin' | 'cajero') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
};

export const useUsersStore = create<UsersState>()((set, get) => ({
    users: [],
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
        const { user: currentUser } = useAuthStore.getState();
        if (currentUser?.id === userId) {
            toast({ title: 'Acción no permitida', description: 'No puedes cambiar tu propio rol.', variant: 'destructive'});
            return;
        }

        if (!isSupabaseConfigured) {
            toast({ title: 'Función no disponible', description: 'Se requiere Supabase para cambiar roles.', variant: 'destructive'});
            // For local mode, we can optimistically update
            set(produce((state) => {
                const userToUpdate = state.users.find((user) => user.id === userId);
                if (userToUpdate) {
                    userToUpdate.role = newRole;
                }
            }));
            return;
        }
        
        // Step 1: Call the Supabase RPC function
        const { error } = await supabase.rpc('update_user_role', {
            user_id: userId,
            new_role: newRole,
        });

        // Step 2: Handle errors
        if (error) {
            toast({ title: 'Error al actualizar rol', description: `Supabase: ${error.message}`, variant: 'destructive' });
            return;
        }

        // Step 3: If successful, update the local state
        set(produce((state) => {
            const userToUpdate = state.users.find((user) => user.id === userId);
            if (userToUpdate) {
                userToUpdate.role = newRole;
            }
        }));

        toast({ title: '¡Rol Actualizado!', description: `El rol del usuario ha sido cambiado a ${newRole}.` });
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
              // Refetch users after deletion
              await get().fetchUsers();
          }
    },
}));
