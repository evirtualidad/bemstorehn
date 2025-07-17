
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import type { Address } from './use-orders';
import { produce } from 'immer';
import { supabaseClient } from '@/lib/supabase';

export interface Customer {
  id: string; // uuid
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
      phone: string;
      name: string;
      address?: Address | null;
      total_to_add: number;
    }
  ) => Promise<string | undefined>; // Returns customer ID
  getCustomerById: (id: string) => Customer | undefined;
};

export const useCustomersStore = create<CustomersState>((set, get) => ({
  customers: [],
  isLoading: false,
  fetchCustomers: async () => {
    set({ isLoading: true });
    const { data, error } = await supabaseClient
      .from('customers')
      .select('*')
      .order('total_spent', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los clientes.', variant: 'destructive' });
      set({ isLoading: false });
    } else {
      set({ customers: data as Customer[], isLoading: false });
    }
  },
  
  addOrUpdateCustomer: async ({ phone, name, address, total_to_add }) => {
    if (!phone && !name) {
        return undefined; // Do not create/update "Consumidor Final"
    }

    const { data: existingCustomer, error: findError } = await supabaseClient
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 is 'not found'
      toast({ title: 'Error', description: 'No se pudo verificar el cliente.', variant: 'destructive' });
      return;
    }

    if (existingCustomer) {
      // Update existing customer
      const { data: updatedCustomer, error: updateError } = await supabaseClient
        .from('customers')
        .update({
          name,
          address: address || existingCustomer.address,
          total_spent: existingCustomer.total_spent + total_to_add,
          order_count: existingCustomer.order_count + 1
        })
        .eq('id', existingCustomer.id)
        .select()
        .single();
      
      if (updateError) {
        toast({ title: 'Error', description: 'No se pudo actualizar el cliente.', variant: 'destructive' });
        return;
      }
      
      set(produce((state: CustomersState) => {
        const index = state.customers.findIndex(c => c.id === updatedCustomer.id);
        if (index !== -1) {
          state.customers[index] = updatedCustomer as Customer;
        } else {
          state.customers.push(updatedCustomer as Customer);
        }
      }));
      return updatedCustomer.id;

    } else {
      // Add new customer
      const { data: newCustomer, error: insertError } = await supabaseClient
        .from('customers')
        .insert([{
          phone,
          name,
          address: address || null,
          total_spent: total_to_add,
          order_count: 1
        }])
        .select()
        .single();

      if (insertError) {
        toast({ title: 'Error', description: 'No se pudo crear el nuevo cliente.', variant: 'destructive' });
        return;
      }

      set(produce((state: CustomersState) => {
        state.customers.push(newCustomer as Customer);
      }));
      return newCustomer.id;
    }
  },

  getCustomerById: (id) => {
    return get().customers.find((c) => c.id === id);
  },
}));
