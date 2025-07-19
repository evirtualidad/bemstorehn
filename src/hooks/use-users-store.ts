
'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from './use-toast';

export interface UserDoc {
    uid: string;
    email: string;
    password?: string;
    role: 'admin' | 'cajero';
    created_at: {
        seconds: number;
        nanoseconds: number;
    };
}

const initialUsers: UserDoc[] = [
    {
        uid: 'admin_user_id_simulated',
        email: 'admin@bemstore.hn',
        password: 'password',
        role: 'admin',
        created_at: { seconds: Math.floor(new Date().getTime() / 1000) - 86400, nanoseconds: 0 }
    },
    {
        uid: 'superadmin_user_id_simulated',
        email: 'superadmin@bemstore.hn',
        password: 'password',
        role: 'admin',
        created_at: { seconds: Math.floor(new Date().getTime() / 1000) - 86400, nanoseconds: 0 }
    },
    {
        uid: 'cashier_user_id_simulated',
        email: 'cajero@bemstore.hn',
        password: 'password',
        role: 'cajero',
        created_at: { seconds: Math.floor(new Date().getTime() / 1000) - 172800, nanoseconds: 0 }
    },
    {
        uid: 'evirt_user_id_simulated',
        email: 'evirt@bemstore.hn',
        password: 'password',
        role: 'admin',
        created_at: { seconds: Math.floor(new Date().getTime() / 1000) - 172800, nanoseconds: 0 }
    }
];

type UsersState = {
  users: UserDoc[];
  isLoading: boolean;
  _hasHydrated: boolean;
  addUser: (userData: Omit<UserDoc, 'uid' | 'created_at'>) => void;
  updateUserRole: (uid: string, newRole: 'admin' | 'cajero') => void;
  deleteUser: (uid: string) => void;
  setHasHydrated: (state: boolean) => void;
};

export const useUsersStore = create<UsersState>()(
  persist(
    (set) => ({
      users: [],
      isLoading: false,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },

      addUser: (userData) => {
        const newUser: UserDoc = {
          uid: uuidv4(),
          email: userData.email,
          password: userData.password,
          role: userData.role,
          created_at: {
            seconds: Math.floor(new Date().getTime() / 1000),
            nanoseconds: 0,
          },
        };
        set(produce(state => {
          state.users.unshift(newUser);
        }));
        toast({
          title: '¡Usuario Creado!',
          description: `El usuario ${userData.email} ha sido creado exitosamente.`,
        });
      },

      updateUserRole: (uid, newRole) => {
        set(produce(state => {
          const user = state.users.find(u => u.uid === uid);
          if (user) {
            user.role = newRole;
          }
        }));
      },
      
      deleteUser: (uid) => {
        set(produce(state => {
          state.users = state.users.filter(u => u.uid !== uid);
        }));
        toast({ title: '¡Usuario eliminado!', variant: 'destructive' });
      }
    }),
    {
      name: 'users-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state, error) => {
        if (state) {
          if (error || !state.users || state.users.length === 0) {
            // If storage is empty or there's an error, initialize with default users
            state.users = initialUsers;
          } else {
            // This is the definitive fix:
            // Forcefully update the 'evirt@bemstore.hn' user to ensure it has the admin role,
            // overriding any incorrect data persisted in localStorage.
            const evirtUser = state.users.find(u => u.email === 'evirt@bemstore.hn');
            if (evirtUser) {
              if (evirtUser.role !== 'admin') {
                evirtUser.role = 'admin';
              }
            } else {
                // If the user doesn't exist at all, add them from the initial list.
                const initialEvirt = initialUsers.find(u => u.email === 'evirt@bemstore.hn');
                if (initialEvirt) {
                    state.users.push(initialEvirt);
                }
            }
          }
          state.setHasHydrated(true);
        }
      },
    }
  )
);
