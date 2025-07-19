
'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from './use-toast';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';


export interface UserDoc {
    id: string; 
    email: string;
    password?: string;
    role: 'admin' | 'cajero';
}

const initialUsers: UserDoc[] = [
    { id: 'user-admin', email: 'admin@bemstore.hn', password: 'password', role: 'admin' },
    { id: 'user-cajero', email: 'cajero@bemstore.hn', password: 'password', role: 'cajero' },
    { id: 'user-superadmin', email: 'superadmin@bemstore.hn', password: 'password', role: 'admin'},
    { id: 'user-evirt', email: 'evirt@bemstore.hn', password: 'password', role: 'admin'},
];

type UsersState = {
  users: UserDoc[];
  isLoading: boolean;
  fetchUsers: () => Promise<void>;
  updateUserRole: (userId: string, newRole: 'admin' | 'cajero') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  addUser: (userData: Omit<UserDoc, 'id'>) => Promise<boolean>;
};

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
      users: initialUsers,
      isLoading: false, 
      
      fetchUsers: async () => {
          set({ isLoading: false });
      },

      updateUserRole: async (userId, newRole) => {
          set(produce(state => {
              const user = state.users.find(u => u.id === userId);
              if (user) {
                  user.role = newRole;
              }
          }));
          toast({ title: 'Rol actualizado', description: `El rol del usuario ha sido cambiado a ${newRole}.` });
      },
      
      deleteUser: async (userId: string) => {
           set(produce(state => {
              state.users = state.users.filter(u => u.id !== userId);
          }));
          toast({ title: 'Usuario eliminado', variant: 'destructive' });
      },

      addUser: async (userData) => {
        const existingUser = get().users.find(u => u.email === userData.email);
        if (existingUser) {
            return false; // User already exists
        }

        const newUser: UserDoc = { ...userData, id: uuidv4() };
        set(produce(state => {
            state.users.push(newUser);
        }));
        return true; // Success
      }
    }),
    {
      name: 'users-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => {
        if (!state?.users?.length) {
            // If storage is empty (first time load), populate with initial users.
            state.users = initialUsers;
        }
        // Force evirt to be admin on every load to fix stuck state
        if (state?.users) {
           const evirtUser = state.users.find(u => u.email === 'evirt@bemstore.hn');
           if (evirtUser && evirtUser.role !== 'admin') {
               evirtUser.role = 'admin';
           }
        }
      }
    }
  )
);
