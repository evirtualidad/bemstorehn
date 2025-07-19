
'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from './use-toast';
import { supabase } from '@/lib/supabase';

// This is a simplified interface for the client-side representation
// of a user from the Supabase `users` table and their role from `user_roles`.
export interface UserDoc {
    id: string; // Corresponds to Supabase user UUID
    email?: string;
    role: 'admin' | 'cajero';
    // We no longer store created_at or password on the client.
}

type UsersState = {
  users: UserDoc[];
  isLoading: boolean;
  fetchUsers: () => Promise<void>;
  updateUserRole: (userId: string, newRole: 'admin' | 'cajero') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
};

export const useUsersStore = create<UsersState>((set) => ({
    users: [],
    isLoading: true, // Start with loading true
    
    fetchUsers: async () => {
        set({ isLoading: true });
        try {
            // This Supabase Edge Function will fetch all users and their roles
            const { data, error } = await supabase.functions.invoke('get-users-with-roles');

            if (error) throw error;
            
            if (data) {
                set({ users: data.users as UserDoc[], isLoading: false });
            }
        } catch (error: any) {
            console.error("Error fetching users:", error);
            toast({ title: 'Error al cargar usuarios', description: error.message, variant: 'destructive' });
            set({ isLoading: false });
        }
    },

    updateUserRole: async (userId, newRole) => {
        try {
            const { error } = await supabase.functions.invoke('set-user-role', {
                body: { userId, role: newRole }
            });

            if (error) throw error;
            
            set(produce(state => {
                const user = state.users.find(u => u.id === userId);
                if (user) {
                    user.role = newRole;
                }
            }));
            toast({ title: 'Rol actualizado', description: `El rol del usuario ha sido cambiado a ${newRole}.` });
        } catch (error: any) {
             console.error("Error updating user role:", error);
             toast({ title: 'Error al actualizar rol', description: error.message, variant: 'destructive' });
        }
    },
    
    deleteUser: async (userId: string) => {
       try {
            const { error } = await supabase.functions.invoke('delete-user', {
                body: { userId }
            });

            if (error) throw error;

            set(produce(state => {
                state.users = state.users.filter(u => u.id !== userId);
            }));
            toast({ title: 'Usuario eliminado', variant: 'destructive' });
        } catch (error: any) {
             console.error("Error deleting user:", error);
             toast({ title: 'Error al eliminar usuario', description: error.message, variant: 'destructive' });
        }
    }
}));
