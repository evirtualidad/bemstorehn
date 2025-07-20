
'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from './use-toast';
import { useAuthStore } from './use-auth-store';
import { v4 as uuidv4 } from 'uuid';

export type UserRole = 'admin' | 'cajero';

export interface UserDoc {
    id: string; 
    email: string;
    role: UserRole;
    password?: string; // Only for local fallback
}

export let initialUsers: UserDoc[] = [
    { id: 'user-1-admin', email: 'evirt@bemstore.hn', role: 'admin', password: 'password' },
    { id: 'user-2-cajero', email: 'cajero@bemstore.hn', role: 'cajero', password: 'password' },
    { id: 'admin-user', email: 'admin@bemstore.hn', role: 'admin', password: 'password' },
]

type UsersState = {
  users: UserDoc[];
  isLoading: boolean;
  fetchUsers: () => void;
  updateUserRole: (userId: string, newRole: 'admin' | 'cajero') => void;
  deleteUser: (userId: string) => void;
};

export const useUsersStore = create<UsersState>()((set, get) => ({
    users: [],
    isLoading: false,
    
    fetchUsers: () => {
        set({ users: initialUsers, isLoading: false });
    },

    updateUserRole: (userId, newRole) => {
        const { user: currentUser } = useAuthStore.getState();
        if (currentUser?.id === userId) {
            toast({ title: 'Acción no permitida', description: 'No puedes cambiar tu propio rol.', variant: 'destructive'});
            return;
        }

        const userToUpdate = initialUsers.find((user) => user.id === userId);
        if (userToUpdate) {
            userToUpdate.role = newRole;
            set({ users: [...initialUsers] });
            toast({ title: '¡Rol Actualizado!', description: `El rol del usuario ha sido cambiado a ${newRole}.` });
        }
    },
    
    deleteUser: (userId: string) => {
        initialUsers = initialUsers.filter(user => user.id !== userId);
        set({ users: [...initialUsers] });
        toast({ title: 'Usuario eliminado', variant: 'destructive' });
    },
}));
