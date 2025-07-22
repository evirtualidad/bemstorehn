
'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from './use-toast';
import { useAuthStore } from './use-auth-store';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export type UserRole = 'admin' | 'cajero';

export interface UserDoc {
    id: string; 
    email: string | undefined;
    role: UserRole;
}

type UsersState = {
  users: UserDoc[];
  isLoading: boolean;
  fetchUsers: () => void;
  updateUserRole: (userId: string, newRole: 'admin' | 'cajero') => void;
  deleteUser: (userId: string) => void;
};

export const useUsersStore = create<UsersState>()(
    (set, get) => ({
        users: [],
        isLoading: true,
        
        fetchUsers: async () => {
            set({ isLoading: true });
            const { data, error } = await supabase
                .from('users')
                .select('id, email, role');
            
            if (error) {
                toast({ title: 'Error al cargar usuarios', description: error.message, variant: 'destructive' });
                set({ users: [], isLoading: false });
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

            const { error } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) {
                toast({ title: 'Error al actualizar rol', description: error.message, variant: 'destructive' });
            } else {
                set(produce((state: UsersState) => {
                    const userToUpdate = state.users.find((user) => user.id === userId);
                    if (userToUpdate) {
                        userToUpdate.role = newRole;
                    }
                }));
                toast({ title: '¡Rol Actualizado!', description: `El rol del usuario ha sido cambiado a ${newRole}.` });
            }
        },
        
        deleteUser: async (userId: string) => {
           toast({ title: 'Función no disponible', description: 'La eliminación de usuarios debe realizarse desde el panel de Supabase Auth.', variant: 'destructive' });
           // Supabase handles user deletion via its admin API or dashboard, which also cascades to our 'users' table thanks to the 'on delete cascade' constraint.
           // A direct frontend deletion is complex and requires admin privileges, so we're disabling it here.
        },
    })
);
