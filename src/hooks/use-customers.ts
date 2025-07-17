
'use client';

import { create } from 'zustand';
import { toast } from './use-toast';
import type { Address } from './use-orders';
import { SupabaseClient } from '@supabase/supabase-js';

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
  fetchCustomers: (supabase: SupabaseClient) => Promise<void>;
  addOrUpdateCustomer: (
    supabase: SupabaseClient,
    data: {
      phone: string;
      name: string;
      address?: Address | null;
      order_id: string;
      total_to_add: number;
    }
  ) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
};

export const useCustomersStore = create<CustomersState>((set, get) => ({
  customers: [],
  isLoading: false,
  fetchCustomers: async (supabase: SupabaseClient) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      set({ customers: data || [], isLoading: false });
    } catch (error: any) {
      toast({
        title: 'Error al cargar clientes',
        description: error.message,
        variant: 'destructive',
      });
      set({ isLoading: false });
    }
  },
  
  addOrUpdateCustomer: async (supabase, { phone, name, address, order_id, total_to_add }) => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      let customerData: Customer;

      if (existing) {
        // Update existing customer
        const { data: updated, error: updateError } = await supabase
          .from('customers')
          .update({
            name: name, // Always update name
            address: address || existing.address, // Update address if new one is provided
            total_spent: existing.total_spent + total_to_add,
            order_count: existing.order_count + 1,
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (updateError) throw updateError;
        customerData = updated;
        set({
          customers: get().customers.map((c) => (c.id === customerData.id ? customerData : c)),
        });
      } else {
        // Add new customer
        const { data: created, error: createError } = await supabase
          .from('customers')
          .insert({
            phone,
            name,
            address,
            total_spent: total_to_add,
            order_count: 1,
          })
          .select()
          .single();
        if (createError) throw createError;
        customerData = created;
        set({ customers: [...get().customers, customerData] });
      }
      
      // Link customer to the order
      const { error: orderUpdateError } = await supabase
          .from('orders')
          .update({ customer_id: customerData.id })
          .eq('id', order_id);
      if (orderUpdateError) {
          console.warn(`Could not link customer to order ${order_id}:`, orderUpdateError.message);
      }


    } catch (error: any) {
      toast({
        title: 'Error al guardar cliente',
        description: error.message,
        variant: 'destructive',
      });
    }
  },

  getCustomerById: (id) => {
    return get().customers.find((c) => c.id === id);
  },
}));
