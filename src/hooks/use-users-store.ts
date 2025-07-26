
'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from './use-toast';
import { useAuthStore } from './use-auth-store';
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
  updateUserRole: (userId: string, newRole: 'admin' | 'cajero') => void;
  deleteUser: (userId: string) => void;
};

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
        users: [],
        isLoading: true,
        
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
                toast({ title: '¡Rol Actualizado!', description: `El rol del usuario ha sido cambiado a ${newRole}.` });
            }
        },
        
        deleteUser: async (userId: string) => {
           toast({ title: 'Función no disponible', description: 'La eliminación de usuarios debe realizarse desde el panel de Supabase Auth.', variant: 'destructive' });
        },
    }),
    {
      name: 'bem-users-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoading = !state.users.length;
      }
    }
  )
);

// Subscribe to real-time changes
if (typeof window !== 'undefined') {
  supabase
    .channel('users')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
      const { setState } = useUsersStore;

      if (payload.eventType === 'INSERT') {
        setState(produce(draft => {
            draft.users.push(payload.new as UserDoc);
        }));
      }
      if (payload.eventType === 'UPDATE') {
        setState(produce(draft => {
            const index = draft.users.findIndex(u => u.id === payload.new.id);
            if (index !== -1) draft.users[index] = payload.new as UserDoc;
        }));
      }
      if (payload.eventType === 'DELETE') {
        setState(produce(draft => {
            draft.users = draft.users.filter(u => u.id !== payload.old.id);
        }));
      }
    })
    .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            const { data, error } = await supabase.from('users').select('id, email, role');
            if (error) {
                toast({ title: 'Error al sincronizar usuarios', description: error.message, variant: 'destructive' });
            } else {
                useUsersStore.setState({ users: data as UserDoc[], isLoading: false });
            }
        }
    });
}
