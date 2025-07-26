
'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from './use-toast';
import { supabase } from '@/lib/supabase';
import type { Customer, Address } from '@/lib/types';
import { persist, createJSONStorage } from 'zustand/middleware';

type CustomersState = {
  customers: Customer[];
  isLoading: boolean;
  addOrUpdateCustomer: (
    data: {
      phone?: string;
      name: string;
      address?: Address | null;
    }
  ) => Promise<string | null>; 
  addPurchaseToCustomer: (customerId: string, amount: number) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
};

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set, get) => ({
        customers: [],
        isLoading: true,
        
        addOrUpdateCustomer: async ({ phone, name, address }) => {
            const trimmedName = name.trim();
            const trimmedPhone = phone?.trim();

            if (!trimmedName || trimmedName.toLowerCase() === 'consumidor final') {
                return null; // Return null for general consumer, no DB entry needed.
            }
            
            try {
                let existingCustomer: Customer | null = null;
                if (trimmedPhone) {
                    const { data } = await supabase.from('customers').select('*').eq('phone', trimmedPhone).single();
                    existingCustomer = data;
                }

                if (existingCustomer) {
                    if (existingCustomer.name !== trimmedName || JSON.stringify(existingCustomer.address) !== JSON.stringify(address)) {
                         const { error } = await supabase
                            .from('customers')
                            .update({ name: trimmedName, address: address || existingCustomer.address })
                            .eq('id', existingCustomer.id);
                        if (error) throw error;
                    }
                    return existingCustomer.id;
                } else {
                    const { data: newCustomer, error } = await supabase
                        .from('customers')
                        .insert({ name: trimmedName, phone: trimmedPhone, address })
                        .select('id')
                        .single();

                    if (error) throw error;
                    return newCustomer!.id;
                }
            } catch (error: any) {
                toast({ title: 'Error al gestionar cliente', description: error.message, variant: 'destructive' });
                return null;
            }
        },
        
        addPurchaseToCustomer: async (customerId, amount) => {
            if (!customerId) return;
            const { error } = await supabase.rpc('increment_customer_stats', {
                p_customer_id: customerId,
                p_purchase_amount: amount
            });

            if (error) {
                 console.error('Error updating customer stats via RPC:', error.message);
                 toast({ title: 'Error al actualizar estadísticas', description: 'No se pudo actualizar el total de compras del cliente.', variant: 'destructive' });
            }
        },

        getCustomerById: (id) => {
          return get().customers.find((c) => c.id === id);
        },
    }),
    {
      name: 'bem-customers-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoading = !state.customers.length;
      }
    }
  )
);

// Subscribe to real-time changes
if (typeof window !== 'undefined') {
  supabase
    .channel('customers')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
      const { setState } = useCustomersStore;

      if (payload.eventType === 'INSERT') {
        setState(produce(draft => {
            draft.customers.unshift(payload.new as Customer);
        }));
      }

      if (payload.eventType === 'UPDATE') {
        setState(produce(draft => {
            const index = draft.customers.findIndex(c => c.id === payload.new.id);
            if (index !== -1) draft.customers[index] = payload.new as Customer;
        }));
      }

      if (payload.eventType === 'DELETE') {
        setState(produce(draft => {
            draft.customers = draft.customers.filter(c => c.id !== payload.old.id);
        }));
      }
    })
    .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
            if (error) {
                toast({ title: 'Error al sincronizar clientes', description: error.message, variant: 'destructive' });
            } else {
                useCustomersStore.setState({ customers: data, isLoading: false });
            }
        }
    });
}
