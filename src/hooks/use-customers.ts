
'use client';

import { create } from 'zustand';
import type { Address } from './use-orders';
import { produce } from 'immer';
import { supabase } from '@/lib/supabase';
import { toast } from './use-toast';

export interface Customer {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  address: Address | null;
  total_spent: number;
  order_count: number;
}

type CustomersState = {
  customers: Customer[];
  isLoading: boolean;
  fetchCustomers: () => Promise<void>;
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
  (set, get) => ({
    customers: [],
    isLoading: true,
    
    fetchCustomers: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (error) {
            toast({ title: 'Error', description: 'No se pudieron cargar los clientes.', variant: 'destructive' });
            console.error(error);
            set({ isLoading: false });
            return;
        }
        set({ customers: data as Customer[], isLoading: false });
    },

    addOrUpdateCustomer: async ({ phone, name, address }) => {
      if ((!phone || phone.trim() === '') && (name.trim().toLowerCase() === 'consumidor final' || name.trim() === '')) {
          return null; 
      }
      
      try {
        let existingCustomer = null;
        if (phone) {
            const { data } = await supabase.from('customers').select('*').eq('phone', phone).single();
            existingCustomer = data;
        }
        
        if (existingCustomer) {
            // Update customer
            const { data: updatedCustomer, error } = await supabase
                .from('customers')
                .update({ name, address: address || existingCustomer.address })
                .eq('id', existingCustomer.id)
                .select()
                .single();
            if (error) throw error;
            
            set(produce(state => {
                const index = state.customers.findIndex(c => c.id === updatedCustomer.id);
                if (index !== -1) {
                    state.customers[index] = updatedCustomer as Customer;
                }
            }));
            return updatedCustomer.id;
        } else {
            // Create customer
            const { data: newCustomer, error } = await supabase
                .from('customers')
                .insert([{ name, phone, address, total_spent: 0, order_count: 0 }])
                .select()
                .single();
            if (error) throw error;

            set(produce(state => {
                state.customers.unshift(newCustomer as Customer);
            }));
            return newCustomer.id;
        }
      } catch (error: any) {
        toast({ title: 'Error', description: 'No se pudo guardar el cliente.', variant: 'destructive' });
        console.error(error);
        return null;
      }
    },
    
    addPurchaseToCustomer: async (customerId, amount) => {
      if (!customerId) return;
      try {
        const { error } = await supabase.rpc('increment_customer_purchase', {
            customer_id: customerId,
            purchase_amount: amount
        });
        if (error) throw error;

        set(produce(state => {
            const customer = state.customers.find(c => c.id === customerId);
            if (customer) {
                customer.total_spent += amount;
                customer.order_count += 1;
            }
        }));
      } catch (error: any) {
        toast({ title: 'Error', description: 'No se pudo actualizar el historial del cliente.', variant: 'destructive' });
        console.error(error);
      }
    },

    getCustomerById: (id) => {
      return get().customers.find((c) => c.id === id);
    },
  })
);
